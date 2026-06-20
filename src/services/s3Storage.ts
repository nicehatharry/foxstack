/**
 * src/services/s3Storage.ts
 *
 * All S3 I/O lives here. The component never touches the AWS SDK directly.
 *
 * Design decisions:
 *
 * 1. CREDENTIALS — Cognito authenticated identities.
 *    fetchAuthSession() (Amplify v6) returns the signed-in user's ID token.
 *    That token is passed as the `logins` key to fromCognitoIdentityPool(),
 *    which exchanges it for short-lived STS credentials scoped to the
 *    authenticated IAM role. No API keys are ever embedded in client code.
 *
 * 2. S3 CLIENT CACHING BY TOKEN — The S3 client cannot be a module-level
 *    singleton because the Cognito ID token changes on each session refresh
 *    (typically every hour). We cache the client by token string:
 *      - Same token → reuse the existing client (and its cached STS creds).
 *      - New token   → build a fresh client with the updated login key.
 *    fetchAuthSession() is called before every S3 operation; Amplify handles
 *    JWT refresh transparently so we always get a valid token.
 *
 * 3. SHARED DATA / CONCURRENCY — one canonical document at a fixed S3 key.
 *    ETag-based optimistic locking:
 *      - GET returns the current ETag alongside the data.
 *      - PUT sends `IfMatch: <etag>`. If another user saved in the meantime,
 *        S3 returns 412 Precondition Failed → caller gets { conflict: true }.
 *
 * 4. POLLING — getRemoteEtag() issues a cheap HEAD request (no data transfer)
 *    to detect remote changes. The component polls on an interval and reloads
 *    when the ETag diverges from the last known value.
 */

import { S3Client, GetObjectCommand, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { fromCognitoIdentityPool } from '@aws-sdk/credential-provider-cognito-identity';
import { fetchAuthSession } from 'aws-amplify/auth';
import { awsConfig } from '../config/aws';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Fixed set of stores a shopper can tag an item with. A single item can
 * belong to more than one store (e.g. milk you'd buy at either Aldi or
 * Whole Foods), so `GroceryItem.store` is an array drawn from this list.
 */
export const STORE_OPTIONS = [
  'Aldi',
  "Trader Joe's",
  'Target',
  'Whole Foods',
  'Regular Grocery',
  'Hardware Store',
  'Other',
] as const;

export type StoreOption = typeof STORE_OPTIONS[number];

export interface GroceryItem {
  id: string;
  item: string;
  /** Zero or more stores this item can be bought at. Empty array = no preference. */
  store: string[];
  department: string;
  quantity: string;
  acquired: boolean;
}

export type SyncStatus = 'idle' | 'loading' | 'saving' | 'conflict' | 'error';

export interface LoadResult {
  items: GroceryItem[];
  etag: string;
}

export interface SaveResult {
  etag: string;       // ETag of the object we just wrote
  conflict: boolean;  // true when S3 returned 412 (someone else saved first)
}

// ---------------------------------------------------------------------------
// S3 client — cached by ID token string
// ---------------------------------------------------------------------------

// The Identity Pool login key format required by Cognito.
const loginKey = `cognito-idp.${awsConfig.region}.amazonaws.com/${awsConfig.userPoolId}`;

let cachedClient: S3Client | null = null;
let cachedToken:  string | null   = null;

/**
 * Returns an S3Client built with the current user's Cognito credentials.
 * Reuses the cached client as long as the ID token hasn't changed.
 * Amplify auto-refreshes the JWT before it expires; when the token string
 * changes, a new client is created with the updated login key.
 */
async function getS3Client(): Promise<S3Client> {
  const session = await fetchAuthSession();
  const idToken = session.tokens?.idToken?.toString();

  if (!idToken) {
    throw new Error(
      'No authenticated session found. ' +
      'The user must be signed in before making S3 requests.'
    );
  }

  if (cachedClient && cachedToken === idToken) {
    return cachedClient;
  }

  cachedToken  = idToken;
  cachedClient = new S3Client({
    region: awsConfig.region,
    credentials: fromCognitoIdentityPool({
      clientConfig: { region: awsConfig.region },
      identityPoolId: awsConfig.identityPoolId,
      logins: { [loginKey]: idToken },
    }),
  });

  return cachedClient;
}

const { bucket, key } = awsConfig.s3;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Read the ReadableStream body returned by GetObjectCommand into a string. */
async function bodyToString(body: unknown): Promise<string> {
  if (body instanceof ReadableStream) {
    const reader = body.getReader();
    const chunks: Uint8Array[] = [];
    let done = false;
    while (!done) {
      const { value, done: d } = await reader.read();
      done = d;
      if (value) chunks.push(value);
    }
    return new TextDecoder().decode(
      chunks.reduce((acc, chunk) => {
        const merged = new Uint8Array(acc.length + chunk.length);
        merged.set(acc, 0);
        merged.set(chunk, acc.length);
        return merged;
      }, new Uint8Array(0))
    );
  }
  if (typeof body === 'string') return body;
  if (body instanceof Blob) return body.text();
  throw new Error('Unrecognised S3 response body type');
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Fetch the shared list from S3.
 * Returns an empty array when the object does not yet exist (first run).
 */
export async function loadList(): Promise<LoadResult> {
  const s3 = await getS3Client();
  try {
    const response = await s3.send(
      new GetObjectCommand({ Bucket: bucket, Key: key })
    );
    const raw   = await bodyToString(response.Body);
    const items = JSON.parse(raw) as GroceryItem[];
    const etag  = response.ETag ?? '';
    return { items, etag };
  } catch (err: unknown) {
    const code = (err as { name?: string })?.name;
    if (code === 'NoSuchKey' || code === 'NotFound') {
      return { items: [], etag: '' };
    }
    throw err;
  }
}

/**
 * Write the shared list back to S3 with ETag-guarded optimistic locking.
 *
 * @param items - Full list to persist.
 * @param etag  - ETag from the last successful load or save.
 *                Pass '' to unconditionally overwrite on first write.
 *
 * Returns { etag, conflict: false } on success.
 * Returns { etag: '', conflict: true } on 412 (another user saved first).
 * Throws on any other error.
 */
export async function saveList(
  items: GroceryItem[],
  etag: string
): Promise<SaveResult> {
  const s3   = await getS3Client();
  const body = JSON.stringify(items);

  const params: ConstructorParameters<typeof PutObjectCommand>[0] = {
    Bucket:      bucket,
    Key:         key,
    Body:        body,
    ContentType: 'application/json',
    ...(etag ? { IfMatch: etag } : {}),
  };

  try {
    const response = await s3.send(new PutObjectCommand(params));
    return { etag: response.ETag ?? '', conflict: false };
  } catch (err: unknown) {
    const status = (err as { $metadata?: { httpStatusCode?: number } })
      ?.$metadata?.httpStatusCode;
    if (status === 412) {
      return { etag: '', conflict: true };
    }
    throw err;
  }
}

/**
 * Cheap HEAD request to check whether the shared list has been updated
 * by another user. Used by the polling interval in the component.
 * Returns the current ETag, or null if the object doesn't exist yet.
 */
export async function getRemoteEtag(): Promise<string | null> {
  const s3 = await getS3Client();
  try {
    const response = await s3.send(
      new HeadObjectCommand({ Bucket: bucket, Key: key })
    );
    return response.ETag ?? null;
  } catch (err: unknown) {
    const code = (err as { name?: string })?.name;
    if (code === 'NoSuchKey' || code === 'NotFound') return null;
    throw err;
  }
}