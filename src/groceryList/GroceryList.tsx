import '../config/amplify'; // must be first

import React, { useState } from 'react';
import { withAuthenticator, type WithAuthenticatorProps } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';

import { GlobalStyle } from './GlobalStyle';
import { departments, storeOptions, sortKeys } from './GroceryList.constants';
import { filterAndSortItems } from './GroceryList.utils';
import { useGrocerySync } from './useGrocerySync';
import { useItemForm } from './useItemForm';
import { GroceryListItem } from './GroceryListItem';

import { AppShell } from './styles/layout';
import { TopBar, TopBarRow, AppTitle, SignOutBtn, SyncBar, SyncDot } from './styles/header';
import { AlertBanner, AlertAction } from './styles/alert';
import { FilterBar, FilterPill, SortBar, SortBtn } from './styles/filters';
import { ListArea, SectionLabel, DeptHeader, EmptyState } from './styles/itemList';
import { Overlay, Sheet, SheetHandle, SheetTitle, FieldGrid, FieldFull, FieldLabel, FieldInput, FieldSelect, StoreChipGrid, StoreChip, SubmitBtn } from './styles/sheet';
import { FAB } from './styles/fab';
import type { GroceryItem } from './GroceryList.types';

/**
 * Renders one section's (pending/acquired) rows, inserting a DeptHeader
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
  const [isDeptSort, setDeptSort] = useState<boolean>(false);
  const [filterDept, setFilterDept] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<'All' | 'Acquired' | 'Pending'>('All');

  const toggleAcquired = (id: string) => {
    updateItems(prev => prev.map(i => i.id === id ? { ...i, acquired: !i.acquired } : i));
  };

  const handleSort = () => {
    setDeptSort(prev => {
      return !prev;
    });
  };

  const processed = filterAndSortItems(items, filterDept, filterStatus, isDeptSort);
  const pending = processed.filter(i => !i.acquired);
  const acquired = processed.filter(i => i.acquired);

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
          <SyncBar $status={syncStatus}>
            <SyncDot $status={syncStatus} />
            {syncStatus === 'saving'   && 'Saving…'}
            {syncStatus === 'loading'  && 'Loading…'}
            {syncStatus === 'error'    && 'Save failed'}
            {syncStatus === 'conflict' && 'Refreshing…'}
            {syncStatus === 'idle' && 'Ready'}
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
              $active={isDeptSort}
              onClick={() => handleSort()}
            >
              {label}
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
              {renderSectionItems(pending, isDeptSort, {
                onToggle: toggleAcquired,
                onEdit: handleEdit,
                onDelete: handleDelete,
              })}
            </>
          )}

          {acquired.length > 0 && (
            <>
              <SectionLabel>In Cart</SectionLabel>
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
