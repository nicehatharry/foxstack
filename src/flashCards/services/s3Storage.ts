/**
 * src/flashCards/services/s3Storage.ts
 *
 * All FlashCards S3 I/O lives here; no other file in this folder touches the
 * AWS SDK. Mirrors the credential pattern of the GroceryList sister app.
 *
 * Design decisions:
 *
 * 1. ONE OBJECT — the whole library (`DeckRecord[]`) is one JSON document at
 *    `awsConfig.s3.flashCardsKey`. Single user, infrequent writes (see
 *    useLibrarySync), so splitting cards/progress would only add partial-write
 *    states.
 *
 * 2. LAST-WRITE-WINS — no ETag, no `IfMatch`. A save is a plain PUT, so a stale
 *    device silently overwrites a newer one. Accepted trade-off (single user).
 *
 * 3. NEVER OVERWRITE WHAT WE COULDN'T READ — a missing object is a first run
 *    (`null`); anything else that fails (network, AccessDenied, malformed
 *    JSON/shape) throws, so the caller can't seed over real data.
 *
 * 4. CREDENTIALS — Cognito authenticated identity, exactly as in GroceryList's
 *    s3Storage.ts: the ID token is exchanged for STS credentials. Clients are
 *    cached by token string and rebuilt when Amplify refreshes it.
 *
 * 5. UNLOAD SAVES — on pagehide/visibilitychange the page may be torn down
 *    mid-request. `saveLibrary(…, { unloading: true })` (a) reuses the cached
 *    client instead of awaiting fetchAuthSession(), and (b) uses a `keepalive`
 *    client when the body fits the browser's 64 KB keepalive cap. Still
 *    best-effort: nothing can guarantee a request survives teardown.
 */

import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { fromCognitoIdentityPool } from '@aws-sdk/credential-provider-cognito-identity';
import { fetchAuthSession } from 'aws-amplify/auth';
import { awsConfig } from '../../config/aws';
import type { DeckRecord } from '../decks';

const { bucket, flashCardsKey: key } = awsConfig.s3;

// The Identity Pool login key format required by Cognito.
const loginKey = `cognito-idp.${awsConfig.region}.amazonaws.com/${awsConfig.userPoolId}`;

/** Browsers reject keepalive requests with bodies over 64 KB; stay safely under. */
const KEEPALIVE_MAX_BYTES = 60_000;

interface Clients {
  token: string;
  normal: S3Client;
  keepAlive: S3Client;
}

let cached: Clients | null = null;

function buildClients(idToken: string): Clients {
  // One provider shared by both clients, so warming one warms the other.
  const credentials = fromCognitoIdentityPool({
    clientConfig: { region: awsConfig.region },
    identityPoolId: awsConfig.identityPoolId,
    logins: { [loginKey]: idToken },
  });
  const base = { region: awsConfig.region, credentials };
  return {
    token: idToken,
    normal: new S3Client(base),
    keepAlive: new S3Client({ ...base, requestHandler: { keepAlive: true } }),
  };
}

async function getClients(): Promise<Clients> {
  const session = await fetchAuthSession();
  const idToken = session.tokens?.idToken?.toString();

  if (!idToken) {
    throw new Error(
      'No authenticated session found. ' +
      'The user must be signed in before making S3 requests.'
    );
  }

  if (!cached || cached.token !== idToken) cached = buildClients(idToken);
  return cached;
}

const isLibrary = (value: unknown): value is DeckRecord[] =>
  Array.isArray(value) &&
  value.every((deck) => {
    if (typeof deck !== 'object' || deck === null) return false;
    const d = deck as Partial<DeckRecord>;
    return (
      typeof d.id === 'string' &&
      typeof d.name === 'string' &&
      Array.isArray(d.wordBank) &&
      typeof d.progress === 'object' && d.progress !== null &&
      typeof d.progress.meta === 'object' && d.progress.meta !== null &&
      typeof d.progress.words === 'object' && d.progress.words !== null
    );
  });

/**
 * Fetch the library. Resolves `null` when the object doesn't exist yet (first
 * run). Throws on any other failure, including a malformed document.
 */
export async function loadLibrary(): Promise<DeckRecord[] | null> {
  const { normal } = await getClients();

  let raw: string;
  try {
    const response = await normal.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
    raw = (await response.Body?.transformToString()) ?? '';
  } catch (err: unknown) {
    const code = (err as { name?: string })?.name;
    if (code === 'NoSuchKey' || code === 'NotFound') return null;
    throw err;
  }

  const parsed: unknown = JSON.parse(raw);
  if (!isLibrary(parsed)) {
    throw new Error('FlashCards library document is malformed; refusing to use or overwrite it.');
  }
  return parsed;
}

/** Overwrite the library (last-write-wins). Throws on failure. */
export async function saveLibrary(
  decks: DeckRecord[],
  { unloading = false }: { unloading?: boolean } = {},
): Promise<void> {
  const body = JSON.stringify(decks);
  const useKeepAlive = unloading && new TextEncoder().encode(body).length <= KEEPALIVE_MAX_BYTES;

  // While unloading, don't wait on a session round-trip if a client is warm.
  const clients = unloading && cached ? cached : await getClients();
  const s3 = useKeepAlive ? clients.keepAlive : clients.normal;

  await s3.send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: body,
    ContentType: 'application/json',
  }));
}
