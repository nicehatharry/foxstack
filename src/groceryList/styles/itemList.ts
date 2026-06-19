import styled, { css } from 'styled-components';
import { fadeIn, strikeThrough } from '../animations';

export const ListArea = styled.main`
  flex: 1;
  padding: 16px;
  padding-bottom: 120px;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
`;

export const SectionLabel = styled.div`
  font-size: 10px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #888;
  margin: 16px 0 8px;
  font-family: 'Georgia', serif;
`;

export const ItemCard = styled.div<{ $acquired: boolean; $animIndex: number }>`
  background: #fff;
  border-radius: 12px;
  padding: 14px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  opacity: ${p => p.$acquired ? 0.6 : 1};
  transition: opacity 0.2s ease, transform 0.15s ease;
  animation: ${fadeIn} 0.3s ease both;
  animation-delay: ${p => p.$animIndex * 0.04}s;

  &:active {
    transform: scale(0.985);
  }
`;

export const CheckCircle = styled.button<{ $checked: boolean }>`
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px solid ${p => p.$checked ? '#c8f59e' : '#ddd'};
  background: ${p => p.$checked ? '#c8f59e' : 'transparent'};
  flex-shrink: 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.18s ease;
  padding: 0;

  svg {
    opacity: ${p => p.$checked ? 1 : 0};
    transition: opacity 0.15s ease;
  }
`;

export const ItemBody = styled.div`
  flex: 1;
  min-width: 0;
`;

export const ItemName = styled.div<{ $acquired: boolean }>`
  font-size: 15px;
  color: #1a1a1a;
  font-family: 'Georgia', serif;
  position: relative;
  display: inline-block;

  ${p => p.$acquired && css`
    &::after {
      content: '';
      position: absolute;
      left: 0;
      top: 50%;
      height: 1.5px;
      background: #aaa;
      animation: ${strikeThrough} 0.4s ease forwards;
    }
  `}
`;

export const ItemMeta = styled.div`
  font-size: 11px;
  color: #999;
  margin-top: 3px;
  letter-spacing: 0.02em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const QtyBadge = styled.span`
  background: #f0ede8;
  border-radius: 6px;
  padding: 2px 7px;
  font-size: 12px;
  color: #555;
  flex-shrink: 0;
  font-family: 'Georgia', serif;
`;

export const ActionRow = styled.div`
  display: flex;
  gap: 6px;
  flex-shrink: 0;
`;

export const IconBtn = styled.button<{ $variant: 'edit' | 'delete' }>`
  width: 34px;
  height: 34px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  background: ${p => p.$variant === 'delete' ? '#fff0f0' : '#f0f0ff'};
  color: ${p => p.$variant === 'delete' ? '#e05555' : '#5555cc'};
  transition: background 0.15s;

  &:active {
    background: ${p => p.$variant === 'delete' ? '#ffd9d9' : '#dcdcff'};
  }
`;

export const EmptyState = styled.div`
  text-align: center;
  padding: 60px 24px;
  color: #aaa;
  font-family: 'Georgia', serif;
  font-style: italic;
  font-size: 15px;
  line-height: 1.6;
`;
