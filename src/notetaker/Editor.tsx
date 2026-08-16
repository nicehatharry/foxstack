import type { Note, NotePatch } from './Notetaker.types';
import { MarkdownBody } from './MarkdownBody';
import {
  EditorPane, EditorTopbar, BackBtn,
  EditorScroll, EditorInner, TitleInput,
  EditorEmpty, EditorEmptyInner,
} from './styles/editor';

interface EditorProps {
  note: Note | null;
  hidden: boolean;
  onChange: (patch: NotePatch) => void;
  onBack: () => void;
  onCreate: () => void;
}

export const Editor: React.FC<EditorProps> = ({ note, hidden, onChange, onBack, onCreate }) => {
  if (!note) {
    return (
      <EditorPane $hidden={hidden}>
        <EditorEmpty>
          <EditorEmptyInner>
            No note selected.
            <br />
            <button type="button" onClick={onCreate}>Start a new note</button>
          </EditorEmptyInner>
        </EditorEmpty>
      </EditorPane>
    );
  }

  return (
    <EditorPane $hidden={hidden}>
      <EditorTopbar>
        <BackBtn type="button" onClick={onBack}>
          <span aria-hidden="true">‹</span>
          <span>Notes</span>
        </BackBtn>
      </EditorTopbar>

      <EditorScroll>
        <EditorInner>
          <TitleInput
            type="text"
            placeholder="Untitled"
            value={note.title}
            onChange={e => onChange({ title: e.target.value })}
            aria-label="Note title"
          />

          {/* Remounts on note switch via key, so CodeMirror's own undo
              history doesn't bleed across notes. */}
          <MarkdownBody
            key={note.id}
            value={note.content}
            onChange={content => onChange({ content })}
            placeholder="Start writing…"
          />
        </EditorInner>
      </EditorScroll>
    </EditorPane>
  );
};
