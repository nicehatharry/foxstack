import '../config/amplify'; // must be first

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { withAuthenticator, type WithAuthenticatorProps } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';

import { GlobalStyle } from './GlobalStyle';
import { departments, storeOptions } from './GroceryList.constants';
import { filterAndSortItems } from './GroceryList.utils';
import { useGrocerySync } from './useGrocerySync';
import { useItemForm } from './useItemForm';
import { GroceryListItem } from './GroceryListItem';

import signOutIconSrc from '../assets/sign-out.svg';
import trashIconSrc from '../assets/trash-icon.svg';

import { AppShell } from './styles/layout';
import { TopBar, TopBarRow, AppTitle, SignOutBtn, SignOutIcon, SyncBar, SyncDot } from './styles/header';
import { AlertBanner, AlertAction } from './styles/alert';
import { FilterBar, FilterPill, SortBar, SortBtn } from './styles/filters';
import { ListArea, SectionLabelRow, SectionLabel, ClearAcquiredBtn, ClearAcquiredIcon, DeptHeader, EmptyState } from './styles/itemList';
import {
  Overlay, Sheet, SheetHandle, SheetTitle,
  FieldGrid, FieldFull, FieldLabel, FieldInput, FieldTextarea, FieldSelect,
  StoreChipGrid, StoreChip, SubmitBtn,
  AutocompleteWrapper, SuggestionDropdown, SuggestionItem,
} from './styles/sheet';
import { ModalOverlay, ModalCard, ModalItemName, ModalNoteText } from './styles/modal';
import { FAB } from './styles/fab';
import type { GroceryItem } from './GroceryList.types';

/**
 * Renders one section's rows, inserting a DeptHeader
 * before the first item of each new department whenever isDeptSort is on.
 * Items are expected to already be department-sorted by filterAndSortItems
 * — this just detects the boundaries, it doesn't re-sort anything.
 */
function renderSectionItems(
  sectionItems: GroceryItem[],
  isDeptSort: boolean,
  handlers: {
    onToggle: (id: string) => void;
    onEdit: (item: GroceryItem) => void;
    onDelete: (id: string) => void;
    onShowNotes: (item: GroceryItem) => void;
  }
) {
  let lastDept: string | null = null;

  return sectionItems.map((item, i) => {
    const showDeptHeader = isDeptSort && item.department !== lastDept;
    lastDept = item.department;

    return (
      <React.Fragment key={item.id}>
        {showDeptHeader && <DeptHeader>{item.department}</DeptHeader>}
        <GroceryListItem
          item={item}
          index={i}
          onToggle={handlers.onToggle}
          onEdit={handlers.onEdit}
          onDelete={handlers.onDelete}
          onShowNotes={handlers.onShowNotes}
        />
      </React.Fragment>
    );
  });
}

const GroceryList: React.FC<WithAuthenticatorProps> = ({ signOut }) => {
  // S3-synced item list — see useGrocerySync.ts for load/save/poll/conflict logic
  const { items, syncStatus, alert, setAlert, fetchList, updateItems } = useGrocerySync();

  // Add/edit bottom sheet — see useItemForm.ts
  const {
    formData, editingId, sheetOpen,
    openAdd, handleEdit, handleClose, handleInputChange, handleStoreToggle, handleSubmit, handleDelete,
    // Autocomplete
    nameInputRef,
    suggestions,
    activeSuggestion,
    dropdownOpen,
    closeDropdown,
    selectSuggestion,
    handleNameFocus,
    handleNameKeyDown,
  } = useItemForm(updateItems);

  // View-only UI state (filtering/sorting the list, not the data itself)
  const [isDeptSort, setDeptSort] = useState<boolean>(true);
  const [filterStore, setFilterStore] = useState<string>('All');
  const [doShowAll, setShowAll] = useState<boolean>(false);

  // Notes modal — holds the item whose note is being displayed, or null when closed.
  const [notesItem, setNotesItem] = useState<GroceryItem | null>(null);

  // "Tap again to confirm" state for the Clear Acquired button.
  const [clearArmed, setClearArmed] = useState<boolean>(false);
  const clearBtnRef = useRef<HTMLButtonElement>(null);

  // ---------------------------------------------------------------------------
  // Autocomplete dropdown positioning
  //
  // The Sheet has overflow-y: auto, which clips any absolutely-positioned
  // child. To escape this, SuggestionDropdown is position: fixed and its
  // top/left/width are set from the input element's bounding rect, measured
  // on every render while the dropdown is open. A ResizeObserver + scroll
  // listener keep the position accurate when the virtual keyboard appears or
  // the user scrolls the sheet.
  // ---------------------------------------------------------------------------
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});

  const measureDropdown = useCallback(() => {
    if (!nameInputRef.current) return;
    const rect = nameInputRef.current.getBoundingClientRect();
    setDropdownStyle({
      top:   rect.bottom + 4,
      left:  rect.left,
      width: rect.width,
    });
  }, [nameInputRef]);

  useEffect(() => {
    if (!dropdownOpen || !nameInputRef.current) return;

    measureDropdown();

    // Re-measure when the viewport resizes (keyboard appear/disappear on mobile).
    window.addEventListener('resize', measureDropdown);
    // Re-measure on scroll inside the sheet (unlikely but defensive).
    window.addEventListener('scroll', measureDropdown, true);

    return () => {
      window.removeEventListener('resize', measureDropdown);
      window.removeEventListener('scroll', measureDropdown, true);
    };
  }, [dropdownOpen, measureDropdown]);

  // Close dropdown when tapping anywhere outside the name input + dropdown.
  // We use pointerdown (not click) so it fires before the input's onBlur,
  // giving selectSuggestion a chance to run first on taps inside the list.
  const dropdownRef = useRef<HTMLUListElement>(null);
  useEffect(() => {
    if (!dropdownOpen) return;
    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (
        !nameInputRef.current?.contains(target) &&
        !dropdownRef.current?.contains(target)
      ) {
        closeDropdown();
      }
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [dropdownOpen, closeDropdown, nameInputRef]);

  // ---------------------------------------------------------------------------
  // Clear Acquired disarm on tap-away (existing behaviour)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!clearArmed) return;
    const handlePointerDown = (e: PointerEvent) => {
      if (!clearBtnRef.current?.contains(e.target as Node)) {
        setClearArmed(false);
      }
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [clearArmed]);

  const toggleAcquired = (id: string) => {
    updateItems(prev => prev.map(i => i.id === id ? { ...i, acquired: !i.acquired } : i));
  };

  const handleSort = () => setDeptSort(prev => !prev);

  const handleSelectStore = (store: string) => {
    setFilterStore(store);
    setClearArmed(false);
  };

  const processed = filterAndSortItems(items, filterStore, isDeptSort);
  const pending = processed.filter(i => !i.acquired);
  const acquired = processed.filter(i => i.acquired);

  const handleClearAcquired = () => {
    if (!clearArmed) { setClearArmed(true); return; }
    const idsToRemove = new Set(acquired.map(i => i.id));
    updateItems(prev => prev.filter(i => !idsToRemove.has(i.id)));
    setClearArmed(false);
  };

  return (
    <>
      <GlobalStyle />
      <AppShell>
        {/* Header */}
        <TopBar>
          <TopBarRow>
            <AppTitle>Grocery List</AppTitle>
            <SignOutBtn onClick={signOut} aria-label="Sign out" title="Sign out">
              <SignOutIcon $src={signOutIconSrc} aria-hidden="true" />
            </SignOutBtn>
          </TopBarRow>
          <SyncBar $status={syncStatus}>
            <SyncDot $status={syncStatus} />
            {syncStatus === 'saving'   && 'Saving…'}
            {syncStatus === 'loading'  && 'Loading…'}
            {syncStatus === 'error'    && 'Save failed'}
            {syncStatus === 'conflict' && 'Refreshing…'}
            {syncStatus === 'idle'     && 'Ready'}
          </SyncBar>
        </TopBar>

        {/* Store filters */}
        <FilterBar>
          {['All', ...storeOptions].map(store => (
            <FilterPill key={store} $active={filterStore === store} onClick={() => handleSelectStore(store)}>
              {store}
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
          <SortBtn $active={isDeptSort} onClick={handleSort}>Dept Sort</SortBtn>
          <span style={{ color: '#ccc', alignSelf: 'center', fontSize: 12, margin: '0 4px' }}>·</span>
          <SortBtn
            $active={doShowAll}
            onClick={() => { setShowAll(prev => !prev); setClearArmed(false); }}
          >Show All</SortBtn>
        </SortBar>

        {/* Item List */}
        <ListArea>
          {(syncStatus === 'idle' && processed.length === 0) && (
            <EmptyState>
              Your list is empty.<br />Tap <strong>+</strong> to add your first item.
            </EmptyState>
          )}
          {(syncStatus === 'loading' && processed.length === 0) && (
            <EmptyState>Loading...</EmptyState>
          )}

          {pending.length > 0 && renderSectionItems(pending, isDeptSort, {
            onToggle: toggleAcquired,
            onEdit: handleEdit,
            onDelete: handleDelete,
            onShowNotes: setNotesItem,
          })}

          {doShowAll && acquired.length > 0 && (
            <>
              <SectionLabelRow>
                <SectionLabel>In Cart</SectionLabel>
                <ClearAcquiredBtn
                  ref={clearBtnRef}
                  type="button"
                  $armed={clearArmed}
                  onClick={handleClearAcquired}
                  disabled={syncStatus !== 'idle'}
                  aria-label={clearArmed ? 'Tap again to confirm clearing acquired items' : 'Clear acquired items'}
                >
                  <ClearAcquiredIcon $src={trashIconSrc} aria-hidden="true" />
                </ClearAcquiredBtn>
              </SectionLabelRow>
              {acquired.map((item, i) => (
                <GroceryListItem
                  key={item.id}
                  item={item}
                  index={i}
                  onToggle={toggleAcquired}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onShowNotes={setNotesItem}
                />
              ))}
            </>
          )}
        </ListArea>

        {/* FAB */}
        <FAB onClick={openAdd} aria-label="Add item" disabled={syncStatus !== 'idle'}>+</FAB>

        {/* Sheet overlay */}
        <Overlay $visible={sheetOpen} onClick={handleClose} />

        {/* Bottom Sheet Form */}
        <Sheet $visible={sheetOpen}>
          <SheetHandle />
          <SheetTitle>{editingId ? 'Edit Item' : 'Add to List'}</SheetTitle>

          <form onSubmit={handleSubmit}>
            <FieldGrid>

              {/*
                Item name — wraps in AutocompleteWrapper to anchor the dropdown.
                The dropdown itself is position: fixed (see sheet.ts) so it
                escapes the Sheet's overflow-y: auto scroll container; its
                coordinates come from dropdownStyle, measured in useEffect above.
              */}
              <AutocompleteWrapper>
                <FieldLabel htmlFor="item-name-input">Item name *</FieldLabel>
                <FieldInput
                  id="item-name-input"
                  ref={nameInputRef}
                  type="text"
                  name="item"
                  value={formData.item}
                  onChange={handleInputChange}
                  onFocus={handleNameFocus}
                  onKeyDown={handleNameKeyDown}
                  placeholder="Whole milk"
                  required
                  autoFocus={sheetOpen}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="words"
                  spellCheck={false}
                  aria-autocomplete="list"
                  aria-expanded={dropdownOpen && suggestions.length > 0}
                  aria-controls="item-suggestions"
                  aria-activedescendant={
                    activeSuggestion >= 0
                      ? `suggestion-${activeSuggestion}`
                      : undefined
                  }
                />
              </AutocompleteWrapper>

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

            <SubmitBtn type="submit">
              {editingId ? 'Save Changes' : 'Add Item'}
            </SubmitBtn>
          </form>
        </Sheet>

        {/*
          Autocomplete dropdown — rendered outside the Sheet so it isn't clipped
          by overflow-y: auto. Position is fixed with coordinates derived from
          the name input's bounding rect (see dropdownStyle / measureDropdown).
          z-index 400 sits above the Sheet (300) and its overlay (200).

          onPointerDown uses preventDefault() so the input doesn't blur before
          selectSuggestion runs — critical on mobile where blur fires on any
          tap outside the input.
        */}
        <SuggestionDropdown
          id="item-suggestions"
          ref={dropdownRef}
          role="listbox"
          aria-label="Item suggestions"
          $visible={dropdownOpen && suggestions.length > 0}
          style={dropdownStyle}
        >
          {suggestions.map((key, i) => (
            <SuggestionItem
              key={key}
              id={`suggestion-${i}`}
              role="option"
              aria-selected={i === activeSuggestion}
              $active={i === activeSuggestion}
              onPointerDown={e => {
                // Prevent the input from blurring before we can call selectSuggestion.
                e.preventDefault();
                selectSuggestion(key);
              }}
            >
              {key.replace(/\b\w/g, c => c.toUpperCase())}
            </SuggestionItem>
          ))}
        </SuggestionDropdown>

        {/* Notes modal */}
        <ModalOverlay $visible={notesItem !== null} onClick={() => setNotesItem(null)}>
          {notesItem && (
            <ModalCard onClick={e => e.stopPropagation()}>
              <ModalItemName>{notesItem.item}</ModalItemName>
              <ModalNoteText>{notesItem.notes}</ModalNoteText>
            </ModalCard>
          )}
        </ModalOverlay>
      </AppShell>
    </>
  );
};

export default withAuthenticator(GroceryList);
