import React from 'react';
import type { GroceryItem } from './GroceryList.types';
import { SwipeableItem } from './SwipeableItem';
import {
  ItemCard, CheckCircle, ItemBody, ItemName, ItemMeta, QtyBadge, ActionRow, IconBtn,
} from './styles/itemList';

interface GroceryListItemProps {
  item: GroceryItem;
  /** Position within its section (pending or acquired) — drives the
   *  staggered fade-in animation delay, NOT a global list index. */
  index: number;
  onToggle: (id: string) => void;
  onEdit: (item: GroceryItem) => void;
  onDelete: (id: string) => void;
}

/**
 * Single row in the grocery list. This was originally two near-duplicate
 * inline JSX blocks (one under "pending", one under "acquired") in the
 * main component; `item.acquired` now drives every difference between
 * them:
 *  - Pending: "Edit" + "Delete" icons, full meta line (store · department),
 *    checkbox aria-label "Mark acquired".
 *  - Acquired: only "Delete" icon, department-only meta (store is never
 *    shown once acquired, even if set), checkbox aria-label "Unmark", and
 *    an inline line-through style on the name.
 *
 * Note: when acquired, the name gets BOTH an inline `text-decoration:
 * line-through` AND ItemName's own animated ::after strikethrough (see
 * styles/itemList.ts). That layering is intentional/pre-existing, not a
 * bug to "fix" — both effects were present in the original markup.
 */
export const GroceryListItem: React.FC<GroceryListItemProps> = ({
  item, index, onToggle, onEdit, onDelete,
}) => {
  const acquired = item.acquired;

  return (
    <SwipeableItem onEdit={() => onEdit(item)} onDelete={() => onDelete(item.id)}>
      <ItemCard $acquired={acquired} $animIndex={index}>
        <CheckCircle
          $checked={acquired}
          onClick={() => onToggle(item.id)}
          aria-label={acquired ? 'Unmark' : 'Mark acquired'}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <polyline points="2,6 5,9 10,3" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </CheckCircle>
        <ItemBody>
          <ItemName
            $acquired={acquired}
            style={acquired ? { textDecoration: 'line-through', color: '#aaa' } : undefined}
          >
            {item.item}
          </ItemName>
          <ItemMeta>
            {!acquired && item.store && <>{item.store} · </>}
            {item.department}
          </ItemMeta>
        </ItemBody>
        <QtyBadge>{item.quantity}</QtyBadge>
        <ActionRow>
          {!acquired && (
            <IconBtn $variant="edit" onClick={() => onEdit(item)} aria-label="Edit">✎</IconBtn>
          )}
          <IconBtn $variant="delete" onClick={() => onDelete(item.id)} aria-label="Delete">✕</IconBtn>
        </ActionRow>
      </ItemCard>
    </SwipeableItem>
  );
};
