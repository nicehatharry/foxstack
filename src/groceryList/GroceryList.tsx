import '../config/amplify'; // must be first

import React, { useState } from 'react';
import { withAuthenticator, type WithAuthenticatorProps } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';

import { GlobalStyle } from './GlobalStyle';
import { departments, sortKeys } from './GroceryList.constants';
import { filterAndSortItems } from './GroceryList.utils';
import type { SortConfig, GroceryItem } from './GroceryList.types';
import { useGrocerySync } from './useGrocerySync';
import { useItemForm } from './useItemForm';
import { GroceryListItem } from './GroceryListItem';

import { AppShell } from './styles/layout';
import { TopBar, TopBarRow, AppTitle, SignOutBtn, StatsRow, StatChip, SyncBar, SyncDot } from './styles/header';
import { AlertBanner, AlertAction } from './styles/alert';
import { FilterBar, FilterPill, SortBar, SortBtn } from './styles/filters';
import { ListArea, SectionLabel, EmptyState } from './styles/itemList';
import { Overlay, Sheet, SheetHandle, SheetTitle, FieldGrid, FieldFull, FieldLabel, FieldInput, FieldSelect, SubmitBtn } from './styles/sheet';
import { FAB } from './styles/fab';

const GroceryList: React.FC<WithAuthenticatorProps> = ({ signOut }) => {
  // S3-synced item list — see useGrocerySync.ts for load/save/poll/conflict logic
  const { items, syncStatus, alert, setAlert, fetchList, updateItems } = useGrocerySync();

  // Add/edit bottom sheet — see useItemForm.ts
  const {
    formData, editingId, sheetOpen,
    openAdd, handleEdit, handleClose, handleInputChange, handleSubmit, handleDelete,
  } = useItemForm(updateItems);

  // View-only UI state (filtering/sorting the list, not the data itself)
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: 'asc' });
  const [filterDept, setFilterDept] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<'All' | 'Acquired' | 'Pending'>('All');

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

  const processed = filterAndSortItems(items, filterDept, filterStatus, sortConfig);
  const pending = processed.filter(i => !i.acquired);
  const acquired = processed.filter(i => i.acquired);

  const stats = { total: items.length, acquired: items.filter(i => i.acquired).length };

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

          {acquired.length > 0 && (
            <>
              <SectionLabel>In Cart — {acquired.length}</SectionLabel>
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
