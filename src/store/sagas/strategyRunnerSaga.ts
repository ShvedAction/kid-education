import { fork, put, take } from 'redux-saga/effects';
import type { Round, RoundResult } from '@/domain/types';
import { sessionSlice } from '../sessionSlice';
import { pickSyllableSlice } from '@/tasks/pick-syllable/pickSyllableSlice';
import { composeSyllableSlice } from '@/tasks/compose-syllable/composeSyllableSlice';
import { classifyLetterSlice } from '@/tasks/classify-letter/classifyLetterSlice';
import { pairSyllableSlice } from '@/tasks/pair-syllable';
import { readWordPictureSlice } from '@/tasks/read-word-picture';
import { runTaskSagaForRound } from './runTaskSaga';
import type { SagaContext } from '../sagaContext';

export interface StrategyRunnerContext extends SagaContext {
  strategy: Generator<Round | undefined, void, RoundResult | undefined>;
}

function* dispatchRoundAndReset(round: Round) {
  yield put(sessionSlice.actions.setRound(round));
  if (round.type === 'pickSyllable') {
    yield put(pickSyllableSlice.actions.reset(round));
  } else if (round.type === 'classifyLetter') {
    yield put(classifyLetterSlice.actions.reset(round));
  } else if (round.type === 'pairSyllable') {
    yield put(pairSyllableSlice.actions.reset(round));
  } else if (round.type === 'readWordPicture') {
    yield put(readWordPictureSlice.actions.reset(round));
  } else {
    yield put(composeSyllableSlice.actions.reset(round));
  }
}

/**
 * Сага-раннер стратегии: в цикле получает раунд от стратегии (в обход createRound),
 * диспатчит setRound + reset, форкает сагу задания, ждёт roundFinished, передаёт результат в стратегию.
 */
export function* strategyRunnerSaga(context: StrategyRunnerContext) {
  const { strategy } = context;

  let step = strategy.next();
  if (step.done || step.value === undefined) return;

  let round = step.value;
  while (round !== undefined) {
    yield* dispatchRoundAndReset(round);
    yield fork(runTaskSagaForRound, round.type, context);
    context.autostart = true;
    const action: { payload: RoundResult } = yield take(sessionSlice.actions.roundFinished.type);
    const result = action.payload;

    strategy.next();
    const nextStep = strategy.next(result);
    if (nextStep.done || nextStep.value === undefined) break;
    round = nextStep.value;
  }
}
