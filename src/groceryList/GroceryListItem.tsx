import React from 'react';
import type { GroceryItem } from './GroceryList.types';
import { SwipeableItem } from './SwipeableItem';
import {
  ItemCard, CheckCircle, ItemBody, ItemName, QtyBadge,
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
 * Single row in the grocery list. `item.acquired` drives every difference between
 * the two types of rows:
 *  - Pending: "Edit" + "Delete" icons, full meta line (store · department),
 *    checkbox aria-label "Mark acquired".
 *  - Acquired: only "Delete" icon, department-only meta (store is never
 *    shown once acquired, even if set), checkbox aria-label "Unmark", and
 *    an inline line-through style on the name.
 */
export const GroceryListItem: React.FC<GroceryListItemProps> = ({
  item, index, onToggle, onEdit, onDelete,
}) => {
  const acquired = item.acquired;
  console.log(`item: ${item.item} number is NaN: ${isNaN(Number(item.quantity))}`)

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
        {' '}
        <ItemBody>
          <ItemName
            $acquired={acquired}
            >
            {item.item}
          </ItemName>
        </ItemBody>
        {(Number(item.quantity) > 1 || isNaN(Number(item.quantity))) && <QtyBadge>{item.quantity}</QtyBadge>}
      </ItemCard>
    </SwipeableItem>
  );
};
