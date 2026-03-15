import { call, put, select, take } from 'redux-saga/effects';
import { SYLLABLE_RATE } from '@/domain/tts';
import type { SagaContext } from '@/store/sagaContext';
import type { ReadWordPictureRound } from '@/domain/types';
import { sessionSlice } from '@/store/sessionSlice';
import { readWordPictureSlice } from './readWordPictureSlice';

const INSTRUCTION = 'Прочитай слово и выбери картинку';

function* playInstruction(context: SagaContext) {
  const { tts } = context;
  const state: {
    session: { currentRound: ReadWordPictureRound | null };
  } = yield select();
  const round = state.session.currentRound;
  if (round?.type !== 'readWordPicture') return;
  try {
    yield call([tts, tts.speak], INSTRUCTION);
    yield put(readWordPictureSlice.actions.instructionDone());
  } catch {
    yield put(readWordPictureSlice.actions.instructionDone());
  }
}

function* playPart(part: string, context: SagaContext) {
  const { tts } = context;
  try {
    yield call([tts, tts.speak], part.toLowerCase(), { rate: SYLLABLE_RATE });
  } catch {
    // ignore
  }
}

function* playWrongFeedback(chosenId: string, context: SagaContext) {
  const { tts } = context;
  const state: {
    session: { currentRound: ReadWordPictureRound | null };
  } = yield select();
  const round = state.session.currentRound;
  if (round?.type !== 'readWordPicture') return;
  const chosen = round.options.find((o) => o.id === chosenId);
  try {
    yield call([tts, tts.speak], 'Нет. Выбери картинку к слову.');
    if (chosen) {
      yield call([tts, tts.speak], chosen.alt.toLowerCase(), {
        rate: SYLLABLE_RATE,
      });
    }
    yield put(readWordPictureSlice.actions.wrongDone());
  } catch {
    yield put(readWordPictureSlice.actions.wrongDone());
  }
}

/**
 * Сага «один раунд» задания «Прочитай слово и выбери картинку».
 * В цикле обрабатывает readPart (озвучка части), chooseWrong, chooseCorrect.
 */
export function* runReadWordPictureRound(context: SagaContext) {
  yield take(readWordPictureSlice.actions.startRound.type);
  yield* playInstruction(context);

  while (true) {
    const action: { type: string; payload?: string } = yield take([
      readWordPictureSlice.actions.chooseCorrect.type,
      readWordPictureSlice.actions.chooseWrong.type,
      readWordPictureSlice.actions.readPart.type,
    ]);
    if (action.type === readWordPictureSlice.actions.readPart.type) {
      yield* playPart(action.payload!, context);
      continue;
    }
    if (action.type === readWordPictureSlice.actions.chooseCorrect.type) {
      try {
        yield call([context.tts, context.tts.speak], 'Правильно');
      } catch {
        // ignore
      }
      yield put(sessionSlice.actions.roundFinished({ correct: true }));
      return;
    }
    yield* playWrongFeedback(action.payload!, context);
  }
}
