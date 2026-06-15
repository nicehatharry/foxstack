import '../config/amplify'   // must be first
import React, { useState, useEffect, useRef, useCallback, ChangeEvent, FormEvent } from 'react';
import styled, { createGlobalStyle, keyframes, css } from 'styled-components';
import { withAuthenticator, type WithAuthenticatorProps } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { loadList, saveList, getRemoteEtag, type SyncStatus } from '../services/s3Storage';
import type { GroceryItem } from '../services/s3Storage';

// --- Global Style ---

const GlobalStyle = createGlobalStyle`
  * {
    -webkit-tap-highlight-color: transparent;
    box-sizing: border-box;
  }
  body {
    margin: 0;
    background: #f0ede8;
    font-family: 'Georgia', 'Times New Roman', serif;
    overscroll-behavior: none;
  }
`;

// --- Types (GroceryItem is imported from s3Storage) ---

interface FormData {
  item: string;
  store: string;
  department: string;
  quantity: string;
  acquired: boolean;
}

interface SortConfig {
  key: keyof GroceryItem | null;
  direction: 'asc' | 'desc';
}

// --- Animations ---

const slideUp = keyframes`
  from { transform: translateY(100%); }
  to   { transform: translateY(0); }
`;

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const strikeThrough = keyframes`
  from { width: 0%; }
  to   { width: 100%; }
`;

// --- Layout ---

const AppShell = styled.div`
  max-width: 390px;     /* covers Pixel 7 (412px) and iPhone 15 (393px) */
  margin: 0 auto;
  min-height: 100svh;
  display: flex;
  flex-direction: column;
  background: #f0ede8;
  position: relative;
`;

// --- Header ---

const TopBar = styled.header`
  background: #1a1a1a;
  color: #f0ede8;
  padding: 18px 20px 14px;
  position: sticky;
  top: 0;
  z-index: 100;
`;

const AppTitle = styled.h1`
  margin: 0 0 4px;
  font-size: 22px;
  font-weight: 400;
  letter-spacing: 0.04em;
  font-style: italic;
`;

const StatsRow = styled.div`
  display: flex;
  gap: 16px;
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #a0a0a0;
`;

const StatChip = styled.span<{ $highlight?: boolean }>`
  color: ${p => p.$highlight ? '#c8f59e' : '#a0a0a0'};
`;

const TopBarRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
`;

const SignOutBtn = styled.button`
  background: none;
  border: 1px solid #444;
  color: #888;
  font-family: 'Georgia', serif;
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 5px 10px;
  border-radius: 6px;
  cursor: pointer;
  flex-shrink: 0;
  margin-top: 2px;
  transition: border-color 0.15s, color 0.15s;

  &:hover {
    border-color: #888;
    color: #ccc;
  }
`;

// Sync status indicator — lives in the TopBar
const SyncBar = styled.div<{ $status: SyncStatus }>`
  display: ${p => p.$status === 'idle' ? 'none' : 'flex'};
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${p => {
    if (p.$status === 'error' || p.$status === 'conflict') return '#ff8a80';
    if (p.$status === 'saving') return '#c8f59e';
    return '#a0a0a0'; // loading
  }};
  transition: color 0.2s ease;
`;

const SyncDot = styled.span<{ $status: SyncStatus }>`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
  flex-shrink: 0;
  animation: ${p =>
    (p.$status === 'saving' || p.$status === 'loading')
      ? css`${keyframes`0%,100%{opacity:1}50%{opacity:0.2}`} 1s ease-in-out infinite`
      : 'none'
  };
`;

// Conflict / error banner that sits below the filter bar
const AlertBanner = styled.div<{ $variant: 'conflict' | 'error' }>`
  background: ${p => p.$variant === 'conflict' ? '#fff3e0' : '#fff0f0'};
  border-bottom: 1px solid ${p => p.$variant === 'conflict' ? '#ffe0b2' : '#ffd5d5'};
  padding: 10px 16px;
  font-size: 12px;
  font-family: 'Georgia', serif;
  color: ${p => p.$variant === 'conflict' ? '#e65100' : '#c62828'};
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

const AlertAction = styled.button`
  background: none;
  border: none;
  font-size: 11px;
  font-family: 'Georgia', serif;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  cursor: pointer;
  color: inherit;
  text-decoration: underline;
  padding: 0;
  flex-shrink: 0;
`;

// --- Filters ---

const FilterBar = styled.div`
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  background: #1a1a1a;
  border-bottom: 1px solid #2e2e2e;

  &::-webkit-scrollbar { display: none; }
`;

const FilterPill = styled.button<{ $active: boolean }>`
  flex-shrink: 0;
  padding: 6px 14px;
  border-radius: 999px;
  border: 1.5px solid ${p => p.$active ? '#c8f59e' : '#444'};
  background: ${p => p.$active ? '#c8f59e' : 'transparent'};
  color: ${p => p.$active ? '#1a1a1a' : '#aaa'};
  font-size: 12px;
  font-family: 'Georgia', serif;
  letter-spacing: 0.04em;
  cursor: pointer;
  transition: all 0.18s ease;
  -webkit-tap-highlight-color: transparent;
  min-height: 36px;
`;

// --- Item List ---

const ListArea = styled.main`
  flex: 1;
  padding: 16px;
  padding-bottom: 120px;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
`;

const SectionLabel = styled.div`
  font-size: 10px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #888;
  margin: 16px 0 8px;
  font-family: 'Georgia', serif;
`;

const ItemCard = styled.div<{ $acquired: boolean; $animIndex: number }>`
  background: #fff;
  border-radius: 12px;
  padding: 14px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  opacity: ${p => p.$acquired ? 0.6 : 1};
  transition: opacity 0.2s ease, transform 0.15s ease;
  animation: ${fadeIn} 0.3s ease both;
  animation-delay: ${p => p.$animIndex * 0.04}s;

  &:active {
    transform: scale(0.985);
  }
`;

const CheckCircle = styled.button<{ $checked: boolean }>`
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px solid ${p => p.$checked ? '#c8f59e' : '#ddd'};
  background: ${p => p.$checked ? '#c8f59e' : 'transparent'};
  flex-shrink: 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.18s ease;
  padding: 0;

  svg {
    opacity: ${p => p.$checked ? 1 : 0};
    transition: opacity 0.15s ease;
  }
`;

const ItemBody = styled.div`
  flex: 1;
  min-width: 0;
`;

const ItemName = styled.div<{ $acquired: boolean }>`
  font-size: 15px;
  color: #1a1a1a;
  font-family: 'Georgia', serif;
  position: relative;
  display: inline-block;

  ${p => p.$acquired && css`
    &::after {
      content: '';
      position: absolute;
      left: 0;
      top: 50%;
      height: 1.5px;
      background: #aaa;
      animation: ${strikeThrough} 0.25s ease forwards;
    }
  `}
`;

const ItemMeta = styled.div`
  font-size: 11px;
  color: #999;
  margin-top: 3px;
  letter-spacing: 0.02em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const QtyBadge = styled.span`
  background: #f0ede8;
  border-radius: 6px;
  padding: 2px 7px;
  font-size: 12px;
  color: #555;
  flex-shrink: 0;
  font-family: 'Georgia', serif;
`;

const ActionRow = styled.div`
  display: flex;
  gap: 6px;
  flex-shrink: 0;
`;

const IconBtn = styled.button<{ $variant: 'edit' | 'delete' }>`
  width: 34px;
  height: 34px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  background: ${p => p.$variant === 'delete' ? '#fff0f0' : '#f0f0ff'};
  color: ${p => p.$variant === 'delete' ? '#e05555' : '#5555cc'};
  transition: background 0.15s;

  &:active {
    background: ${p => p.$variant === 'delete' ? '#ffd9d9' : '#dcdcff'};
  }
`;

// --- Swipeable Item ---

/** Clip overflow so the sliding card doesn't show outside the row */
const SwipeRow = styled.div`
  position: relative;
  border-radius: 12px;
  margin-bottom: 10px;
  overflow: hidden;
  /* Prevent iOS rubber-band from interfering with horizontal swipe */
  touch-action: pan-y;
`;

/** The coloured action revealed behind the card */
const SwipeReveal = styled.div<{ $side: 'left' | 'right' }>`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  /* Edit (left swipe) = blue; Delete (right swipe) = red */
  background: ${p => p.$side === 'left' ? '#5555cc' : '#e05555'};
  justify-content: ${p => p.$side === 'left' ? 'flex-end' : 'flex-start'};
  padding: 0 22px;
  border-radius: 12px;
`;

const RevealIcon = styled.span`
  font-size: 20px;
  color: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  user-select: none;
`;

const RevealLabel = styled.span`
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.85);
  font-family: 'Georgia', serif;
`;

const springBack = keyframes`
  from { transform: translateX(var(--swipe-from)); }
  to   { transform: translateX(0); }
`;

/** The card that slides. CSS var --swipe-from lets the spring-back
 *  keyframe start from wherever the finger released. */
const SwipeCard = styled.div<{
  $springing: boolean;
  $exitDir: 'left' | 'right' | null;
}>`
  position: relative;
  z-index: 1;
  will-change: transform;
  border-radius: 12px;
  /* Spring back animation — CSS variable set inline on the element */
  ${p => p.$springing && css`
    animation: ${springBack} 0.32s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  `}
  ${p => p.$exitDir && css`
    transition: transform 0.22s ease-in, opacity 0.22s ease-in;
    opacity: 0;
    transform: translateX(${p.$exitDir === 'right' ? '110%' : '-110%'});
  `}
`;

// --- Swipeable Item component ---

interface SwipeableItemProps {
  onEdit: () => void;
  onDelete: () => void;
  children: React.ReactNode;
}

const SWIPE_THRESHOLD = 72; // px to commit action
const INTENT_RATIO   = 1.4; // horizontal must be N× more than vertical to lock in

const SwipeableItem: React.FC<SwipeableItemProps> = ({ onEdit, onDelete, children }) => {
  const [offsetX, setOffsetX]     = useState(0);
  const [springing, setSpringing] = useState(false);
  const [exitDir, setExitDir]     = useState<'left' | 'right' | null>(null);

  const startX     = useRef(0);
  const startY     = useRef(0);
  const currentX   = useRef(0);
  const isDragging = useRef(false);  // true once horizontal intent confirmed
  const pointerId  = useRef<number | null>(null);
  const cardRef    = useRef<HTMLDivElement>(null);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    // Only track one finger at a time
    if (pointerId.current !== null) return;
    pointerId.current = e.pointerId;
    startX.current    = e.clientX;
    startY.current    = e.clientY;
    currentX.current  = e.clientX;
    isDragging.current = false;
    setSpringing(false);
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (e.pointerId !== pointerId.current) return;

    const dx = e.clientX - startX.current;
    const dy = e.clientY - startY.current;

    if (!isDragging.current) {
      // Decide intent: only commit to horizontal swipe if dx dominates
      if (Math.abs(dx) < 4 && Math.abs(dy) < 4) return; // still in dead zone
      if (Math.abs(dy) > Math.abs(dx) * INTENT_RATIO) {
        // Vertical scroll wins — release this touch
        pointerId.current = null;
        return;
      }
      isDragging.current = true;
      // Lock touch-action to none on the card while swiping
      if (cardRef.current) cardRef.current.style.touchAction = 'none';
    }

    e.preventDefault();
    currentX.current = e.clientX;
    setOffsetX(dx);
  }, []);

  const commit = useCallback(() => {
    if (!isDragging.current) {
      pointerId.current = null;
      return;
    }
    isDragging.current = false;
    pointerId.current  = null;
    if (cardRef.current) cardRef.current.style.touchAction = '';

    const dx = currentX.current - startX.current;

    if (dx < -SWIPE_THRESHOLD) {
      // Swiped left → edit
      setExitDir('left');
      setTimeout(() => {
        setExitDir(null);
        setOffsetX(0);
        onEdit();
      }, 220);
    } else if (dx > SWIPE_THRESHOLD) {
      // Swiped right → delete
      setExitDir('right');
      setTimeout(() => {
        setExitDir(null);
        setOffsetX(0);
        onDelete();
      }, 220);
    } else {
      // Below threshold — spring back
      if (cardRef.current) {
        cardRef.current.style.setProperty('--swipe-from', `${dx}px`);
      }
      setSpringing(true);
      setOffsetX(0);
      setTimeout(() => setSpringing(false), 340);
    }
  }, [onEdit, onDelete]);

  const side: 'left' | 'right' | null =
    offsetX < -8 ? 'left' : offsetX > 8 ? 'right' : null;

  return (
    <SwipeRow>
      {/* Action revealed behind the card */}
      {side === 'left' && (
        <SwipeReveal $side="left">
          <RevealIcon>
            ✎
            <RevealLabel>Edit</RevealLabel>
          </RevealIcon>
        </SwipeReveal>
      )}
      {side === 'right' && (
        <SwipeReveal $side="right">
          <RevealIcon>
            ✕
            <RevealLabel>Delete</RevealLabel>
          </RevealIcon>
        </SwipeReveal>
      )}

      <SwipeCard
        ref={cardRef}
        $springing={springing}
        $exitDir={exitDir}
        style={!springing && !exitDir ? { transform: `translateX(${offsetX}px)` } : undefined}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={commit}
        onPointerCancel={commit}
      >
        {children}
      </SwipeCard>
    </SwipeRow>
  );
};

// --- Empty State ---

const EmptyState = styled.div`
  text-align: center;
  padding: 60px 24px;
  color: #aaa;
  font-family: 'Georgia', serif;
  font-style: italic;
  font-size: 15px;
  line-height: 1.6;
`;

// --- Bottom Sheet Form ---

const Overlay = styled.div<{ $visible: boolean }>`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.4);
  z-index: 200;
  opacity: ${p => p.$visible ? 1 : 0};
  pointer-events: ${p => p.$visible ? 'auto' : 'none'};
  transition: opacity 0.25s ease;
`;

const Sheet = styled.div<{ $visible: boolean }>`
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%) translateY(${p => p.$visible ? '0' : '100%'});
  width: 100%;
  max-width: 430px;
  background: #fff;
  border-radius: 20px 20px 0 0;
  z-index: 300;
  padding: 0 20px 32px;
  transition: transform 0.3s cubic-bezier(0.32, 0.72, 0, 1);
  box-shadow: 0 -8px 40px rgba(0,0,0,0.18);
  animation: ${p => p.$visible ? css`${slideUp} 0.3s cubic-bezier(0.32, 0.72, 0, 1)` : 'none'};
`;

const SheetHandle = styled.div`
  width: 36px;
  height: 4px;
  border-radius: 2px;
  background: #ddd;
  margin: 12px auto 18px;
`;

const SheetTitle = styled.h3`
  margin: 0 0 18px;
  font-size: 18px;
  font-weight: 400;
  font-family: 'Georgia', serif;
  font-style: italic;
  color: #1a1a1a;
`;

const FieldGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 12px;
`;

const FieldFull = styled.div`
  grid-column: 1 / -1;
`;

const FieldLabel = styled.label`
  display: block;
  font-size: 10px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #888;
  margin-bottom: 5px;
  font-family: 'Georgia', serif;
`;

const FieldInput = styled.input`
  width: 100%;
  padding: 11px 12px;
  border: 1.5px solid #e8e8e8;
  border-radius: 10px;
  font-size: 15px;
  font-family: 'Georgia', serif;
  background: #fafafa;
  color: #1a1a1a;
  outline: none;
  transition: border-color 0.15s;

  &:focus {
    border-color: #1a1a1a;
    background: #fff;
  }
`;

const FieldSelect = styled.select`
  width: 100%;
  padding: 11px 12px;
  border: 1.5px solid #e8e8e8;
  border-radius: 10px;
  font-size: 15px;
  font-family: 'Georgia', serif;
  background: #fafafa;
  color: #1a1a1a;
  outline: none;
  -webkit-appearance: none;
  transition: border-color 0.15s;

  &:focus {
    border-color: #1a1a1a;
    background: #fff;
  }
`;

const SubmitBtn = styled.button`
  width: 100%;
  padding: 15px;
  background: #1a1a1a;
  color: #c8f59e;
  border: none;
  border-radius: 12px;
  font-size: 15px;
  font-family: 'Georgia', serif;
  letter-spacing: 0.06em;
  cursor: pointer;
  margin-top: 8px;
  transition: background 0.15s;

  &:active {
    background: #333;
  }
`;

// --- FAB ---

const FAB = styled.button`
  position: fixed;
  bottom: 28px;
  right: 50%;
  transform: translateX(calc(50% - 16px));
  /* sits inside the 430px container with 16px right margin */
  width: 56px;
  height: 56px;
  border-radius: 16px;
  background: #1a1a1a;
  color: #c8f59e;
  border: none;
  font-size: 28px;
  cursor: pointer;
  box-shadow: 0 4px 20px rgba(0,0,0,0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 150;
  transition: transform 0.15s ease, background 0.15s;

  &:active {
    transform: translateX(calc(50% - 16px)) scale(0.93);
  }
`;

// --- Sort Bar ---

const SortBar = styled.div`
  display: flex;
  gap: 6px;
  padding: 8px 16px;
  overflow-x: auto;
  scrollbar-width: none;
  background: #f0ede8;

  &::-webkit-scrollbar { display: none; }
`;

const SortBtn = styled.button<{ $active: boolean }>`
  flex-shrink: 0;
  padding: 5px 12px;
  border-radius: 999px;
  border: 1.5px solid ${p => p.$active ? '#1a1a1a' : '#ccc'};
  background: ${p => p.$active ? '#1a1a1a' : 'transparent'};
  color: ${p => p.$active ? '#c8f59e' : '#888'};
  font-size: 11px;
  font-family: 'Georgia', serif;
  letter-spacing: 0.04em;
  cursor: pointer;
  transition: all 0.15s;
  min-height: 30px;
`;

// --- Main Component ---

// How often to poll S3 for changes from other users (milliseconds).
const POLL_INTERVAL_MS = 30_000;

// Debounce delay before flushing local changes to S3 (milliseconds).
// Prevents a PUT per keystroke during rapid edits.
const SAVE_DEBOUNCE_MS = 600;

const GroceryList: React.FC<WithAuthenticatorProps> = ({ signOut }) => {
  const [items, setItems] = useState<GroceryItem[]>([]);
  const [formData, setFormData] = useState<FormData>({
    item: '', store: '', department: 'Produce', quantity: '1', acquired: false
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: 'asc' });
  const [filterDept, setFilterDept] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<'All' | 'Acquired' | 'Pending'>('All');

  // S3 sync state
  const [syncStatus, setSyncStatus]   = useState<SyncStatus>('loading');
  const [alert, setAlert]             = useState<'conflict' | 'error' | null>(null);

  // Refs for S3 coordination — not part of render state
  const etagRef        = useRef<string>('');   // ETag of the version we last read/wrote
  const saveTimerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollTimerRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  // Track items in a ref so the debounced save closure always sees the latest value
  const itemsRef       = useRef<GroceryItem[]>([]);
  const isSavingRef    = useRef(false);        // guard against overlapping PUTs

  const departments = ['Produce', 'Dairy', 'Bakery', 'Meat', 'Fish', 'Frozen', 'Pantry', 'Household'];

  // -------------------------------------------------------------------------
  // S3 load
  // -------------------------------------------------------------------------

  const fetchList = useCallback(async () => {
    setSyncStatus('loading');
    setAlert(null);
    try {
      const { items: loaded, etag } = await loadList();
      etagRef.current = etag;
      setItems(loaded);
      itemsRef.current = loaded;
      setSyncStatus('idle');
    } catch {
      setSyncStatus('error');
      setAlert('error');
    }
  }, []);

  // Initial load on mount
  useEffect(() => {
    fetchList();
  }, [fetchList]);

  // -------------------------------------------------------------------------
  // S3 save — debounced, ETag-guarded
  // -------------------------------------------------------------------------

  const persistItems = useCallback((nextItems: GroceryItem[]) => {
    // Always update the ref so the scheduled flush sees the latest list
    itemsRef.current = nextItems;

    // Clear any pending flush and schedule a new one
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    setSyncStatus('saving');

    saveTimerRef.current = setTimeout(async () => {
      if (isSavingRef.current) return; // a save is already in flight
      isSavingRef.current = true;
      try {
        const result = await saveList(itemsRef.current, etagRef.current);
        if (result.conflict) {
          // Another user wrote to S3 between our last read and this write.
          // Reload the latest version and surface a conflict banner.
          setSyncStatus('conflict');
          setAlert('conflict');
          await fetchList();
        } else {
          etagRef.current = result.etag;
          setSyncStatus('idle');
        }
      } catch {
        setSyncStatus('error');
        setAlert('error');
      } finally {
        isSavingRef.current = false;
      }
    }, SAVE_DEBOUNCE_MS);
  }, [fetchList]);

  // -------------------------------------------------------------------------
  // Polling — HEAD requests to detect remote changes cheaply
  // -------------------------------------------------------------------------

  useEffect(() => {
    pollTimerRef.current = setInterval(async () => {
      // Skip poll while a save is in flight to avoid a false conflict signal
      if (isSavingRef.current || saveTimerRef.current) return;
      try {
        const remoteEtag = await getRemoteEtag();
        if (remoteEtag && remoteEtag !== etagRef.current) {
          await fetchList();
        }
      } catch {
        // Silently ignore poll errors — the user isn't waiting on a poll
      }
    }, POLL_INTERVAL_MS);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [fetchList]);

  // -------------------------------------------------------------------------
  // Wrap every state mutation to also trigger a debounced S3 save
  // -------------------------------------------------------------------------

  const updateItems = useCallback((updater: (prev: GroceryItem[]) => GroceryItem[]) => {
    setItems(prev => {
      const next = updater(prev);
      persistItems(next);
      return next;
    });
  }, [persistItems]);

  const resetForm = () => {
    setFormData({ item: '', store: '', department: 'Produce', quantity: '1', acquired: false });
    setEditingId(null);
  };

  const openAdd = () => { resetForm(); setSheetOpen(true); };

  const handleEdit = (item: GroceryItem) => {
    setFormData({ item: item.item, store: item.store, department: item.department, quantity: item.quantity, acquired: item.acquired });
    setEditingId(item.id);
    setSheetOpen(true);
  };

  const handleClose = () => { setSheetOpen(false); resetForm(); };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.item.trim()) return;

    if (editingId) {
      updateItems(prev =>
        prev.map(i => i.id === editingId ? { ...formData, id: editingId, quantity: formData.quantity } : i)
      );
    } else {
      const newItem: GroceryItem = { ...formData, acquired: false, id: Date.now().toString(), quantity: formData.quantity };
      updateItems(prev => [...prev, newItem]);
    }
    handleClose();
  };

  const handleDelete = (id: string) => {
    updateItems(prev => prev.filter(i => i.id !== id));
    if (editingId === id) handleClose();
  };

  const toggleAcquired = (id: string) => {
    updateItems(prev => prev.map(i => i.id === id ? { ...i, acquired: !i.acquired } : i));
  };

  const handleSort = (key: keyof GroceryItem) => {
    setSortConfig(prev => {
      if (prev.key === key) {
        if (prev.direction === 'desc') return { key: null, direction: 'asc' };
        return { key, direction: 'desc' };
      }
      return { key, direction: 'asc' };
    });
  };

  const processed = items
    .filter(item => {
      if (filterDept !== 'All' && item.department !== filterDept) return false;
      if (filterStatus === 'Acquired' && !item.acquired) return false;
      if (filterStatus === 'Pending' && item.acquired) return false;
      return true;
    })
    .sort((a, b) => {
      if (!sortConfig.key) return 0;
      let av: string | number | boolean = a[sortConfig.key];
      let bv: string | number | boolean = b[sortConfig.key];
      if (typeof av === 'string') av = av.toLowerCase();
      if (typeof bv === 'string') bv = bv.toLowerCase();
      if (av < bv) return sortConfig.direction === 'asc' ? -1 : 1;
      if (av > bv) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

  const pending = processed.filter(i => !i.acquired);
  const acquired = processed.filter(i => i.acquired);

  const stats = { total: items.length, acquired: items.filter(i => i.acquired).length };

  const sortKeys: { key: keyof GroceryItem; label: string }[] = [
    { key: 'item', label: 'Name' },
    { key: 'department', label: 'Dept' },
    { key: 'store', label: 'Store' },
    { key: 'quantity', label: 'Qty' },
  ];

  return (
    <>
      <GlobalStyle />
      <AppShell>
        {/* Header */}
        <TopBar>
          <TopBarRow>
            <AppTitle>Grocery List</AppTitle>
            <SignOutBtn onClick={signOut}>Sign out</SignOutBtn>
          </TopBarRow>
          <StatsRow>
            <StatChip>{stats.total} items</StatChip>
            <StatChip $highlight>{stats.acquired} acquired</StatChip>
            <StatChip>{stats.total - stats.acquired} remaining</StatChip>
          </StatsRow>
          <SyncBar $status={syncStatus}>
            <SyncDot $status={syncStatus} />
            {syncStatus === 'saving'   && 'Saving…'}
            {syncStatus === 'loading'  && 'Loading…'}
            {syncStatus === 'error'    && 'Save failed'}
            {syncStatus === 'conflict' && 'Refreshing…'}
          </SyncBar>
        </TopBar>

        {/* Department filters */}
        <FilterBar>
          {['All', ...departments].map(dept => (
            <FilterPill key={dept} $active={filterDept === dept} onClick={() => setFilterDept(dept)}>
              {dept}
            </FilterPill>
          ))}
        </FilterBar>

        {/* Conflict / error alerts */}
        {alert === 'conflict' && (
          <AlertBanner $variant="conflict">
            List was updated by another user — showing latest version.
            <AlertAction onClick={() => setAlert(null)}>Dismiss</AlertAction>
          </AlertBanner>
        )}
        {alert === 'error' && (
          <AlertBanner $variant="error">
            Could not reach the server.
            <AlertAction onClick={fetchList}>Retry</AlertAction>
          </AlertBanner>
        )}

        {/* Status + Sort */}
        <SortBar>
          {(['All', 'Pending', 'Acquired'] as const).map(s => (
            <SortBtn key={s} $active={filterStatus === s} onClick={() => setFilterStatus(s)}>{s}</SortBtn>
          ))}
          <span style={{ color: '#ccc', alignSelf: 'center', fontSize: 12, margin: '0 4px' }}>·</span>
          {sortKeys.map(({ key, label }) => (
            <SortBtn
              key={key}
              $active={sortConfig.key === key}
              onClick={() => handleSort(key)}
            >
              {label} {sortConfig.key === key ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
            </SortBtn>
          ))}
        </SortBar>

        {/* Item List */}
        <ListArea>
          {(syncStatus == 'idle' && processed.length === 0) && (
            <EmptyState>
              Your list is empty.<br />Tap <strong>+</strong> to add your first item.
            </EmptyState>
          )}
          {(syncStatus == 'loading' && processed.length === 0) && (
            <EmptyState>
              Loading...
            </EmptyState>
          )}

          {pending.length > 0 && (
            <>
              {filterStatus === 'All' && <SectionLabel>To Get — {pending.length}</SectionLabel>}
              {pending.map((item, i) => (
                <SwipeableItem
                  key={item.id}
                  onEdit={() => handleEdit(item)}
                  onDelete={() => handleDelete(item.id)}
                >
                  <ItemCard $acquired={false} $animIndex={i}>
                    <CheckCircle $checked={false} onClick={() => toggleAcquired(item.id)} aria-label="Mark acquired">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <polyline points="2,6 5,9 10,3" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </CheckCircle>
                    <ItemBody>
                      <ItemName $acquired={false}>{item.item}</ItemName>
                      <ItemMeta>
                        {item.store && <>{item.store} · </>}
                        {item.department}
                      </ItemMeta>
                    </ItemBody>
                    <QtyBadge>{item.quantity}</QtyBadge>
                    <ActionRow>
                      <IconBtn $variant="edit" onClick={() => handleEdit(item)} aria-label="Edit">✎</IconBtn>
                      <IconBtn $variant="delete" onClick={() => handleDelete(item.id)} aria-label="Delete">✕</IconBtn>
                    </ActionRow>
                  </ItemCard>
                </SwipeableItem>
              ))}
            </>
          )}

          {acquired.length > 0 && (
            <>
              <SectionLabel>In Cart — {acquired.length}</SectionLabel>
              {acquired.map((item, i) => (
                <SwipeableItem
                  key={item.id}
                  onEdit={() => handleEdit(item)}
                  onDelete={() => handleDelete(item.id)}
                >
                  <ItemCard $acquired={true} $animIndex={i}>
                    <CheckCircle $checked={true} onClick={() => toggleAcquired(item.id)} aria-label="Unmark">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <polyline points="2,6 5,9 10,3" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </CheckCircle>
                    <ItemBody>
                      <ItemName $acquired={true} style={{ textDecoration: 'line-through', color: '#aaa' }}>{item.item}</ItemName>
                      <ItemMeta>{item.department}</ItemMeta>
                    </ItemBody>
                    <QtyBadge>{item.quantity}</QtyBadge>
                    <ActionRow>
                      <IconBtn $variant="delete" onClick={() => handleDelete(item.id)} aria-label="Delete">✕</IconBtn>
                    </ActionRow>
                  </ItemCard>
                </SwipeableItem>
              ))}
            </>
          )}
        </ListArea>

        {/* FAB */}
        <FAB onClick={openAdd} aria-label="Add item">+</FAB>

        {/* Overlay */}
        <Overlay $visible={sheetOpen} onClick={handleClose} />

        {/* Bottom Sheet Form */}
        <Sheet $visible={sheetOpen}>
          <SheetHandle />
          <SheetTitle>{editingId ? 'Edit Item' : 'Add to List'}</SheetTitle>

          <form onSubmit={handleSubmit}>
            <FieldGrid>
              <FieldFull>
                <FieldLabel>Item name *</FieldLabel>
                <FieldInput
                  type="text"
                  name="item"
                  value={formData.item}
                  onChange={handleInputChange}
                  placeholder="e.g. Whole milk"
                  required
                  autoFocus={sheetOpen}
                />
              </FieldFull>

              <div>
                <FieldLabel>Quantity</FieldLabel>
                <FieldInput
                  type="text"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  placeholder="1"
                />
              </div>

              <div>
                <FieldLabel>Department</FieldLabel>
                <FieldSelect name="department" value={formData.department} onChange={handleInputChange}>
                  {departments.map(d => <option key={d} value={d}>{d}</option>)}
                </FieldSelect>
              </div>

              <FieldFull>
                <FieldLabel>Store (optional)</FieldLabel>
                <FieldInput
                  type="text"
                  name="store"
                  value={formData.store}
                  onChange={handleInputChange}
                  placeholder="e.g. Trader Joe's"
                />
              </FieldFull>
            </FieldGrid>

            <SubmitBtn type="submit">
              {editingId ? 'Save Changes' : 'Add Item'}
            </SubmitBtn>
          </form>
        </Sheet>
      </AppShell>
    </>
  );
};

export default withAuthenticator(GroceryList);