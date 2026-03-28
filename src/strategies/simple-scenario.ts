import type { Round, RoundResult } from '@/domain/types';
import { randomReadWordPictureRound } from '@/tasks/read-word-picture/word-db';


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
      letters: ['А', 'Н'],
    };

    yield; // receive result
    yield {
      type: 'pairSyllable',
      source_syllables: ['НА', 'ТО'],
    };
    yield; // receive result

    yield {
      type: 'composeSyllable',
      target: 'НА',
      letters: ['Н', 'О', 'А'],
    };
    yield; // receive result
    


    yield {
      type: 'classifyLetter',
      letters: ['А', 'О',  'С', 'Т'],
    };

    yield; // receive result
    yield {
      type: 'pairSyllable',
      source_syllables: ['НА', 'НО', 'ТО'],
    };
    yield; // receive result
    yield {
      type: 'composeSyllable',
      target: 'НО',
      letters: ['Н', 'О', 'А', 'Т'],
    };
    yield; // receive result


    yield {
      type: 'classifyLetter',
      letters: ['А', 'О', 'У', 'И', 'К',  'П', 'С', 'Т'],
    };

    yield; // receive result
    yield {
      type: 'pairSyllable',
      source_syllables: ['НА', 'НО', 'ПА', 'ПО', 'ТА', 'ТО'],
    };
    yield; // receive result
    yield {
      type: 'composeSyllable',
      target: 'СО',
      letters: ['С', 'О', 'А', 'Н'],
    };
    yield; // receive result


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

export function* simpleStrategyReadWordPicture(): Generator<
  Round | undefined,
  void,
  RoundResult | undefined
> {
  while (true) {
    yield randomReadWordPictureRound();
  }
}
