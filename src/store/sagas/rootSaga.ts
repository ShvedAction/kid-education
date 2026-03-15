import { fork } from 'redux-saga/effects';
import type { SagaContext } from '../sagaContext';
import { storyRoundRunnerSaga } from './storyRoundRunnerSaga';
import { strategyRunnerSaga, type StrategyRunnerContext } from './strategyRunnerSaga';

export type { SagaContext } from '../sagaContext';

/** В story mode — story runner; иначе — strategy runner с переданной стратегией. */
export function* rootSaga(
  context: SagaContext & { mode?: 'story'; strategy?: Generator }
) {
  if (context.mode === 'story') {
    yield fork(storyRoundRunnerSaga, context);
  } else if (context.strategy) {
    yield fork(strategyRunnerSaga, context as StrategyRunnerContext);
  }
}
