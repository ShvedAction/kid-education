import type { SagaContext } from '../sagaContext';
import type { TaskType } from '@/domain/types';
import { runPickSyllableRound } from '@/tasks/pick-syllable/pickSyllableSaga';
import { runComposeSyllableRound } from '@/tasks/compose-syllable/composeSyllableSaga';
import { runClassifyLetterRound } from '@/tasks/classify-letter/classifyLetterSaga';
import { runPairSyllableRound } from '@/tasks/pair-syllable/pairSyllableSaga';
import { runReadWordPictureRound } from '@/tasks/read-word-picture/readWordPictureSaga';

/**
 * Запустить сагу «один раунд» для данного типа задания.
 * По завершении раунда сага задания диспатчит roundFinished.
 */
export function* runTaskSagaForRound(
  roundType: TaskType,
  context: SagaContext
): Generator<unknown> {
  switch (roundType) {
    case 'pickSyllable':
      yield* runPickSyllableRound(context);
      return;
    case 'composeSyllable':
      yield* runComposeSyllableRound(context);
      return;
    case 'classifyLetter':
      yield* runClassifyLetterRound(context);
      return;
    case 'pairSyllable':
      yield* runPairSyllableRound(context);
      return;
    case 'readWordPicture':
      yield* runReadWordPictureRound(context);
      return;
    default:
      throw new Error(`runTaskSagaForRound: unsupported round type ${roundType}`);
  }
}
