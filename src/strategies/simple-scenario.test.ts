import { describe, it, expect } from 'vitest';
import { simpleStrategy } from './simple-scenario';

describe('simpleStrategy', () => {
  it('should yield pickSyllable difficulty 4 as first spec', () => {
    const gen = simpleStrategy();
    const step = gen.next();
    expect(step.done).toBe(false);
    expect(step.value).toEqual({ taskType: 'pickSyllable', difficulty: 4 });
  });

  it('should yield composeSyllable after correct result', () => {
    const gen = simpleStrategy();
    gen.next();
    gen.next();
    const step = gen.next({ correct: true });
    expect(step.done).toBe(false);
    expect(step.value).toEqual({ taskType: 'composeSyllable' });
  });

  it('should yield pickSyllable difficulty 3 after wrong result', () => {
    const gen = simpleStrategy();
    gen.next();
    gen.next();
    const step = gen.next({ correct: false });
    expect(step.done).toBe(false);
    expect(step.value).toEqual({ taskType: 'pickSyllable', difficulty: 3 });
  });

  it('should alternate by result in a loop', () => {
    const gen = simpleStrategy();
    gen.next();
    gen.next();
    const afterCorrect = gen.next({ correct: true });
    expect(afterCorrect.value).toEqual({ taskType: 'composeSyllable' });
    gen.next();
    const afterWrong = gen.next({ correct: false });
    expect(afterWrong.value).toEqual({ taskType: 'pickSyllable', difficulty: 3 });
  });
});
