import { useState, useEffect, useCallback } from 'react';
import type { ChangeEvent, SubmitEvent } from 'react';
import type { ItemHistory, HistoryEntry } from './services/s3Storage';
import { getHistory, getCachedHistory, setHistory as persistHistory, historyKey } from './historyStore';

/** One history entry with its map key and a reconstructed display name attached. */
export interface HistoryListEntry extends HistoryEntry {
  /** Lowercased map key — this IS the entry's identity (see ItemHistory in s3Storage.ts). */
  key: string;
  /** Display name, title-cased from the key — same reconstruction useItemForm.ts's
   *  selectSuggestion uses, since real casing isn't stored anywhere. */
  name: string;
}

interface HistoryFormData {
  name: string;
  store: string[];
  department: string;
  quantity: string;
  notes: string;
}

const EMPTY_FORM: HistoryFormData = { name: '', store: [], department: 'Produce', quantity: '1', notes: '' };

function toDisplayName(key: string): string {
  return key.replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * Owns the item-history document for the Manage Items page: loads it once,
 * exposes it as a sorted array of rows, and edits/deletes entries through
 * historyStore.ts's shared cache — so a rename or delete made here is
 * reflected in the add/edit sheet's autocomplete (useItemForm.ts) the next
 * time that sheet opens, with no page reload.
 *
 * Also owns the edit bottom sheet's state (open/closed, which entry, the
 * controlled form fields) — mirrors useItemForm.ts's shape but without
 * autocomplete, since this page edits existing entries rather than
 * creating new ones against a suggestion list.
 */
export function useHistoryManager() {
  const [history, setHistoryState] = useState<ItemHistory>(() => getCachedHistory() ?? {});
  const [loading, setLoading] = useState<boolean>(() => getCachedHistory() === null);

  const [formData, setFormData] = useState<HistoryFormData>(EMPTY_FORM);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  // Load once — reuses the shared cache if the add/edit sheet already
  // populated it earlier this session.
  useEffect(() => {
    if (getCachedHistory() !== null) return;
    getHistory().then(h => {
      setHistoryState(h);
      setLoading(false);
    });
  }, []);

  const entries: HistoryListEntry[] = Object.keys(history)
    .sort()
    .map(key => ({ key, name: toDisplayName(key), ...history[key] }));

  const resetForm = () => {
    setFormData(EMPTY_FORM);
    setEditingKey(null);
  };

  const openEdit = (entry: HistoryListEntry) => {
    setFormData({ name: entry.name, store: entry.store, department: entry.department, quantity: entry.quantity, notes: entry.notes ?? '' });
    setEditingKey(entry.key);
    setSheetOpen(true);
  };

  const handleClose = () => {
    setSheetOpen(false);
    resetForm();
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleStoreToggle = (store: string) => {
    setFormData(prev => ({
      ...prev,
      store: prev.store.includes(store)
        ? prev.store.filter(s => s !== store)
        : [...prev.store, store],
    }));
  };

  /**
   * Save the current form back into history under `oldKey`. If the name
   * changed, this renames the entry — the map key is the entry's only
   * identity, so a rename means deleting the old key and inserting under
   * the new one, not updating a "name" field (there isn't one — see
   * HistoryEntry in s3Storage.ts).
   */
  const editEntry = useCallback((oldKey: string, data: HistoryFormData) => {
    const newKey = historyKey(data.name);
    if (!newKey) return; // don't allow renaming to an empty name

    const updated: ItemHistory = { ...history };
    delete updated[oldKey];
    updated[newKey] = {
      store: data.store,
      department: data.department,
      quantity: data.quantity,
      notes: data.notes,
    };

    setHistoryState(updated);
    persistHistory(updated).catch(err => {
      console.warn('[useHistoryManager] history save failed:', err);
    });
  }, [history]);

  const deleteEntry = useCallback((key: string) => {
    const updated: ItemHistory = { ...history };
    delete updated[key];

    setHistoryState(updated);
    persistHistory(updated).catch(err => {
      console.warn('[useHistoryManager] history save failed:', err);
    });

    if (editingKey === key) handleClose();
  }, [history, editingKey]);

  const handleSubmit = (e: SubmitEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !editingKey) return;
    editEntry(editingKey, formData);
    handleClose();
  };

  return {
    entries, loading,
    sheetOpen, formData,
    openEdit, handleClose, handleInputChange, handleStoreToggle, handleSubmit,
    deleteEntry,
  };
}