import { useState } from 'react';
import { useNotes } from './useNotes';
import { Sidebar } from './Sidebar';
import { Editor } from './Editor';
import { Shell } from './styles/layout';
import type { MobileView, NotePatch } from './Notetaker.types';

const Notetaker: React.FC = () => {
  const {
    notes,
    activeNote,
    activeId,
    setActiveId,
    createNote,
    updateNote,
    deleteNote,
  } = useNotes();

  // Only matters on narrow (mobile) layouts, where the sidebar and editor
  // occupy the same single pane and swap via this toggle.
  const [mobileView, setMobileView] = useState<MobileView>('list');

  const handleSelect = (id: string) => {
    setActiveId(id);
    setMobileView('editor');
  };

  const handleCreate = () => {
    createNote();
    setMobileView('editor');
  };

  const handleDelete = (id: string) => {
    deleteNote(id);
    if (id === activeId) setMobileView('list');
  };

  const handleBack = () => setMobileView('list');

  const handleChange = (patch: NotePatch) => {
    if (activeNote) updateNote(activeNote.id, patch);
  };

  return (
    <Shell>
      <Sidebar
        notes={notes}
        activeId={activeId}
        hidden={mobileView !== 'list'}
        onSelect={handleSelect}
        onCreate={handleCreate}
        onDelete={handleDelete}
      />
      <Editor
        note={activeNote}
        hidden={mobileView !== 'editor'}
        onChange={handleChange}
        onBack={handleBack}
        onCreate={handleCreate}
      />
    </Shell>
  );
};

export default Notetaker;
