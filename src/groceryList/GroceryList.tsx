import '../config/amplify'; // must be first

import React, { useState, useEffect, useRef } from 'react';
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
import { Overlay, Sheet, SheetHandle, SheetTitle, FieldGrid, FieldFull, FieldLabel, FieldInput, FieldSelect, StoreChipGrid, StoreChip, SubmitBtn } from './styles/sheet';
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
  } = useItemForm(updateItems);

  // View-only UI state (filtering/sorting the list, not the data itself)
  const [isDeptSort, setDeptSort] = useState<boolean>(true);
  const [filterStore, setFilterStore] = useState<string>('All');
  const [doShowAll, setShowAll] = useState<boolean>(false);

  // "Tap again to confirm" state for the Clear Acquired button.
  // Resets whenever the store filter changes so an armed confirm
  // doesn't silently apply to a different set of items than the user saw.
  const [clearArmed, setClearArmed] = useState<boolean>(false);
  const clearBtnRef = useRef<HTMLButtonElement>(null);

  // Disarm on tap-away. onBlur is unreliable on mobile (only fires when
  // focus moves to another focusable element), so we attach a document-level
  // pointerdown listener instead — it fires for any tap anywhere on the page.
  // The listener is only active while the button is armed, and is cleaned up
  // as soon as it disarms, so there's no overhead when nothing is pending.
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

  const handleSort = () => {
    setDeptSort(prev => {
      return !prev;
    });
  };

  const handleSelectStore = (store: string) => {
    setFilterStore(store);
    setClearArmed(false);
  };

  const processed = filterAndSortItems(items, filterStore, isDeptSort);
  const pending = processed.filter(i => !i.acquired);
  const acquired = processed.filter(i => i.acquired);

  // Deletes only the acquired items currently visible under the active
  // store filter — not every acquired item in the underlying list — so
  // the button does exactly what's on screen, no surprises.
  const handleClearAcquired = () => {
    if (!clearArmed) {
      setClearArmed(true);
      return;
    }
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
            {syncStatus === 'idle' && 'Ready'}
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
          <SortBtn key={'department-sort'} $active={isDeptSort} onClick={() => handleSort()}>{'Dept Sort'}</SortBtn>
          <span style={{ color: '#ccc', alignSelf: 'center', fontSize: 12, margin: '0 4px' }}>·</span>
          <SortBtn
            key={'show-all'}
            $active={doShowAll}
            onClick={() => {
              setShowAll(prev => !prev);
              setClearArmed(false);
            }}
          >{'Show All'}</SortBtn>
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
              {renderSectionItems(pending, isDeptSort, {
                onToggle: toggleAcquired,
                onEdit: handleEdit,
                onDelete: handleDelete,
              })}
            </>
          )}

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
                />
              ))}
            </>
          )}
        </ListArea>

        {/* FAB */}
        <FAB onClick={openAdd} aria-label="Add item" disabled={syncStatus != 'idle'}>+</FAB>

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
                  placeholder="Whole milk"
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
