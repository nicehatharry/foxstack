// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup, within } from '@testing-library/react';
import { WordForms } from '../WordForms';
import type { AdjectiveCard, AdverbCard, NounCard, VerbCard } from '../FlashCards.types';

afterEach(cleanup);

describe('WordForms — noun', () => {
  const base: NounCard = { id: 'n', german: 'Handschuh', english: 'glove', partOfSpeech: 'noun', article: 'der' };

  it('shows the plural with "die" and the genitive with the gender-derived article', () => {
    render(<WordForms id="f" card={{ ...base, forms: { plural: 'Handschuhe', genitiveSingular: 'Handschuhs' } }} />);
    expect(screen.getByText('die Handschuhe')).toBeTruthy();
    expect(screen.getByText('des Handschuhs')).toBeTruthy();
  });

  it('a missing plural shows explanatory text, never a blank cell', () => {
    render(<WordForms id="f" card={{ ...base, forms: { genitiveSingular: 'Handschuhs' } }} />);
    expect(screen.getByText(/no plural form/i)).toBeTruthy();
    expect(screen.getByText('des Handschuhs')).toBeTruthy();
  });

  it('a missing genitive shows explanatory text', () => {
    render(<WordForms id="f" card={{ ...base, forms: { plural: 'Handschuhe' } }} />);
    expect(screen.getByText(/no genitive form/i)).toBeTruthy();
  });

  it('feminine nouns get "der" in the genitive, not "des"', () => {
    render(<WordForms id="f" card={{ id: 'n2', german: 'Katze', english: 'cat', partOfSpeech: 'noun', article: 'die', forms: { genitiveSingular: 'Katze' } }} />);
    expect(screen.getByText('der Katze')).toBeTruthy();
  });

  it('row headers are real <th scope="row"> for assistive tech', () => {
    render(<WordForms id="f" card={{ ...base, forms: { plural: 'Handschuhe' } }} />);
    const th = screen.getByText('Plural');
    expect(th.tagName).toBe('TH');
    expect(th.getAttribute('scope')).toBe('row');
  });
});

describe('WordForms — verb', () => {
  const present = { ich: 'gehe', du: 'gehst', erSieEs: 'geht', wir: 'gehen', ihr: 'geht', sieSie: 'gehen' };
  const preterite = { ich: 'ging', du: 'gingst', erSieEs: 'ging', wir: 'gingen', ihr: 'gingt', sieSie: 'gingen' };
  const base: VerbCard = { id: 'v', german: 'gehen', english: 'to go', partOfSpeech: 'verb' };

  it('shows all six persons for Präsens and Präteritum, and the Perfekt principal part', () => {
    render(<WordForms id="f" card={{ ...base, forms: { present, preterite, perfect: { auxiliary: 'ist', participle: 'gegangen' } } }} />);
    expect(screen.getByText('Präsens')).toBeTruthy();
    expect(screen.getByText('Präteritum')).toBeTruthy();
    for (const label of ['ich', 'du', 'er/sie/es', 'wir', 'ihr', 'sie/Sie']) {
      expect(screen.getAllByText(label)).toHaveLength(2); // once per table
    }
    expect(screen.getByText('gehe')).toBeTruthy();
    // ich and er/sie/es always share the same preterite form in German (a universal rule, not
    // specific to this verb), so "ging" legitimately appears twice — once per table row.
    expect(screen.getAllByText('ging')).toHaveLength(2);
    expect(screen.getByText(/ist gegangen/)).toBeTruthy();
  });

  it('pairs each singular person with its plural counterpart in the same row (ich/wir, du/ihr, er,sie,es/sie,Sie)', () => {
    render(<WordForms id="f" card={{ ...base, forms: { present, preterite, perfect: { auxiliary: 'ist', participle: 'gegangen' } } }} />);
    const pairs: Array<[string, string]> = [['ich', 'wir'], ['du', 'ihr'], ['er/sie/es', 'sie/Sie']];
    for (const [leftLabel, rightLabel] of pairs) {
      // Präsens table only (labels also appear in Präteritum, so scope via the first match's row).
      const leftTh = screen.getAllByText(leftLabel)[0];
      const row = leftTh.closest('tr')!;
      expect(within(row).getByText(rightLabel)).toBeTruthy();
    }
  });

  it('REGRESSION: each value is wired to only its own header, not both headers in the row (WCAG headers/id technique)', () => {
    const { container } = render(<WordForms id="my-panel" card={{ ...base, forms: { present, preterite, perfect: { auxiliary: 'ist', participle: 'gegangen' } } }} />);
    const wirLabel = screen.getAllByText('wir')[0]; // Präsens table's "wir" row header
    const ichLabel = screen.getAllByText('ich')[0];
    expect(wirLabel.id).toBeTruthy();

    // Look the value up by its `headers` wiring, not by text content, since a value's text
    // (a conjugated form) coinciding with a label's text is entirely possible for other verbs.
    const wirValue = container.querySelector(`td[headers="${wirLabel.id}"]`);
    expect(wirValue).not.toBeNull();
    expect(wirValue!.textContent).toBe(present.wir);
    // Specifically NOT associated with "ich" (the other header sharing the row) — the exact bug this guards against.
    expect(wirValue!.getAttribute('headers')).not.toBe(ichLabel.id);
  });

  it('header ids are unique between Präsens and Präteritum (same person keys, different tenses)', () => {
    render(<WordForms id="my-panel" card={{ ...base, forms: { present, preterite, perfect: { auxiliary: 'ist', participle: 'gegangen' } } }} />);
    const [presentIch, preteriteIch] = screen.getAllByText('ich');
    expect(presentIch.id).not.toBe(preteriteIch.id);
    expect(presentIch.id).toBeTruthy();
    expect(preteriteIch.id).toBeTruthy();
  });

  it('a long reflexive form (the realistic worst case in the sample deck) is allowed to wrap/hyphenate rather than overflow', () => {
    const reflexivePreterite = { ich: 'erinnerte mich', du: 'erinnertest dich', erSieEs: 'erinnerte sich', wir: 'erinnerten uns', ihr: 'erinnertet euch', sieSie: 'erinnerten sich' };
    render(<WordForms id="f" card={{
      id: 'v3', german: 'sich erinnern', english: 'to remember', partOfSpeech: 'verb',
      forms: { present, preterite: reflexivePreterite, perfect: { auxiliary: 'hat', participle: 'sich erinnert' } },
    }}
    />);
    const cell = screen.getByText('erinnertest dich');
    expect(cell.tagName).toBe('TD');
    // Can't observe actual wrapping in jsdom (no layout engine) — confirm the CSS guard
    // is really present in the generated stylesheet, not just that the cell renders.
    const css = Array.from(document.querySelectorAll('style')).map(s => s.textContent).join('\n');
    expect(css).toMatch(/overflow-wrap/);
    expect(css).toMatch(/hyphens/);
  });

  it('renders a reflexive verb\'s baked-in pronouns without any special-casing', () => {
    const reflexivePresent = { ich: 'erinnere mich', du: 'erinnerst dich', erSieEs: 'erinnert sich', wir: 'erinnern uns', ihr: 'erinnert euch', sieSie: 'erinnern sich' };
    render(<WordForms id="f" card={{
      id: 'v2', german: 'sich erinnern', english: 'to remember', partOfSpeech: 'verb',
      forms: { present: reflexivePresent, preterite, perfect: { auxiliary: 'hat', participle: 'sich erinnert' } },
    }}
    />);
    expect(screen.getByText('erinnere mich')).toBeTruthy();
    expect(screen.getByText(/hat sich erinnert/)).toBeTruthy();
  });

  it('shows a government note only when one is recorded', () => {
    const forms = { present, preterite, perfect: { auxiliary: 'ist' as const, participle: 'gegangen' } };
    const { rerender } = render(<WordForms id="f" card={{ ...base, forms }} />);
    expect(screen.queryByText(/governs/i)).toBeNull();
    rerender(<WordForms id="f" card={{ ...base, forms: { ...forms, government: 'an + Akk.' } }} />);
    expect(screen.getByText(/governs/i)).toBeTruthy();
    expect(screen.getByText(/an \+ Akk\./)).toBeTruthy();
  });

  it('is a defensive no-op if forms is somehow absent (hasForms would already exclude this card)', () => {
    const { container } = render(<WordForms id="f" card={base} />);
    // No jest-dom in this suite (see context-FlashCards.md §9) — assert directly:
    // returning null renders nothing inside RTL's wrapper div.
    expect(container.innerHTML).toBe('');
  });
});

describe('WordForms — adjective', () => {
  const base: AdjectiveCard = { id: 'a', german: 'schön', english: 'beautiful', partOfSpeech: 'adjective' };

  it('shows comparative and superlative as given, without reconstructing them', () => {
    render(<WordForms id="f" card={{ ...base, forms: { comparative: 'schöner', superlative: 'am schönsten' } }} />);
    expect(screen.getByText('schöner')).toBeTruthy();
    expect(screen.getByText('am schönsten')).toBeTruthy();
  });

  it('a missing field shows explanatory text', () => {
    render(<WordForms id="f" card={{ ...base, forms: { comparative: 'schöner' } }} />);
    expect(screen.getByText(/no superlative form/i)).toBeTruthy();
  });
});

describe('WordForms — no forms modelled', () => {
  it('adverb renders nothing', () => {
    const card: AdverbCard = { id: 'x', german: 'trotzdem', english: 'nevertheless', partOfSpeech: 'adverb' };
    const { container } = render(<WordForms id="f" card={card} />);
    expect(container.innerHTML).toBe('');
  });
});

describe('WordForms — container', () => {
  it('carries the given id (for aria-controls) and lang="de"', () => {
    const card: AdjectiveCard = { id: 'a', german: 'gut', english: 'good', partOfSpeech: 'adjective', forms: { comparative: 'besser' } };
    const { container } = render(<WordForms id="my-panel-id" card={card} />);
    const root = container.firstElementChild!;
    expect(root.id).toBe('my-panel-id');
    expect(root.getAttribute('lang')).toBe('de');
  });
});
