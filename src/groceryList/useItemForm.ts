import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import type { ItemData, GroceryItem } from './GroceryList.types';

const EMPTY_FORM: ItemData = { item: '', store: [], department: 'Produce', quantity: '1', acquired: false };

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
 * This is the file to touch for: "add a new field to the form",
 * "change form validation", "the sheet doesn't reset between items".
 */
export function useItemForm(
  updateItems: (updater: (prev: GroceryItem[]) => GroceryItem[]) => void
) {
  const [itemData, setItemData] = useState<ItemData>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const resetForm = () => {
    setItemData(EMPTY_FORM);
    setEditingId(null);
  };

  const openAdd = () => { resetForm(); setSheetOpen(true); };

  const handleEdit = (item: GroceryItem) => {
    setItemData({ item: item.item, store: item.store, department: item.department, quantity: item.quantity, acquired: item.acquired });
    setEditingId(item.id);
    setSheetOpen(true);
  };

  const handleClose = () => { setSheetOpen(false); resetForm(); };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setItemData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  /** Toggle a single store chip on/off in the multi-select. */
  const handleStoreToggle = (store: string) => {
    setItemData(prev => ({
      ...prev,
      store: prev.store.includes(store)
        ? prev.store.filter(s => s !== store)
        : [...prev.store, store],
    }));
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!itemData.item.trim()) return;

    if (editingId) {
      updateItems(prev =>
        prev.map(i => i.id === editingId ? { ...itemData, id: editingId, quantity: itemData.quantity } : i)
      );
    } else {
      const newItem: GroceryItem = { ...itemData, acquired: false, id: Date.now().toString(), quantity: itemData.quantity };
      updateItems(prev => [...prev, newItem]);
    }
    handleClose();
  };

  const handleDelete = (id: string) => {
    updateItems(prev => prev.filter(i => i.id !== id));
    if (editingId === id) handleClose();
  };

  return {
    formData: itemData, editingId, sheetOpen,
    openAdd, handleEdit, handleClose, handleInputChange, handleStoreToggle, handleSubmit, handleDelete,
  };
}
