import styled, { css, keyframes } from 'styled-components';
import type { SyncStatus } from '../GroceryList.types';

export const TopBar = styled.header`
  background: #1a1a1a;
  color: #f0ede8;
  padding: 18px 20px 14px;
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

export const StatsRow = styled.div`
  display: flex;
  gap: 16px;
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #a0a0a0;
`;

export const StatChip = styled.span<{ $highlight?: boolean }>`
  color: ${p => p.$highlight ? '#c8f59e' : '#a0a0a0'};
`;

export const TopBarRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
`;

export const SignOutBtn = styled.button`
  background: none;
  border: 1px solid #444;
  color: #888;
  font-family: 'Georgia', serif;
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 5px 10px;
  border-radius: 6px;
  cursor: pointer;
  flex-shrink: 0;
  margin-top: 2px;
  transition: border-color 0.15s, color 0.15s;

  &:hover {
    border-color: #888;
    color: #ccc;
  }
`;

// Sync status indicator — lives in the TopBar
export const SyncBar = styled.div<{ $status: SyncStatus }>`
  display: ${p => p.$status === 'idle' ? 'none' : 'flex'};
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${p => {
    if (p.$status === 'error' || p.$status === 'conflict') return '#ff8a80';
    if (p.$status === 'saving') return '#c8f59e';
    return '#a0a0a0'; // loading
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