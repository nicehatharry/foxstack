// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { CardAnswer } from '../CardAnswer';
import type { AdverbCard, NounCard, VerbCard } from '../FlashCards.types';

afterEach(cleanup);

const nounWithForms: NounCard = {
  id: 'n', german: 'Handschuh', english: 'glove', partOfSpeech: 'noun', article: 'der',
  forms: { plural: 'Handschuhe', genitiveSingular: 'Handschuhs' },
};
const adverbNoForms: AdverbCard = { id: 'v', german: 'trotzdem', english: 'nevertheless', partOfSpeech: 'adverb' };
const commonGenderNoun: NounCard = {
  id: 'c', german: 'Angestellte', english: 'employee', partOfSpeech: 'noun', article: 'der/die',
  forms: { plural: 'Angestellten', genitiveSingular: 'Angestellten' },
};

describe('CardAnswer — forms toggle', () => {
  it('renders the German word as a button when the card has forms, a plain <p> otherwise', () => {
    const { unmount } = render(<CardAnswer card={nounWithForms} onGrade={() => {}} />);
    expect(screen.getByRole('button', { name: 'der Handschuh' })).toBeTruthy();
    unmount();

    render(<CardAnswer card={adverbNoForms} onGrade={() => {}} />);
    expect(screen.queryByRole('button', { name: 'trotzdem' })).toBeNull();
    const p = screen.getByText('trotzdem');
    expect(p.tagName).toBe('P');
  });

  it('a common-gender noun shows the combined "der/die" article, unchanged from getArticle', () => {
    render(<CardAnswer card={commonGenderNoun} onGrade={() => {}} />);
    expect(screen.getByRole('button', { name: 'der/die Angestellte' })).toBeTruthy();
  });

  it('starts collapsed (translation showing, aria-expanded false) and toggles on tap', () => {
    render(<CardAnswer card={nounWithForms} onGrade={() => {}} />);
    const toggle = screen.getByRole('button', { name: 'der Handschuh' });
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(screen.getByText('glove')).toBeTruthy();

    fireEvent.click(toggle);
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(screen.queryByText('glove')).toBeNull();
    expect(screen.getByText('die Handschuhe')).toBeTruthy();

    fireEvent.click(toggle);
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(screen.getByText('glove')).toBeTruthy();
  });

  it('aria-controls on the toggle matches the id on the rendered panel', () => {
    render(<CardAnswer card={nounWithForms} onGrade={() => {}} />);
    const toggle = screen.getByRole('button', { name: 'der Handschuh' });
    fireEvent.click(toggle);
    const panelId = toggle.getAttribute('aria-controls');
    expect(panelId).toBeTruthy();
    expect(document.getElementById(panelId!)).not.toBeNull();
  });

  it('REGRESSION: toggling forms does not bubble a click to an ancestor (would otherwise re-trigger reveal in FlipCard)', () => {
    const bubbled = vi.fn();
    render(
      <div onClick={bubbled}>
        <CardAnswer card={nounWithForms} onGrade={() => {}} />
      </div>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'der Handschuh' }));
    expect(bubbled).not.toHaveBeenCalled();
  });

  it('toggling forms never calls onGrade', () => {
    const onGrade = vi.fn();
    render(<CardAnswer card={nounWithForms} onGrade={onGrade} />);
    fireEvent.click(screen.getByRole('button', { name: 'der Handschuh' }));
    expect(onGrade).not.toHaveBeenCalled();
  });

  it('grading also does not bubble a click to an ancestor', () => {
    const bubbled = vi.fn();
    render(
      <div onClick={bubbled}>
        <CardAnswer card={nounWithForms} onGrade={() => {}} />
      </div>,
    );
    fireEvent.click(screen.getByText('Got it'));
    expect(bubbled).not.toHaveBeenCalled();
  });
});

describe('CardAnswer — grading', () => {
  const verbWithoutForms: VerbCard = { id: 'x', german: 'sein', english: 'to be', partOfSpeech: 'verb' };

  it('Missed it / Got it call onGrade with the right value', () => {
    const onGrade = vi.fn();
    render(<CardAnswer card={verbWithoutForms} onGrade={onGrade} />);
    fireEvent.click(screen.getByText('Missed it'));
    fireEvent.click(screen.getByText('Got it'));
    expect(onGrade.mock.calls).toEqual([['missed'], ['got']]);
  });
});
