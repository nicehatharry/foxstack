export interface Note {
  id: string;
  title: string;
  content: string;
  updatedAt: number;
}

export type NotePatch = Partial<Pick<Note, 'title' | 'content'>>;

export type MobileView = 'list' | 'editor';
