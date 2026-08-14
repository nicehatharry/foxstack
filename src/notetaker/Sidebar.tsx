import type { Note } from './Notetaker.types';
import {
  SidebarAside, SidebarHeader, Wordmark,
  NewNoteBtn, PlusGlyph,
  NoteList, NoteListEmpty, NoteCard, NoteCardTitle, NoteCardMeta, NoteCardDelete,
} from './styles/sidebar';

function formatMeta(note: Note): string {
  const preview = note.content.trim().split('\n')[0].slice(0, 60);
  const dateStr = new Date(note.updatedAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
  return preview ? `${dateStr} — ${preview}` : dateStr;
}

interface SidebarProps {
  notes: Note[];
  activeId: string | null;
  hidden: boolean;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onDelete: (id: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  notes,
  activeId,
  hidden,
  onSelect,
  onCreate,
  onDelete,
}) => {
  return (
    <SidebarAside $hidden={hidden}>
      <SidebarHeader>
        <Wordmark>Notetaker</Wordmark>
      </SidebarHeader>

      <NewNoteBtn type="button" onClick={onCreate}>
        <PlusGlyph>+</PlusGlyph>
        <span>New note</span>
      </NewNoteBtn>

      <NoteList aria-label="Notes">
        {notes.length === 0 && (
          <NoteListEmpty>No notes yet. Tap “New note” to start writing.</NoteListEmpty>
        )}

        {notes.map(note => {
          const isActive = note.id === activeId;
          const title = note.title.trim();
          return (
            <NoteCard
              key={note.id}
              type="button"
              $active={isActive}
              onClick={() => onSelect(note.id)}
              aria-current={isActive}
            >
              <NoteCardTitle $untitled={!title}>{title || 'Untitled'}</NoteCardTitle>
              <NoteCardMeta>{formatMeta(note)}</NoteCardMeta>
              <NoteCardDelete
                data-role="delete"
                role="button"
                tabIndex={0}
                aria-label={`Delete ${title || 'Untitled'}`}
                onClick={e => {
                  e.stopPropagation();
                  onDelete(note.id);
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.stopPropagation();
                    onDelete(note.id);
                  }
                }}
              >
                ×
              </NoteCardDelete>
            </NoteCard>
          );
        })}
      </NoteList>
    </SidebarAside>
  );
};
