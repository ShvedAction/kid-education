import { describe, it, expect } from 'vitest';
import { simpleStrategy } from './simple-scenario';

const CLASSIFY_LETTER_ROUND = {
  type: 'classifyLetter' as const,
  letters: ['А', 'О', 'У', 'Н', 'К', 'М', 'П', 'С', 'Т'],
};

const PAIR_SYLLABLE_ROUND = {
  type: 'pairSyllable' as const,
  source_syllables: ['НА', 'НО', 'ПА', 'ПО', 'СА', 'СО', 'ТА', 'ТО'],
};

const COMPOSE_SYLLABLE_ROUND = {
  type: 'composeSyllable' as const,
  target: 'НА',
  letters: ['Н', 'О', 'А'],
};

describe('simpleStrategy', () => {
  it('should yield classifyLetter round first with letters А,О,У,Н,К,М,П,С,Т', () => {
    const gen = simpleStrategy();
    const step = gen.next();
    expect(step.done).toBe(false);
    expect(step.value).toEqual(CLASSIFY_LETTER_ROUND);
  });

  it('should yield pairSyllable round second with source_syllables НА,НО,ПА,ПО,СА,СО,ТА,ТО', () => {
    const gen = simpleStrategy();
    gen.next();
    gen.next();
    const step = gen.next({ correct: true });
    expect(step.done).toBe(false);
    expect(step.value).toEqual(PAIR_SYLLABLE_ROUND);
  });

  it('should yield composeSyllable round third with target НА and letters Н,О,А', () => {
    const gen = simpleStrategy();
    gen.next();
    gen.next();
    gen.next({ correct: true });
    gen.next();
    const step = gen.next({ correct: true });
    expect(step.done).toBe(false);
    expect(step.value).toEqual(COMPOSE_SYLLABLE_ROUND);
  });

  it('should repeat from classifyLetter after three rounds', () => {
    const gen = simpleStrategy();
    gen.next();
    gen.next();
    gen.next({ correct: true });
    gen.next();
    gen.next({ correct: true });
    gen.next();
    const step = gen.next({ correct: true });
    expect(step.done).toBe(false);
    expect(step.value).toEqual(CLASSIFY_LETTER_ROUND);
  });
});
