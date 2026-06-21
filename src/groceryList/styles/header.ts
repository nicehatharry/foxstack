import styled, { css, keyframes } from 'styled-components';
import type { SyncStatus } from '../GroceryList.types';

export const TopBar = styled.header`
  background: #1a1a1a;
  color: #f0ede8;
  padding: 18px 20px 4px;
  position: sticky;
  top: 0;
  z-index: 100;
`;

export const AppTitle = styled.h1`
  margin: 0 0 4px;
  font-size: 22px;
  font-weight: 400;
  letter-spacing: 0.04em;
  font-style: italic;
`;

export const TopBarRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
`;

export const SignOutBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: none;
  border: 1px solid #444;
  color: #888;
  padding: 0;
  border-radius: 6px;
  cursor: pointer;
  flex-shrink: 0;
  margin-top: 2px;
  transition: border-color 0.15s, color 0.15s;

  &:hover {
    border-color: #888;
    color: #ccc;
  }

  &:focus-visible {
    outline: 2px solid #888;
    outline-offset: 2px;
  }
`;

// Icon rendered via mask so it inherits SignOutBtn's `color` (theme-aware,
// including hover/focus) instead of being locked to the SVG's own fill.
export const SignOutIcon = styled.span<{ $src: string }>`
  width: 16px;
  height: 16px;
  background-color: currentColor;
  flex-shrink: 0;
  -webkit-mask: url(${p => p.$src}) center / contain no-repeat;
  mask: url(${p => p.$src}) center / contain no-repeat;
`;

// Sync status indicator — lives in the TopBar
export const SyncBar = styled.div<{ $status: SyncStatus }>`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${p => {
    if (p.$status === 'error' || p.$status === 'conflict') return '#ff8a80';
    if (p.$status === 'saving') return '#c8f59e';
    if (p.$status === 'loading') return '#a0a0a0';
    return '#1a1a1a'; // idle (invisible)
  }};
  transition: color 0.2s ease;
`;

const pulse = keyframes`0%,100%{opacity:1}50%{opacity:0.2}`;

export const SyncDot = styled.span<{ $status: SyncStatus }>`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
  flex-shrink: 0;
  animation: ${p =>
    (p.$status === 'saving' || p.$status === 'loading')
      ? css`${pulse} 1s ease-in-out infinite`
      : 'none'
  };
`;