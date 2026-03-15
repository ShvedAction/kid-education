import type { Round, RoundSpec } from '@/domain/types';
import {
  createPickSyllableRound,
  createComposeSyllableRound,
} from '@/domain/rounds';
import { createClassifyLetterRound } from '@/tasks/classify-letter/rounds';
import { createPairSyllableRound } from '@/tasks/pair-syllable/rounds';
import { createReadWordPictureRound } from '@/tasks/read-word-picture/rounds';

const DEFAULT_DIFFICULTY = 4;

/** Создать раунд по спецификации (для стратегий и story nextRound). */
export function createRound(spec: RoundSpec): Round {
  const difficulty = spec.difficulty ?? DEFAULT_DIFFICULTY;
  if (spec.taskType === 'pickSyllable') {
    return createPickSyllableRound(difficulty);
  }
  if (spec.taskType === 'classifyLetter') {
    return createClassifyLetterRound();
  }
  if (spec.taskType === 'pairSyllable') {
    return createPairSyllableRound();
  }
  if (spec.taskType === 'readWordPicture') {
    return createReadWordPictureRound();
  }
  return createComposeSyllableRound();
}
