import { fork, takeEvery } from 'redux-saga/effects';
import type { TaskType } from '@/domain/types';
import type { SagaContext } from '../sagaContext';
import { sessionSlice } from '../sessionSlice';
import { runTaskSagaForRound } from './runTaskSaga';

/**
 * Сага для Storybook и тестов: по setRound форкает сагу «один раунд» для pickSyllable,
 * по roundFinished вызывает nextRound() (обратная совместимость с текущими тестами).
 */
export function* storyRoundRunnerSaga(context: SagaContext) {
  yield takeEvery(
    sessionSlice.actions.setRound.type,
    function* (action: { type: string; payload: { type: string } | null }) {
      const round = action.payload;
      if (!round) return;
      yield fork(function* () {
        yield* runTaskSagaForRound(round.type as TaskType, context);
      });
    }
  );
  yield takeEvery(sessionSlice.actions.roundFinished.type, function* () {
    if (context.dispatchNextRound) {
      context.dispatchNextRound();
    }
  });
}
