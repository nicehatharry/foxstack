
import { S3Client, GetObjectCommand, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { fromCognitoIdentityPool } from '@aws-sdk/credential-provider-cognito-identity';
import { awsConfig } from '../config/aws';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GroceryItem {
  id: string;
  item: string;
  store: string;
  department: string;
  quantity: number;
  acquired: boolean;
}

export type SyncStatus = 'idle' | 'loading' | 'saving' | 'conflict' | 'error';

export interface LoadResult {
  items: GroceryItem[];
  etag: string;
}

export interface SaveResult {
  etag: string;         // ETag of the object we just wrote
  conflict: boolean;    // true when S3 returned 412 (someone else saved first)
}

// ---------------------------------------------------------------------------
// S3 client (singleton)
// ---------------------------------------------------------------------------

// Credentials are lazily resolved and auto-refreshed by the SDK.
const credentials = fromCognitoIdentityPool({
  clientConfig: { region: awsConfig.region },
  identityPoolId: awsConfig.identityPoolId,
});

const s3 = new S3Client({
  region: awsConfig.region,
  credentials,
});

const { bucket, key } = awsConfig.s3;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Read the Response body stream from GetObjectCommand into a string. */
async function bodyToString(body: unknown): Promise<string> {
  // AWS SDK v3 returns a ReadableStream in browser environments.
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
  // Fallback for Node/test environments (Blob, Buffer, string).
  if (typeof body === 'string') return body;
  if (body instanceof Blob) return body.text();
  throw new Error('Unrecognised S3 response body type');
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Fetch the shared list from S3.
 * Returns an empty array (with a synthetic ETag) when the object does not
 * yet exist so first-run works without any manual bucket setup.
 */
export async function loadList(): Promise<LoadResult> {
  try {
    const response = await s3.send(
      new GetObjectCommand({ Bucket: bucket, Key: key })
    );

    const raw  = await bodyToString(response.Body);
    const items: GroceryItem[] = JSON.parse(raw);
    const etag = response.ETag ?? '';

    return { items, etag };
  } catch (err: unknown) {
    // Object doesn't exist yet — treat as an empty list.
    const code = (err as { name?: string })?.name;
    if (code === 'NoSuchKey' || code === 'NotFound') {
      return { items: [], etag: '' };
    }
    throw err;
  }
}

/**
 * Write the shared list back to S3.
 *
 * @param items  - Full list to persist.
 * @param etag   - ETag from the last successful load or save.
 *                 Pass '' to unconditionally overwrite (first write only).
 *
 * Returns { etag, conflict: false } on success.
 * Returns { etag: '', conflict: true } when another user saved first (412).
 * Throws on any other error.
 */
export async function saveList(
  items: GroceryItem[],
  etag: string
): Promise<SaveResult> {
  const body = JSON.stringify(items);

  const params: ConstructorParameters<typeof PutObjectCommand>[0] = {
    Bucket:      bucket,
    Key:         key,
    Body:        body,
    ContentType: 'application/json',
    // Only overwrite if the ETag still matches what we last read.
    // Skip the condition on first write (etag is empty string).
    ...(etag ? { IfMatch: etag } : {}),
  };

  try {
    const response = await s3.send(new PutObjectCommand(params));
    return { etag: response.ETag ?? '', conflict: false };
  } catch (err: unknown) {
    const status = (err as { $metadata?: { httpStatusCode?: number } })
      ?.$metadata?.httpStatusCode;

    if (status === 412) {
      // Precondition Failed — another user wrote to the object after our
      // last read. Signal the conflict to the caller; do not throw.
      return { etag: '', conflict: true };
    }
    throw err;
  }
}

/**
 * Cheap HEAD request to check whether the shared list has changed since
 * we last loaded it. Used by the polling interval in the component.
 *
 * Returns the current ETag, or null if the object doesn't exist yet.
 */
export async function getRemoteEtag(): Promise<string | null> {
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
