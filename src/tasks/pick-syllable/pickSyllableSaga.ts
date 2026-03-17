import { call, put, select, take } from 'redux-saga/effects';
import { SYLLABLE_RATE } from '@/domain/tts';
import type { SagaContext } from '@/store/sagaContext';
import { sessionSlice } from '@/store/sessionSlice';
import { pickSyllableSlice } from './pickSyllableSlice';

const PHRASE = 'Выбери слог';

function* playInstruction(context: SagaContext) {
  const { tts } = context;
  const state: {
    session: { currentRound: { type: string; target: string } | null };
  } = yield select();
  const round = state.session.currentRound;
  if (round?.type !== 'pickSyllable') return;
  const syllable = round.target.toLowerCase();
  try {
    yield call([tts, tts.speak], PHRASE);
    yield call([tts, tts.speak], syllable, { rate: SYLLABLE_RATE });
    yield put(pickSyllableSlice.actions.instructionDone());
  } catch {
    yield put(pickSyllableSlice.actions.instructionDone());
  }
}

function* playWrongFeedback(
  chosen: string,
  context: SagaContext
) {
  const { tts } = context;
  const hint =
    chosen.length >= 2
      ? ` ${chosen.toLowerCase()} — это ${chosen[0]!.toLowerCase()} и ${chosen[1]!.toLowerCase()}.`
      : '';
  const syllable = chosen.toLowerCase();
  try {
    yield call([tts, tts.speak], 'Это слог ');
    yield call([tts, tts.speak], syllable, { rate: SYLLABLE_RATE });
    if (hint) yield call([tts, tts.speak], hint.trim());
    yield put(pickSyllableSlice.actions.wrongDone());
  } catch {
    yield put(pickSyllableSlice.actions.wrongDone());
  }
}

/**
 * Сага «один раунд» задания «Выбери слог».
 * Ждёт startRound, озвучивает инструкцию, затем в цикле обрабатывает chooseWrong/chooseCorrect.
 * По chooseCorrect озвучивает «Правильно» и диспатчит roundFinished({ correct: true }).
 */
export function* runPickSyllableRound(context: SagaContext) {
  if (!context.autostart) {
    yield take(pickSyllableSlice.actions.startRound.type);
  }else{
    yield put(pickSyllableSlice.actions.startRound());
  }
  yield* playInstruction(context);

  while (true) {
    const action: { type: string; payload?: string } = yield take([
      pickSyllableSlice.actions.chooseCorrect.type,
      pickSyllableSlice.actions.chooseWrong.type,
    ]);
    if (action.type === pickSyllableSlice.actions.chooseCorrect.type) {
      try {
        yield call([context.tts, context.tts.speak], 'Правильно');
      } catch {
        // ignore
      }
      yield put(sessionSlice.actions.roundFinished({ correct: true }));
      return;
    }
    // chooseWrong
    yield* playWrongFeedback(action.payload!, context);
  }
}
