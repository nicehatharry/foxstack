import { RangeSetBuilder } from '@codemirror/state';
import { syntaxTree } from '@codemirror/language';
import {
  Decoration,
  EditorView,
  ViewPlugin,
  type DecorationSet,
  type ViewUpdate,
} from '@codemirror/view';
import { colors, fonts, layout } from './styles/tokens';

// Nodes whose full range gets a persistent style (bold/italic/etc).
const STYLE_NODE_CLASS: Record<string, string> = {
  ATXHeading1: 'cm-md-h1',
  ATXHeading2: 'cm-md-h2',
  ATXHeading3: 'cm-md-h3',
  ATXHeading4: 'cm-md-h4',
  ATXHeading5: 'cm-md-h5',
  ATXHeading6: 'cm-md-h6',
  StrongEmphasis: 'cm-md-strong',
  Emphasis: 'cm-md-em',
  InlineCode: 'cm-md-code',
  Strikethrough: 'cm-md-strike',
  Blockquote: 'cm-md-quote',
  Link: 'cm-md-link',
  URL: 'cm-md-url',
};

// Literal mark characters ('**', '#', '`', ...) -- hidden unless the
// cursor's current line intersects them, Obsidian-style.
const MARK_NODE_NAMES = new Set([
  'HeaderMark',
  'EmphasisMark',
  'CodeMark',
  'StrikethroughMark',
  'LinkMark',
  'QuoteMark',
]);

const hideMark = Decoration.replace({});

function buildDecorations(view: EditorView): DecorationSet {
  const cursorLine = view.state.doc.lineAt(view.state.selection.main.head).number;
  const collected: { from: number; to: number; deco: Decoration }[] = [];

  for (const { from, to } of view.visibleRanges) {
    syntaxTree(view.state).iterate({
      from,
      to,
      enter: node => {
        const styleClass = STYLE_NODE_CLASS[node.name];
        if (styleClass) {
          collected.push({ from: node.from, to: node.to, deco: Decoration.mark({ class: styleClass }) });
          return;
        }
        if (MARK_NODE_NAMES.has(node.name)) {
          const onCursorLine = view.state.doc.lineAt(node.from).number === cursorLine;
          if (!onCursorLine) {
            collected.push({ from: node.from, to: node.to, deco: hideMark });
          }
        }
      },
    });
  }

  collected.sort((a, b) => a.from - b.from || a.to - b.to);
  const builder = new RangeSetBuilder<Decoration>();
  for (const r of collected) builder.add(r.from, r.to, r.deco);
  return builder.finish();
}

// Recomputes on doc edits, cursor moves, and viewport scroll (new lines
// entering view need their decorations built too).
export const liveMarkdownPlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;
    constructor(view: EditorView) {
      this.decorations = buildDecorations(view);
    }
    update(update: ViewUpdate) {
      if (update.docChanged || update.selectionSet || update.viewportChanged) {
        this.decorations = buildDecorations(update.view);
      }
    }
  },
  { decorations: v => v.decorations },
);

export const editorTheme = EditorView.theme({
  '&': {
    color: colors.inkSoft,
    fontFamily: fonts.body,
    fontSize: '17px',
    backgroundColor: 'transparent',
  },
  '&.cm-focused': { outline: 'none' },
  '.cm-content': {
    padding: '0',
    lineHeight: '1.75',
    caretColor: colors.inkSoft,
  },
  '.cm-line': { padding: '0' },
  '.cm-scroller': { fontFamily: 'inherit' },
  '.cm-placeholder': { color: '#b7b0a0' },

  '.cm-md-h1, .cm-md-h2, .cm-md-h3, .cm-md-h4, .cm-md-h5, .cm-md-h6': {
    fontWeight: '700',
    color: colors.ink,
  },
  '.cm-md-strong': { fontWeight: '700' },
  '.cm-md-em': { fontStyle: 'italic' },
  '.cm-md-code': {
    fontFamily: fonts.label,
    color: colors.accentSoft,
    backgroundColor: colors.paperLine,
    borderRadius: '3px',
    padding: '0 3px',
  },
  '.cm-md-strike': { textDecoration: 'line-through', opacity: '0.65' },
  '.cm-md-quote': { color: colors.inkSoft, fontStyle: 'italic' },
  '.cm-md-link': { color: colors.accent },
  '.cm-md-url': { opacity: '0.55' },

  [`@media (max-width: ${layout.breakpointMobile})`]: {
    '&': { fontSize: '16px' },
  },
});
