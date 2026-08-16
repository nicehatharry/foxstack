import { useEffect, useRef } from 'react';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap, placeholder as placeholderExt, type ViewUpdate } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { markdown } from '@codemirror/lang-markdown';
import { Strikethrough } from '@lezer/markdown';
import { liveMarkdownPlugin, editorTheme } from './codemirrorSetup';
import { CodemirrorBodyMount } from './styles/editor';

interface MarkdownBodyProps {
  value: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

export const MarkdownBody: React.FC<MarkdownBodyProps> = ({ value, onChange, placeholder = '' }) => {
  const hostRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // Only mount CodeMirror once.
  useEffect(() => {
    if (!hostRef.current) return;

    const view = new EditorView({
      parent: hostRef.current,
      state: EditorState.create({
        doc: value,
        extensions: [
          history(),
          keymap.of([...defaultKeymap, ...historyKeymap]),
          markdown({ extensions: [Strikethrough] }),
          EditorView.lineWrapping,
          placeholderExt(placeholder),
          liveMarkdownPlugin,
          editorTheme,
          EditorView.updateListener.of((update: ViewUpdate) => {
            if (update.docChanged) onChangeRef.current(update.state.doc.toString());
          }),
        ],
      }),
    });

    viewRef.current = view;
    return () => view.destroy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Replace the doc when a different note is selected.
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const current = view.state.doc.toString();
    if (current !== value) {
      view.dispatch({
        changes: { from: 0, to: current.length, insert: value },
      });
    }
  }, [value]);

  return <CodemirrorBodyMount ref={hostRef} />;
};
