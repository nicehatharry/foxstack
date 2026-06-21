import styled, { css } from 'styled-components';
import { fadeIn, strikeThrough } from '../animations';

export const ListArea = styled.main`
  flex: 1;
  padding: 0 16px;
  padding-bottom: 120px;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
`;

export const SectionLabelRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin: 16px 0 8px;
`;

export const SectionLabel = styled.div`
  background: #c4ef9d;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #222;
  padding: 4px 10px;
  border-radius: 8px;
  font-family: 'Georgia', serif;
`;

// Sits in the same row as SectionLabel. `$armed` is the inline
// "tap again to confirm" state — first tap warns, second tap deletes.
export const ClearAcquiredBtn = styled.button<{ $armed: boolean }>`
  display: flex;
  align-items: center;
  gap: 5px;
  background: ${p => p.$armed ? '#ff8a80' : 'none'};
  border: 1px solid ${p => p.$armed ? '#ff8a80' : '#ddd'};
  color: ${p => p.$armed ? '#fff' : '#999'};
  font-family: 'Georgia', serif;
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 4px 9px;
  border-radius: 8px;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.15s, border-color 0.15s, color 0.15s;

  &:hover {
    border-color: ${p => p.$armed ? '#ff8a80' : '#bbb'};
    color: ${p => p.$armed ? '#fff' : '#666'};
  }

  &:focus-visible {
    outline: 2px solid #999;
    outline-offset: 2px;
  }
`;

export const ClearAcquiredIcon = styled.span<{ $src: string }>`
  width: 11px;
  height: 11px;
  background-color: currentColor;
  flex-shrink: 0;
  -webkit-mask: url(${p => p.$src}) center / contain no-repeat;
  mask: url(${p => p.$src}) center / contain no-repeat;
`;

export const DeptHeader = styled.div`
  font-size: 10px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #aaa;
  margin: 12px 0 6px;
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

export const QtyBadge = styled.span`
  background: #f0ede8;
  border-radius: 6px;
  padding: 2px 7px;
  font-size: 12px;
  color: #555;
  flex-shrink: 0;
  font-family: 'Georgia', serif;
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
