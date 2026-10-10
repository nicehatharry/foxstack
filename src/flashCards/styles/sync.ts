import styled from 'styled-components';

/** Save-failure notice, pinned above the safe area. Literal colors: not yet routed through tokens.ts. */
export const SyncBanner = styled.div`
  position: fixed;
  left: 12px;
  right: 12px;
  bottom: calc(12px + env(safe-area-inset-bottom, 0px));
  z-index: 500;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 14px;
  border-radius: 12px;
  background: #3a1d1d;
  color: #fff;
  font-size: 14px;
`;

export const SyncRetryBtn = styled.button`
  flex: none;
  min-height: 44px;
  padding: 0 14px;
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 8px;
  background: transparent;
  color: inherit;
  font: inherit;
  font-weight: 600;
`;
