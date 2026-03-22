import { call, put, select, take } from 'redux-saga/effects';
import { SYLLABLE_RATE } from '@/domain/tts';
import type { SagaContext } from '@/store/sagaContext';
import { sessionSlice } from '@/store/sessionSlice';
import { composeSyllableSlice } from './composeSyllableSlice';

const PHRASE = 'Собери слог';

function* playInstruction(context: SagaContext) {
  const { tts } = context;
  const state: {
    session: { currentRound: { type: string; target: string } | null };
  } = yield select();
  const round = state.session.currentRound;
  if (round?.type !== 'composeSyllable') return;
  const syllable = round.target.toLowerCase();
  try {
    yield call([tts, tts.speak], PHRASE);
    yield call([tts, tts.speak], syllable, { rate: SYLLABLE_RATE });
    yield put(composeSyllableSlice.actions.instructionDone());
  } catch {
    yield put(composeSyllableSlice.actions.instructionDone());
  }
}

function* playWrongFeedback(
  composed: string,
  context: SagaContext
) {
  const state: {
    session: {
      currentRound: { type: string; target: string; letters: string[] } | null;
    };
  } = yield select();
  const target = state.session.currentRound?.target.toLowerCase() || '';
  const { tts } = context;
  try {
    yield call([tts, tts.speak], 'Это слог');
    yield call([tts, tts.speak], composed.toLowerCase(), { rate: SYLLABLE_RATE });
    yield call([tts, tts.speak], 'Составь слог:');
    yield call([tts, tts.speak], target.toLowerCase(), { rate: SYLLABLE_RATE });
  } catch {
    // ignore
  }
  const round = state.session.currentRound;
  if (round?.type === 'composeSyllable') {
    yield put(
      composeSyllableSlice.actions.wrongDone({
        targetLength: round.target.length,
        letters: round.letters,
      })
    );
  }
}

/**
 * Сага «один раунд» задания «Собери слог».
 */
export function* runComposeSyllableRound(context: SagaContext) {
  if (!context.autostart) {
    yield take(composeSyllableSlice.actions.startRound.type);
  }else{
    yield put(composeSyllableSlice.actions.startRound());
  }
  yield* playInstruction(context);

  while (true) {
    const action: { type: string; payload?: string } = yield take([
      composeSyllableSlice.actions.chooseCorrect.type,
      composeSyllableSlice.actions.chooseWrong.type,
    ]);
    if (action.type === composeSyllableSlice.actions.chooseCorrect.type) {
      try {
        yield call([context.tts, context.tts.speak], 'Правильно! Молодец!');
      } catch {
        // ignore
      }
      yield put(sessionSlice.actions.roundFinished({ correct: true }));
      return;
    }
    yield* playWrongFeedback(action.payload!, context);
  }
}
