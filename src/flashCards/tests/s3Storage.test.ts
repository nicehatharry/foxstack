// @vitest-environment node
import { beforeEach, describe, it, expect, vi } from 'vitest';

import { emptyProgress } from '../decks';
import type { DeckRecord } from '../decks';

const h = vi.hoisted(() => ({
  send: vi.fn(),
  fetchAuthSession: vi.fn(),
}));

vi.mock('@aws-sdk/client-s3', () => ({
  S3Client: class {
    config: Record<string, unknown>;
    constructor(config: Record<string, unknown>) { this.config = config; }
    send(command: unknown) { return h.send(command, this.config); }
  },
  GetObjectCommand: class {
    kind = 'get';
    input: Record<string, unknown>;
    constructor(input: Record<string, unknown>) { this.input = input; }
  },
  PutObjectCommand: class {
    kind = 'put';
    input: Record<string, unknown>;
    constructor(input: Record<string, unknown>) { this.input = input; }
  },
}));
vi.mock('@aws-sdk/credential-provider-cognito-identity', () => ({
  fromCognitoIdentityPool: () => () => Promise.resolve({ accessKeyId: 'k', secretAccessKey: 's' }),
}));
vi.mock('aws-amplify/auth', () => ({ fetchAuthSession: h.fetchAuthSession }));
vi.mock('../../config/aws', () => ({
  awsConfig: {
    region: 'us-east-1',
    userPoolId: 'pool',
    userPoolClientId: 'client',
    identityPoolId: 'identity',
    s3: { bucket: 'foxstack', key: 'grocery-lists/list.json', flashCardsKey: 'flashcards/library.json' },
  },
}));

const deck = (name = 'Animals'): DeckRecord => ({ id: 'd1', name, wordBank: [], progress: emptyProgress() });
const bodyOf = (json: unknown) => ({ Body: { transformToString: async () => JSON.stringify(json) } });

type Service = typeof import('../services/s3Storage');
let svc: Service;

beforeEach(async () => {
  h.send.mockReset();
  h.fetchAuthSession.mockReset();
  h.fetchAuthSession.mockResolvedValue({ tokens: { idToken: { toString: () => 'token-1' } } });
  vi.resetModules(); // the service caches its clients at module level
  svc = await import('../services/s3Storage');
});

describe('loadLibrary', () => {
  it('reads the FlashCards key and returns the decks', async () => {
    h.send.mockResolvedValue(bodyOf([deck()]));
    expect(await svc.loadLibrary()).toEqual([deck()]);
    expect(h.send.mock.calls[0][0]).toMatchObject({
      kind: 'get',
      input: { Bucket: 'foxstack', Key: 'flashcards/library.json' },
    });
  });

  it('returns null when the object does not exist (first run)', async () => {
    h.send.mockRejectedValue({ name: 'NoSuchKey' });
    expect(await svc.loadLibrary()).toBeNull();
  });

  it('throws on any other failure, so the caller can never seed over real data', async () => {
    h.send.mockRejectedValue({ name: 'AccessDenied' });
    await expect(svc.loadLibrary()).rejects.toMatchObject({ name: 'AccessDenied' });
  });

  it('throws on a malformed document', async () => {
    h.send.mockResolvedValue(bodyOf({ nope: 1 }));
    await expect(svc.loadLibrary()).rejects.toThrow(/malformed/);
    h.send.mockResolvedValue(bodyOf([{ id: 'd1', name: 'x' }]));
    await expect(svc.loadLibrary()).rejects.toThrow(/malformed/);
  });

  it('throws when not signed in', async () => {
    h.fetchAuthSession.mockResolvedValue({ tokens: undefined });
    await expect(svc.loadLibrary()).rejects.toThrow(/authenticated session/);
  });
});

describe('saveLibrary', () => {
  it('PUTs the whole library unconditionally (last-write-wins: no IfMatch)', async () => {
    h.send.mockResolvedValue({});
    await svc.saveLibrary([deck()]);
    const [command, config] = h.send.mock.calls[0];
    expect(command).toMatchObject({
      kind: 'put',
      input: { Bucket: 'foxstack', Key: 'flashcards/library.json', ContentType: 'application/json' },
    });
    expect((command as { input: Record<string, unknown> }).input).not.toHaveProperty('IfMatch');
    expect(JSON.parse((command as { input: { Body: string } }).input.Body)).toEqual([deck()]);
    expect(config).not.toHaveProperty('requestHandler'); // normal client
  });

  it('propagates failures', async () => {
    h.send.mockRejectedValue(new Error('offline'));
    await expect(svc.saveLibrary([deck()])).rejects.toThrow('offline');
  });

  it('uses the keepalive client when unloading with a small body', async () => {
    h.send.mockResolvedValue({});
    await svc.saveLibrary([deck()], { unloading: true });
    expect(h.send.mock.calls[0][1]).toMatchObject({ requestHandler: { keepAlive: true } });
  });

  it('falls back to the normal client when the body exceeds the keepalive cap', async () => {
    h.send.mockResolvedValue({});
    await svc.saveLibrary([deck('x'.repeat(70_000))], { unloading: true });
    expect(h.send.mock.calls[0][1]).not.toHaveProperty('requestHandler');
  });

  it('skips the session round-trip when unloading with a warm client', async () => {
    h.send.mockResolvedValue(bodyOf([deck()]));
    await svc.loadLibrary(); // warms the cache
    h.fetchAuthSession.mockClear();
    h.send.mockResolvedValue({});
    await svc.saveLibrary([deck()], { unloading: true });
    expect(h.fetchAuthSession).not.toHaveBeenCalled();
  });

  it('still resolves a session when unloading with a cold cache', async () => {
    h.send.mockResolvedValue({});
    await svc.saveLibrary([deck()], { unloading: true });
    expect(h.fetchAuthSession).toHaveBeenCalledTimes(1);
  });
});
