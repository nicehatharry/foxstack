import styled from 'styled-components';

export const FAB = styled.button`
  position: fixed;
  bottom: 28px;
  right: 50%;
  transform: translateX(calc(50% - 16px));
  /* sits inside the 430px container with 16px right margin */
  width: 56px;
  height: 56px;
  border-radius: 16px;
  background: #1a1a1a;
  color: #c8f59e;
  border: none;
  font-size: 28px;
  cursor: pointer;
  box-shadow: 0 4px 20px rgba(0,0,0,0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 150;
  transition: transform 0.15s ease, background 0.15s;

  &:active {
    transform: translateX(calc(50% - 16px)) scale(0.93);
  }

  &:disabled {
    display: none;
  }
`;
