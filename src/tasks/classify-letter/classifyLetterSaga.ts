import { call, delay, put, select, take } from 'redux-saga/effects';
import { isVowel } from '@/domain/letters';
import { SYLLABLE_RATE } from '@/domain/tts';
import type { SagaContext } from '@/store/sagaContext';
import type { RootState } from '@/store/store';
import { sessionSlice } from '@/store/sessionSlice';
import { classifyLetterSlice } from './classifyLetterSlice';

const INSTRUCTION =
  'Разнеси буквы: гласные — в красную область, согласные — в синюю.';
const WRONG_DONE_DELAY_MS = 600;

function* playInstruction(context: SagaContext) {
  const { tts } = context;
  try {
    yield call([tts, tts.speak], INSTRUCTION);
  } catch {
    // ignore
  }
  yield put(classifyLetterSlice.actions.instructionDone());
}

/**
 * Сага «один раунд» задания «Гласная или согласная».
 * Раунд заканчивается, когда все буквы правильно разложены (dropInZone correct + allCorrect).
 */
export function* runClassifyLetterRound(context: SagaContext) {
  yield take(classifyLetterSlice.actions.startRound.type);
  yield* playInstruction(context);

  while (true) {
    const action: {
      type: string;
      payload?: { letterId: string; result: 'correct' | 'wrong' };
    } = yield take([
      classifyLetterSlice.actions.speakLetter.type,
      classifyLetterSlice.actions.dropInZone.type,
    ]);

    if (action.type === classifyLetterSlice.actions.speakLetter.type) {
      const letter = typeof action.payload === 'string' ? action.payload : '';
      try {
        yield call([context.tts, context.tts.speak], letter);
      } catch {
        // ignore
      }
      continue;
    }

    const { letterId, result } = action.payload!;
    if (result === 'correct') {
      const state: RootState = yield select();
      const item = state.classifyLetter.items.find((i) => i.id === letterId);
      if (!item) continue;
      const kind = isVowel(item.letter) ? 'гласная' : 'согласная';
      try {
        yield call([context.tts, context.tts.speak], 'Правильно');
        yield call([context.tts, context.tts.speak], item.letter, {
          rate: SYLLABLE_RATE,
        });
        yield call([context.tts, context.tts.speak], kind);
      } catch {
        // ignore
      }
      const stateAfter: RootState = yield select();
      const allCorrect = stateAfter.classifyLetter.items.every(
        (i) => i.placedZone !== null
      );
      if (allCorrect) {
        try {
          yield call([context.tts, context.tts.speak], 'Молодец!');
        } catch {
          // ignore
        }
        yield put(sessionSlice.actions.roundFinished({ correct: true }));
        return;
      }
    } else {
      try {
        yield call([context.tts, context.tts.speak], 'Неправильно');
      } catch {
        // ignore
      }
      yield delay(WRONG_DONE_DELAY_MS);
      yield put(classifyLetterSlice.actions.wrongDone());
    }
  }
}
