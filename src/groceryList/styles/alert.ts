import styled from 'styled-components';

// Conflict / error banner that sits below the filter bar
export const AlertBanner = styled.div<{ $variant: 'conflict' | 'error' }>`
  background: ${p => p.$variant === 'conflict' ? '#fff3e0' : '#fff0f0'};
  border-bottom: 1px solid ${p => p.$variant === 'conflict' ? '#ffe0b2' : '#ffd5d5'};
  padding: 10px 16px;
  font-size: 12px;
  font-family: 'Georgia', serif;
  color: ${p => p.$variant === 'conflict' ? '#e65100' : '#c62828'};
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

export const AlertAction = styled.button`
  background: none;
  border: none;
  font-size: 11px;
  font-family: 'Georgia', serif;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  cursor: pointer;
  color: inherit;
  text-decoration: underline;
  padding: 0;
  flex-shrink: 0;
`;
