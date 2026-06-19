import styled, { css } from 'styled-components';
import { slideUp } from '../animations';

export const Overlay = styled.div<{ $visible: boolean }>`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.4);
  z-index: 200;
  opacity: ${p => p.$visible ? 1 : 0};
  pointer-events: ${p => p.$visible ? 'auto' : 'none'};
  transition: opacity 0.25s ease;
`;

export const Sheet = styled.div<{ $visible: boolean }>`
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%) translateY(${p => p.$visible ? '0' : '100%'});
  width: 100%;
  max-width: 430px;
  background: #fff;
  border-radius: 20px 20px 0 0;
  z-index: 300;
  padding: 0 20px 32px;
  transition: transform 0.3s cubic-bezier(0.32, 0.72, 0, 1);
  box-shadow: 0 -8px 40px rgba(0,0,0,0.18);
  animation: ${p => p.$visible ? css`${slideUp} 0.3s cubic-bezier(0.32, 0.72, 0, 1)` : 'none'};
`;

export const SheetHandle = styled.div`
  width: 36px;
  height: 4px;
  border-radius: 2px;
  background: #ddd;
  margin: 12px auto 18px;
`;

export const SheetTitle = styled.h3`
  margin: 0 0 18px;
  font-size: 18px;
  font-weight: 400;
  font-family: 'Georgia', serif;
  font-style: italic;
  color: #1a1a1a;
`;

export const FieldGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 12px;
`;

export const FieldFull = styled.div`
  grid-column: 1 / -1;
`;

export const FieldLabel = styled.label`
  display: block;
  font-size: 10px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #888;
  margin-bottom: 5px;
  font-family: 'Georgia', serif;
`;

export const FieldInput = styled.input`
  width: 100%;
  padding: 11px 12px;
  border: 1.5px solid #e8e8e8;
  border-radius: 10px;
  font-size: 15px;
  font-family: 'Georgia', serif;
  background: #fafafa;
  color: #1a1a1a;
  outline: none;
  transition: border-color 0.15s;

  &:focus {
    border-color: #1a1a1a;
    background: #fff;
  }
`;

export const FieldSelect = styled.select`
  width: 100%;
  padding: 11px 12px;
  border: 1.5px solid #e8e8e8;
  border-radius: 10px;
  font-size: 15px;
  font-family: 'Georgia', serif;
  background: #fafafa;
  color: #1a1a1a;
  outline: none;
  -webkit-appearance: none;
  transition: border-color 0.15s;

  &:focus {
    border-color: #1a1a1a;
    background: #fff;
  }
`;

export const SubmitBtn = styled.button`
  width: 100%;
  padding: 15px;
  background: #1a1a1a;
  color: #c8f59e;
  border: none;
  border-radius: 12px;
  font-size: 15px;
  font-family: 'Georgia', serif;
  letter-spacing: 0.06em;
  cursor: pointer;
  margin-top: 8px;
  transition: background 0.15s;

  &:active {
    background: #333;
  }
`;
