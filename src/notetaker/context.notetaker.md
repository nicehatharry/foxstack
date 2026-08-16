# notetaker.context.md

## What this is
A notetaking feature living at route /notetaker inside the foxstack monorepo app. Sidebar list of notes (left) + editable title/body (right). No backend, localStorage only.

## Location
root/src/notetaker/

notetaker/
  Notetaker.tsx          entry point, default export, lazy-loaded from App.tsx
  Notetaker.types.ts     Note, NotePatch, MobileView
  useNotes.ts            CRUD + localStorage persistence hook
  Sidebar.tsx
  Editor.tsx
  MarkdownBody.tsx        React wrapper mounting the CodeMirror body editor
  codemirrorSetup.ts       CodeMirror extensions: live-preview decoration plugin + theme
  styles/
    tokens.ts            colors, fonts, layout constants
    layout.ts             Shell (fixed flex row wrapper) + NotetakerGlobalStyle (pins html/body bg, kills overscroll bounce)
    sidebar.ts             styled-components for Sidebar
    editor.ts               styled-components for Editor, incl. BodyMount (CodeMirror host div)

Routing: App.tsx lazy-imports Notetaker and mounts it at Route path="/notetaker".

## New dependencies (add to package.json)
@codemirror/state, @codemirror/view, @codemirror/language, @codemirror/lang-markdown,
@codemirror/commands, @lezer/markdown

## Stack / conventions (match these, do not reinvent)
- React 19 + TypeScript, strict tsconfig
- Styling: styled-components, transient props
- React.FC<Props> typing, semicolons, single quotes

## Data model
interface Note { id: string; title: string; content: string; updatedAt: number }

Persisted as JSON array under localStorage['notetaker.notes.v1'].
Active note id under localStorage['notetaker.activeId.v1'].
No sync, no backend, no conflict handling -- single-device only.
content is always plain markdown text -- CodeMirror decorations are display-only, never mutate the string.

## State flow
useNotes() owns notes array + active id, exposes createNote/updateNote/deleteNote/setActiveId.  
Notetaker.tsx owns mobileView: 'list' | 'editor' for responsivity

## Responsive behavior
Breakpoint: 768px (layout.breakpointMobile in tokens.ts). Target device: iPhone 15.
Desktop: both panes visible side by side.
Mobile: SidebarAside is always mounted (fixed, inset:0) and slides in/out as an
overlay drawer via transform: translateX + transition, driven by $hidden.
Editor still toggles via its own hidden prop (unchanged).
Shell is position:fixed inset:0 and html/body bg is pinned to colors.stack
(NotetakerGlobalStyle) to stop iOS rubber-band overscroll from flashing the
page's default background at top/bottom.

## Markdown body rendering (Obsidian-style live preview)
Body is a real CodeMirror 6 EditorView (MarkdownBody.tsx), not a textarea.
There is exactly one text layer -- no sync-two-layers hack. codemirrorSetup.ts
has two exports:
  - editorTheme: EditorView.theme() mapping cm-md-* classes to tokens.ts colors/fonts.
  - liveMarkdownPlugin: a ViewPlugin that walks the markdown syntax tree
    (syntaxTree(state)) each doc-change/selection-change/viewport-change.
    Nodes like StrongEmphasis/Emphasis/InlineCode/etc get a persistent style
    class over their full range. Their literal mark tokens (HeaderMark,
    EmphasisMark, CodeMark, ...) get Decoration.replace({}) -- hidden --
    unless the cursor's current line matches the mark's line, in which case
    the raw markdown stays visible and editable. This is what gives the
    "type ** and it becomes bold, but shows raw syntax while your cursor is
    on that line" behavior.
Editor.tsx remounts MarkdownBody via key={note.id} on note switch, so
CodeMirror's own undo history resets per note rather than carrying over.
MarkdownBody also has a secondary effect that dispatches a doc replacement
if `value` changes without a key remount (defensive; not currently hit by
any code path, since note switching always changes note.id).
