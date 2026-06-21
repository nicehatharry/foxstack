import styled from 'styled-components';

// --- Department filter pills (dark bar under the header) ---

export const FilterBar = styled.div`
  display: flex;
  gap: 8px;
  padding: 0px 16px 12px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  background: #1a1a1a;
  border-bottom: 1px solid #2e2e2e;

  &::-webkit-scrollbar { display: none; }
`;

export const FilterPill = styled.button<{ $active: boolean }>`
  flex-shrink: 0;
  padding: 6px 14px;
  border-radius: 999px;
  border: 1.5px solid ${p => p.$active ? '#c8f59e' : '#444'};
  background: ${p => p.$active ? '#c8f59e' : 'transparent'};
  color: ${p => p.$active ? '#1a1a1a' : '#aaa'};
  font-size: 12px;
  font-family: 'Georgia', serif;
  letter-spacing: 0.04em;
  cursor: pointer;
  transition: all 0.18s ease;
  -webkit-tap-highlight-color: transparent;
  min-height: 36px;
`;

// --- Status (All/Pending/Acquired) + column sort bar (light bar above the list) ---

export const SortBar = styled.div`
  display: flex;
  gap: 6px;
  padding: 8px 16px;
  overflow-x: auto;
  scrollbar-width: none;
  background: #f0ede8;

  &::-webkit-scrollbar { display: none; }
`;

export const SortBtn = styled.button<{ $active: boolean }>`
  flex-shrink: 0;
  padding: 5px 12px;
  border-radius: 999px;
  border: 1.5px solid ${p => p.$active ? '#1a1a1a' : '#ccc'};
  background: ${p => p.$active ? '#1a1a1a' : 'transparent'};
  color: ${p => p.$active ? '#c8f59e' : '#888'};
  font-size: 11px;
  font-family: 'Georgia', serif;
  letter-spacing: 0.04em;
  cursor: pointer;
  transition: all 0.15s;
  min-height: 30px;
`;
