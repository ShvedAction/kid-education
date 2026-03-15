import type { Round, RoundResult } from '@/domain/types';


/**
 * Простая стратегия: фиксированная последовательность раундов в обход createRound.
 * Порядок: classifyLetter (буквы) → pairSyllable (слоги) → composeSyllable (собери НА) → повтор.
 */
export function* simpleStrategy(): Generator<
  Round | undefined,
  void,
  RoundResult | undefined
> {
  while (true) {

    yield {
      type: 'classifyLetter',
      letters: ['А', 'О', 'У', 'Н', 'К', 'М', 'П', 'С', 'Т'],
    };

    yield; // receive result
    yield {
      type: 'pairSyllable',
      source_syllables: ['НА', 'НО', 'ПА', 'ПО', 'СА', 'СО', 'ТА', 'ТО'],
    };
    yield; // receive result
    yield {
      type: 'composeSyllable',
      target: 'НА',
      letters: ['Н', 'О', 'А'],
    };
    yield; // receive result
  }
}
