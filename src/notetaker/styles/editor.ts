import styled from 'styled-components';
import { colors, fonts, layout } from './tokens';

export const EditorPane = styled.section<{ $hidden: boolean }>`
  flex: 1;
  min-width: 0;
  background: ${colors.paper};
  display: flex;
  flex-direction: column;
  padding-top: env(safe-area-inset-top, 0px);
  padding-right: env(safe-area-inset-right, 0px);
  padding-bottom: env(safe-area-inset-bottom, 0px);

  @media (max-width: ${layout.breakpointMobile}) {
    width: 100%;
    display: ${p => (p.$hidden ? 'none' : 'flex')};
  }
`;

export const EditorTopbar = styled.div`
  display: none;
  align-items: center;
  height: 48px;
  padding: 0 8px;
  flex-shrink: 0;

  @media (max-width: ${layout.breakpointMobile}) {
    display: flex;
  }
`;

export const BackBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 10px;
  font-family: ${fonts.label};
  font-size: 13px;
  color: ${colors.accent};
  background: none;
  border: none;
  cursor: pointer;
`;

export const EditorScroll = styled.div`
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
`;

export const EditorInner = styled.div`
  max-width: 680px;
  margin: 0 auto;
  padding: 56px 32px 80px;

  @media (max-width: ${layout.breakpointMobile}) {
    padding: 20px 20px 48px;
  }
`;

export const TitleInput = styled.input`
  display: block;
  width: 100%;
  border: none;
  outline: none;
  background: transparent;
  font-family: ${fonts.body};
  font-size: 32px;
  font-weight: 500;
  line-height: 1.25;
  color: ${colors.ink};
  padding-bottom: 16px;
  margin-bottom: 20px;
  border-bottom: 1px solid ${colors.paperLine};

  &::placeholder {
    color: #b7b0a0;
  }

  @media (max-width: ${layout.breakpointMobile}) {
    font-size: 26px;
  }
`;

// CodeMirror grows to fit its content by default, so this just sets a floor height.
export const CodemirrorBodyMount = styled.div`
  min-height: 50vh;

  .cm-editor {
    height: 100%;
  }
  .cm-scroller {
    /* Let content grow with the page instead of scrolling internally. */
    overflow: visible;
  }
`;

export const EditorEmpty = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 40px;
`;

export const EditorEmptyInner = styled.div`
  font-family: ${fonts.label};
  font-size: 13px;
  color: ${colors.inkSoft};
  line-height: 1.7;

  button {
    color: ${colors.accent};
    background: none;
    border: none;
    cursor: pointer;
    text-decoration: underline;
    text-underline-offset: 3px;
    font-family: inherit;
    font-size: inherit;
  }
`;
