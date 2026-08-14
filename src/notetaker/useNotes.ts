import { useCallback, useEffect, useState } from 'react';
import type { Note, NotePatch } from './Notetaker.types';

const NOTES_KEY = 'notetaker.notes.v1';
const ACTIVE_KEY = 'notetaker.activeId.v1';

function loadNotes(): Note[] {
  try {
    const raw = localStorage.getItem(NOTES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Note[]) : [];
  } catch {
    return [];
  }
}

function loadActiveId(): string | null {
  try {
    return localStorage.getItem(ACTIVE_KEY);
  } catch {
    return null;
  }
}

function makeId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export interface UseNotesResult {
  notes: Note[];
  activeNote: Note | null;
  activeId: string | null;
  setActiveId: (id: string | null) => void;
  createNote: () => string;
  updateNote: (id: string, patch: NotePatch) => void;
  deleteNote: (id: string) => void;
}

export function useNotes(): UseNotesResult {
  const [notes, setNotes] = useState<Note[]>(loadNotes);
  const [activeId, setActiveIdState] = useState<string | null>(loadActiveId);

  useEffect(() => {
    localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    if (activeId) {
      localStorage.setItem(ACTIVE_KEY, activeId);
    } else {
      localStorage.removeItem(ACTIVE_KEY);
    }
  }, [activeId]);

  const setActiveId = useCallback((id: string | null) => {
    setActiveIdState(id);
  }, []);

  const createNote = useCallback((): string => {
    const note: Note = {
      id: makeId(),
      title: '',
      content: '',
      updatedAt: Date.now(),
    };
    setNotes(prev => [note, ...prev]);
    setActiveIdState(note.id);
    return note.id;
  }, []);

  const updateNote = useCallback((id: string, patch: NotePatch) => {
    setNotes(prev =>
      prev.map(n => (n.id === id ? { ...n, ...patch, updatedAt: Date.now() } : n))
    );
  }, []);

  const deleteNote = useCallback((id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
    setActiveIdState(current => (current === id ? null : current));
  }, []);

  const notesSorted = [...notes].sort((a, b) => b.updatedAt - a.updatedAt);
  const activeNote = notes.find(n => n.id === activeId) ?? null;

  return {
    notes: notesSorted,
    activeNote,
    activeId,
    setActiveId,
    createNote,
    updateNote,
    deleteNote,
  };
}
