import React from 'react';
import { SwipeableItem } from './SwipeableItem';
import { ItemCard, ItemBody, ItemName, QtyBadge, InfoIcon } from './styles/itemList';
import type { HistoryListEntry } from './useHistoryManager';

interface HistoryListItemProps {
  entry: HistoryListEntry;
  /** Position in the list — drives the staggered fade-in animation delay. */
  index: number;
  onEdit: (entry: HistoryListEntry) => void;
  onDelete: (key: string) => void;
  /** Called when the circle-ⓘ icon is tapped. Opens the read-only notes modal. */
  onShowNotes: (entry: HistoryListEntry) => void;
}

/**
 * One row on the Manage Items page. Deliberately NOT a reuse of
 * GroceryListItem — there's no CheckCircle/acquired toggle here, since
 * history entries have no acquired concept (see HistoryEntry in
 * s3Storage.ts). Everything else (card styling, swipe gesture, notes
 * icon, quantity badge) reuses the same styles/itemList.ts pieces the
 * main list uses — only the page chrome (AppShell/TopBar) is themed
 * differently, not individual rows.
 */
export const HistoryListItem: React.FC<HistoryListItemProps> = ({
  entry, index, onEdit, onDelete, onShowNotes,
}) => {
  return (
    <SwipeableItem onEdit={() => onEdit(entry)} onDelete={() => onDelete(entry.key)}>
      <ItemCard $acquired={false} $animIndex={index}>
        <ItemBody>
          <ItemName $acquired={false}>
            {entry.name}
          </ItemName>
          {entry.notes && (
            <InfoIcon 
            type="button" onClick={(e) => {
                e.stopPropagation();
                onShowNotes(entry);
              }}
              aria-label={`View notes for ${entry.name}`}
            >
              i
            </InfoIcon>
  )}
        </ItemBody>
        {(Number(entry.quantity) > 1 || isNaN(Number(entry.quantity))) && <QtyBadge>{entry.quantity}</QtyBadge>}
      </ItemCard>
    </SwipeableItem>
  );
};