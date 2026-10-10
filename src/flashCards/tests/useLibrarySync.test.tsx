// @vitest-environment jsdom
import { afterEach, describe, it, expect, vi } from 'vitest';
import { renderHook, act, cleanup } from '@testing-library/react';

import { useLibrarySync } from '../useLibrarySync';
import { emptyProgress } from '../decks';
import type { DeckRecord } from '../decks';

afterEach(() => {
  cleanup();
  Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
});

const lib = (name: string): DeckRecord[] => [
  { id: 'd1', name, wordBank: [], progress: emptyProgress() },
];

const deferred = () => {
  let resolve!: () => void;
  const promise = new Promise<void>((res) => { resolve = res; });
  return { promise, resolve };
};

describe('useLibrarySync', () => {
  it('records changes but writes nothing until flushed', async () => {
    const save = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useLibrarySync(save));
    const a = lib('a');

    act(() => result.current.onLibraryChange(a));
    expect(save).not.toHaveBeenCalled();
    expect(result.current.status).toBe('unsaved');

    await act(() => result.current.flush());
    expect(save).toHaveBeenCalledTimes(1);
    expect(save).toHaveBeenCalledWith(a, { unloading: false });
    expect(result.current.status).toBe('idle');
  });

  it('flush with nothing dirty is a no-op', async () => {
    const save = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useLibrarySync(save));
    await act(() => result.current.flush());
    expect(save).not.toHaveBeenCalled();

    act(() => result.current.onLibraryChange(lib('a')));
    await act(() => result.current.flush());
    await act(() => result.current.flush());
    expect(save).toHaveBeenCalledTimes(1);
  });

  it('writes only the newest snapshot', async () => {
    const save = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useLibrarySync(save));
    const b = lib('b');
    act(() => result.current.onLibraryChange(lib('a')));
    act(() => result.current.onLibraryChange(b));
    await act(() => result.current.flush());
    expect(save).toHaveBeenCalledTimes(1);
    expect(save).toHaveBeenCalledWith(b, { unloading: false });
  });

  it('keeps the library dirty after a failed write, and the next flush retries', async () => {
    const save = vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValue(undefined);
    const { result } = renderHook(() => useLibrarySync(save));
    const a = lib('a');
    act(() => result.current.onLibraryChange(a));

    await act(() => result.current.flush());
    expect(result.current.status).toBe('error');

    await act(() => result.current.flush());
    expect(save).toHaveBeenCalledTimes(2);
    expect(save).toHaveBeenLastCalledWith(a, { unloading: false });
    expect(result.current.status).toBe('idle');
  });

  it('serializes writes: a flush mid-write queues one follow-up with the newest snapshot', async () => {
    const gate = deferred();
    const save = vi.fn().mockReturnValueOnce(gate.promise).mockResolvedValue(undefined);
    const { result } = renderHook(() => useLibrarySync(save));
    const b = lib('b');

    act(() => result.current.onLibraryChange(lib('a')));
    let first!: Promise<void>;
    act(() => { first = result.current.flush(); });
    expect(save).toHaveBeenCalledTimes(1);

    act(() => result.current.onLibraryChange(b));
    let second!: Promise<void>;
    act(() => { second = result.current.flush(); });
    expect(save).toHaveBeenCalledTimes(1); // still the first write in flight

    await act(async () => {
      gate.resolve();
      await Promise.all([first, second]);
    });
    expect(save).toHaveBeenCalledTimes(2);
    expect(save).toHaveBeenLastCalledWith(b, { unloading: false });
    expect(result.current.status).toBe('idle');
  });

  it('flushes on pagehide as an unloading write, and the flag does not stick', async () => {
    const save = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useLibrarySync(save));
    const a = lib('a');
    act(() => result.current.onLibraryChange(a));

    await act(async () => { window.dispatchEvent(new Event('pagehide')); });
    expect(save).toHaveBeenCalledWith(a, { unloading: true });

    act(() => result.current.onLibraryChange(lib('b')));
    await act(() => result.current.flush());
    expect(save).toHaveBeenLastCalledWith(expect.anything(), { unloading: false });
  });

  it('flushes when the page becomes hidden, not when it becomes visible', async () => {
    const save = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useLibrarySync(save));
    act(() => result.current.onLibraryChange(lib('a')));

    await act(async () => { document.dispatchEvent(new Event('visibilitychange')); });
    expect(save).not.toHaveBeenCalled(); // still visible

    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
    await act(async () => { document.dispatchEvent(new Event('visibilitychange')); });
    expect(save).toHaveBeenCalledWith(expect.anything(), { unloading: true });
  });

  it('retries when the browser comes back online', async () => {
    const save = vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValue(undefined);
    const { result } = renderHook(() => useLibrarySync(save));
    act(() => result.current.onLibraryChange(lib('a')));
    await act(() => result.current.flush());
    expect(result.current.status).toBe('error');

    await act(async () => { window.dispatchEvent(new Event('online')); });
    expect(save).toHaveBeenCalledTimes(2);
    expect(result.current.status).toBe('idle');
  });

  it('flushes on unmount', async () => {
    const save = vi.fn().mockResolvedValue(undefined);
    const { result, unmount } = renderHook(() => useLibrarySync(save));
    const a = lib('a');
    act(() => result.current.onLibraryChange(a));
    unmount();
    expect(save).toHaveBeenCalledWith(a, { unloading: false });
  });
});
