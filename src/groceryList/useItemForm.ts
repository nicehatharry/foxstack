import { useState, useEffect, useRef, useCallback } from 'react';
import type { ChangeEvent, SubmitEvent, KeyboardEvent } from 'react';
import type { ItemData, GroceryItem } from './GroceryList.types';
import { loadHistory, saveHistory } from '../services/s3Storage';
import type { ItemHistory } from '../services/s3Storage';

const EMPTY_FORM: ItemData = { item: '', store: [], department: 'Produce', quantity: '1', acquired: false, notes: '' };

/**
 * Controls the add/edit bottom sheet: open/closed state, which item (if
 * any) is being edited, and the controlled form fields. Takes
 * `updateItems` from useGrocerySync so submitting/deleting here still
 * goes through the debounced S3 save.
 *
 * Open the sheet for a *new* item with `openAdd()`; open it pre-filled
 * for an *existing* item with `handleEdit(item)`. `editingId` is what
 * distinguishes "Add Item" vs "Save Changes" in handleSubmit and in the
 * sheet title.
 *
 * AUTOCOMPLETE / HISTORY
 * ----------------------
 * History is loaded once from S3 on the first time the sheet opens and
 * cached in module-level state for the rest of the session (avoids a
 * network round-trip on every open). The cache is updated optimistically
 * on every submit so the dropdown reflects the latest entry immediately,
 * even before the S3 write completes.
 *
 * Suggestions are keyed by lowercased item name. On focus or typing in
 * the item name field, matching names are shown in a dropdown. Selecting
 * a suggestion populates all fields except `acquired` (always false for
 * new items) from the stored history entry.
 *
 * This is the file to touch for: "add a new field to the form",
 * "change form validation", "the sheet doesn't reset between items",
 * "change autocomplete matching behaviour".
 */

// Module-level cache so history is only fetched once per session.
let historyCache: ItemHistory | null = null;
let historyLoadPromise: Promise<ItemHistory> | null = null;

async function getHistory(): Promise<ItemHistory> {
  if (historyCache !== null) return historyCache;
  if (!historyLoadPromise) {
    historyLoadPromise = loadHistory().then(h => {
      historyCache = h;
      return h;
    });
  }
  return historyLoadPromise;
}

/** Derive the history key from an item name: lowercase + trimmed. */
function historyKey(name: string): string {
  return name.trim().toLowerCase();
}

export function useItemForm(
  updateItems: (updater: (prev: GroceryItem[]) => GroceryItem[]) => void
) {
  const [itemData, setItemData] = useState<ItemData>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  // Autocomplete state
  const [history, setHistory] = useState<ItemHistory>({});
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [activeSuggestion, setActiveSuggestion] = useState<number>(-1);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Ref for the name input — used to return focus after selecting a suggestion.
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Load history once when the sheet first opens.
  useEffect(() => {
    if (!sheetOpen) return;
    getHistory().then(h => setHistory(h));
  }, [sheetOpen]);

  // Recompute filtered suggestions whenever the item name or history changes.
  useEffect(() => {
    const q = itemData.item.trim().toLowerCase();
    if (!q) {
      // Empty input: show all history entries (most useful on mobile focus).
      const all = Object.keys(history).sort();
      setSuggestions(all);
    } else {
      // Prefix match first, then substring match, deduplicated and sorted.
      const keys = Object.keys(history);
      const prefix = keys.filter(k => k.startsWith(q));
      const substr = keys.filter(k => !k.startsWith(q) && k.includes(q));
      setSuggestions([...prefix.sort(), ...substr.sort()]);
    }
    setActiveSuggestion(-1);
  }, [itemData.item, history]);

  const resetForm = () => {
    setItemData(EMPTY_FORM);
    setEditingId(null);
  };

  const closeDropdown = useCallback(() => {
    setDropdownOpen(false);
    setActiveSuggestion(-1);
  }, []);

  const openAdd = () => { resetForm(); setSheetOpen(true); };

  const handleEdit = (item: GroceryItem) => {
    setItemData({ item: item.item, store: item.store, department: item.department, quantity: item.quantity, acquired: item.acquired, notes: item.notes ?? '' });
    setEditingId(item.id);
    setSheetOpen(true);
  };

  const handleClose = () => {
    setSheetOpen(false);
    closeDropdown();
    resetForm();
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setItemData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
    if (name === 'item') {
      setDropdownOpen(true);
    }
  };

  const handleNameFocus = () => {
    setDropdownOpen(true);
  };

  /**
   * Keyboard navigation inside the name input.
   * Arrow keys move the active suggestion; Enter selects it; Escape closes.
   * Tab closes the dropdown without selecting (natural form navigation).
   */
  const handleNameKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!dropdownOpen || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveSuggestion(prev => (prev + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveSuggestion(prev => (prev <= 0 ? suggestions.length - 1 : prev - 1));
    } else if (e.key === 'Enter' && activeSuggestion >= 0) {
      // Prevent form submission when navigating suggestions.
      e.preventDefault();
      selectSuggestion(suggestions[activeSuggestion]);
    } else if (e.key === 'Escape' || e.key === 'Tab') {
      closeDropdown();
    }
  };

  /**
   * Populate the form from a history entry.
   * The display name is derived from the suggestion key (which is lowercased
   * for lookup) by finding an existing item that matches — we preserve the
   * original casing stored in history by using the item name from the last
   * save, reconstructed here by capitalising the first letter as a fallback
   * when no casing record exists. Since we store the name in the history
   * entry's key (lowercased), we reconstruct display casing by title-casing
   * the key. Callers that need canonical casing should store it separately,
   * but title-casing is good enough for grocery item names.
   */
  const selectSuggestion = useCallback((key: string) => {
    const entry = history[key];
    if (!entry) return;

    // Reconstruct a display name: title-case the key as a reasonable default.
    const displayName = key.replace(/\b\w/g, c => c.toUpperCase());

    setItemData(prev => ({
      ...prev,
      item:       displayName,
      store:      entry.store,
      department: entry.department,
      quantity:   entry.quantity,
      notes:      entry.notes,
      // acquired is intentionally left as prev.acquired (always false for new items)
    }));

    closeDropdown();
    // Return focus to the input so the user can immediately edit or submit.
    nameInputRef.current?.focus();
  }, [history, closeDropdown]);

  /** Toggle a single store chip on/off in the multi-select. */
  const handleStoreToggle = (store: string) => {
    setItemData(prev => ({
      ...prev,
      store: prev.store.includes(store)
        ? prev.store.filter(s => s !== store)
        : [...prev.store, store],
    }));
  };

  /**
   * Persist an item name → field mapping into history both locally and
   * to S3. Called from handleSubmit for both add and edit paths.
   * The S3 write is fire-and-forget — a failure here is non-critical.
   */
  const persistToHistory = useCallback((data: ItemData) => {
    if (!data.item.trim()) return;

    const k = historyKey(data.item);
    const entry = {
      store:      data.store,
      department: data.department,
      quantity:   data.quantity,
      notes:      data.notes ?? '',
    };

    // Update local cache and state immediately (optimistic).
    const updated = { ...historyCache, [k]: entry } as ItemHistory;
    historyCache = updated;
    setHistory(updated);

    // Persist to S3 in the background.
    saveHistory(updated).catch(err => {
      console.warn('[useItemForm] history save failed:', err);
    });
  }, []);

  const handleSubmit = (e: SubmitEvent) => {
    e.preventDefault();
    if (!itemData.item.trim()) return;

    if (editingId) {
      updateItems(prev =>
        prev.map(i => i.id === editingId ? { ...itemData, id: editingId, quantity: itemData.quantity, notes: itemData.notes ?? '' } : i)
      );
    } else {
      const newItem: GroceryItem = { ...itemData, acquired: false, id: Date.now().toString(), quantity: itemData.quantity, notes: itemData.notes ?? '' };
      updateItems(prev => [...prev, newItem]);
    }

    persistToHistory(itemData);
    handleClose();
  };

  const handleDelete = (id: string) => {
    updateItems(prev => prev.filter(i => i.id !== id));
    if (editingId === id) handleClose();
  };

  return {
    formData: itemData, editingId, sheetOpen,
    openAdd, handleEdit, handleClose,
    handleInputChange, handleStoreToggle, handleSubmit, handleDelete,
    // Autocomplete
    nameInputRef,
    suggestions,
    activeSuggestion,
    dropdownOpen,
    closeDropdown,
    selectSuggestion,
    handleNameFocus,
    handleNameKeyDown,
  };
}
