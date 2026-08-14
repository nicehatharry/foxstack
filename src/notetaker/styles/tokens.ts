// Color and type tokens for the notetaker feature.

export const colors = {
  ink: '#1c1b1a', // primary text, near-black warm
  inkSoft: '#4a4843', // secondary text
  paper: '#f7f4ec', // editor surface, warm paper
  paperLine: '#e4dfd0', // hairline rule on paper
  stack: '#32392d', // sidebar surface, moss-black
  stackRaised: '#2c3126', // sidebar card / hover surface
  stackLine: '#3a3f33', // hairline rule on stack
  paperOnStack: '#f4f5f0', // text on dark sidebar
  mutedOnStack: '#9aa08d', // muted text on dark sidebar
  accent: '#3f6b8c', // fountain-pen ink blue
  accentSoft: '#2f5170', // pressed / darker accent
  danger: '#a8503c',
} as const;

export const fonts = {
  label: "'IBM Plex Mono', ui-monospace, 'SF Mono', Menlo, monospace",
  body: "'Source Serif 4', Georgia, 'Times New Roman', serif",
} as const;

export const layout = {
  sidebarWidth: '280px',
  breakpointMobile: '768px',
} as const;
