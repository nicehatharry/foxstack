import '../config/amplify'; // must be first

import React, { useState } from 'react';
import { withAuthenticator, type WithAuthenticatorProps } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { useLocation } from 'wouter';

import { GlobalStyle } from './GlobalStyle';
import { departments, storeOptions } from './GroceryList.constants';
import { useHistoryManager } from './useHistoryManager';
import type { HistoryListEntry } from './useHistoryManager';
import { HistoryListItem } from './HistoryListItem';

import returnIconSrc from '../assets/return.png';

import { ManageAppShell, ManageGlobalStyle } from './styles/manageItemsLayout';
import { ManageTopBar } from './styles/manageItemsHeader';
import { TopBarRow, AppTitle, SettingsBtn, SettingsIcon } from './styles/header';
import { ListArea, EmptyState } from './styles/itemList';
import {
  Overlay, Sheet, SheetHandle, SheetTitle,
  FieldGrid, FieldFull, FieldLabel, FieldInput, FieldTextarea, FieldSelect,
  StoreChipGrid, StoreChip, SubmitBtn,
} from './styles/sheet';
import { ModalOverlay, ModalCard, ModalItemName, ModalNoteText } from './styles/modal';

/**
 * Manage Items — lets the user clean up the item-name history used to
 * populate the add/edit sheet's autocomplete dropdown on the main list.
 * Mirrors GroceryList.tsx's overall shape (header + scrollable list +
 * bottom sheet), but:
 *   - no store filter bar, dept-sort/show-all toggle, or department
 *     headers — history has no store filter or acquired/pending split
 *   - no FAB — this page only edits/deletes existing history entries,
 *     it doesn't create new ones
 *   - swipe-edit/delete act on the history document (via
 *     useHistoryManager), never on the grocery list itself
 *   - a different background/header palette (see styles/manageItemsLayout.ts
 *     and styles/manageItemsHeader.ts) so it's visually obvious this
 *     isn't the grocery list
 */
const ManageItems: React.FC<WithAuthenticatorProps> = () => {
  const [, navigate] = useLocation();

  const {
    entries, loading,
    sheetOpen, formData,
    openEdit, handleClose, handleInputChange, handleStoreToggle, handleSubmit,
    deleteEntry,
  } = useHistoryManager();

  // Notes modal — holds the entry whose note is being displayed, or null when closed.
  const [notesEntry, setNotesEntry] = useState<HistoryListEntry | null>(null);

  const handleBack = () => navigate('/grocery-list');

  return (
    <>
      <GlobalStyle />
      <ManageGlobalStyle />
      <ManageAppShell>
        {/* Header */}
        <ManageTopBar>
          <TopBarRow>
            <AppTitle>Manage Items</AppTitle>
            <SettingsBtn onClick={handleBack} aria-label="Back to grocery list" title="Back">
              <SettingsIcon $src={returnIconSrc} aria-hidden="true" />
            </SettingsBtn>
          </TopBarRow>
        </ManageTopBar>

        {/* Item List */}
        <ListArea>
          {(!loading && entries.length === 0) && (
            <EmptyState>
              No item history yet.<br />Items you add to your list will show up here.
            </EmptyState>
          )}
          {(loading && entries.length === 0) && (
            <EmptyState>Loading...</EmptyState>
          )}

          {entries.map((entry, i) => (
            <HistoryListItem
              key={entry.key}
              entry={entry}
              index={i}
              onEdit={openEdit}
              onDelete={deleteEntry}
              onShowNotes={setNotesEntry}
            />
          ))}
        </ListArea>

        {/* Sheet overlay */}
        <Overlay $visible={sheetOpen} onClick={handleClose} />

        {/* Edit bottom sheet — metadata only, no autocomplete (this page
            edits existing entries, it doesn't look any up). */}
        <Sheet $visible={sheetOpen}>
          <SheetHandle />
          <SheetTitle>Edit Item</SheetTitle>

          <form onSubmit={handleSubmit}>
            <FieldGrid>
              <FieldFull>
                <FieldLabel htmlFor="history-name-input">Item name *</FieldLabel>
                <FieldInput
                  id="history-name-input"
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Whole milk"
                  required
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="words"
                  spellCheck={false}
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
                <FieldLabel>Store</FieldLabel>
                <StoreChipGrid role="group" aria-label="Select stores">
                  {storeOptions.map(store => (
                    <StoreChip
                      key={store}
                      type="button"
                      $selected={formData.store.includes(store)}
                      onClick={() => handleStoreToggle(store)}
                      aria-pressed={formData.store.includes(store)}
                    >
                      {store}
                    </StoreChip>
                  ))}
                </StoreChipGrid>
              </FieldFull>

              <FieldFull>
                <FieldLabel>Notes</FieldLabel>
                <FieldTextarea
                  name="notes"
                  value={formData.notes ?? ''}
                  onChange={handleInputChange}
                  placeholder="Brand, size, substitutions…"
                />
              </FieldFull>
            </FieldGrid>

            <SubmitBtn type="submit">Save Changes</SubmitBtn>
          </form>
        </Sheet>

        {/* Notes modal — read-only, same pattern as the main list's. */}
        <ModalOverlay $visible={notesEntry !== null} onClick={() => setNotesEntry(null)}>
          {notesEntry && (
            <ModalCard onClick={e => e.stopPropagation()}>
              <ModalItemName>{notesEntry.name}</ModalItemName>
              <ModalNoteText>{notesEntry.notes}</ModalNoteText>
            </ModalCard>
          )}
        </ModalOverlay>
      </ManageAppShell>
    </>
  );
};

export default withAuthenticator(ManageItems);