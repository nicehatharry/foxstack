// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { FlipCard } from '../FlipCard';
import type { NounCard, VerbCard } from '../FlashCards.types';

afterEach(cleanup);

const masculineNoun: NounCard = { id: 'm', german: 'Baum', english: 'tree', partOfSpeech: 'noun', article: 'der' };
const commonGenderNoun: NounCard = { id: 'c', german: 'Angestellte', english: 'employee', partOfSpeech: 'noun', article: 'der/die' };
const verbCard: VerbCard = { id: 'v', german: 'gehen', english: 'to go', partOfSpeech: 'verb' };

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * The CSS declaration block(s) for the given element's own class(es), from all
 * injected <style> tags. styled-components classnames are plain
 * alphanumeric/hyphen tokens, so a regex is simpler here than CSS.escape,
 * which some jsdom versions don't implement as a global.
 */
function styleRulesFor(el: Element): string {
  const stylesheetText = Array.from(document.querySelectorAll('style')).map(s => s.textContent).join('\n');
  return Array.from(el.classList)
    .flatMap(cls => Array.from(stylesheetText.matchAll(new RegExp(`\\.${escapeRegExp(cls)}\\s*\\{([^}]*)\\}`, 'g'))))
    .map(m => m[1])
    .join('\n');
}

describe('FlipCard — answer-side background', () => {
  const noop = () => {};

  it('a common-gender noun gets an exact hard-stop 50/50 split, blue on the left / red on the right', () => {
    const { container } = render(
      <FlipCard card={commonGenderNoun} position={1} total={1} isFlipped onReveal={noop} onGrade={noop} />,
    );
    const back = container.querySelector('article[aria-label$="answer"]')!;
    const rules = styleRulesFor(back);
    // The exact gradient, not just "contains a gradient somewhere": confirms it's a hard
    // stop (50%/50%, not a blended 0%/100%) and that masculine-blue reads first — matching
    // the "der/die" article's own left-to-right order, which is the whole point of the choice.
    expect(rules).toMatch(/linear-gradient\(to right,\s*#CFE0F5\s*50%,\s*#F3CFCB\s*50%\)/i);
  });

  it('a masculine noun gets a plain solid background — no gradient at all', () => {
    const { container } = render(
      <FlipCard card={masculineNoun} position={1} total={1} isFlipped onReveal={noop} onGrade={noop} />,
    );
    const back = container.querySelector('article[aria-label$="answer"]')!;
    const rules = styleRulesFor(back);
    expect(rules).not.toMatch(/linear-gradient/);
    expect(rules).toMatch(/#CFE0F5/i);
  });

  it('a non-noun still gets the plain "other" tone, unaffected by the new common-gender tone', () => {
    const { container } = render(
      <FlipCard card={verbCard} position={1} total={1} isFlipped onReveal={noop} onGrade={noop} />,
    );
    const back = container.querySelector('article[aria-label$="answer"]')!;
    const rules = styleRulesFor(back);
    expect(rules).not.toMatch(/linear-gradient/);
    expect(rules).toMatch(/#F8DFC0/i);
  });
});
