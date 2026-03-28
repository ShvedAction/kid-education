import { call, put, select, take } from 'redux-saga/effects';
import { SYLLABLE_RATE } from '@/domain/tts';
import type { SagaContext } from '@/store/sagaContext';
import type { ReadWordPictureRound } from '@/domain/types';
import { sessionSlice } from '@/store/sessionSlice';
import type { RootState } from '@/store/store';
import {
  readWordPictureSlice,
  type ReadWordPictureState,
} from './readWordPictureSlice';

const INSTRUCTION = 'Прочитай слово и выбери картинку';

function selectReadWordPicture(state: {
  readWordPicture: ReadWordPictureState;
}): ReadWordPictureState {
  return state.readWordPicture;
}

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
    yield call([tts, tts.speak], 'Неправильно. Ты выбрал не ту картинку.');
    if (chosen) {
      yield call([tts, tts.speak], chosen.alt.toLowerCase(), {
        rate: SYLLABLE_RATE,
      });
    }
  } catch {
    // ignore
  }
}

/**
 * Сага «один раунд» задания «Прочитай слово и выбери картинку».
 * Сначала слоги строго по порядку, затем картинки и повторное прослушивание слогов;
 * при ошибке — фидбек, сброс слогов и перемешивание картинок.
 */
export function* runReadWordPictureRound(context: SagaContext) {
  if (!context.autostart) {
    yield take(readWordPictureSlice.actions.startRound.type);
  } else {
    yield put(readWordPictureSlice.actions.startRound());
  }
  yield* playInstruction(context);

  while (true) {
    while (true) {
      const showPictures = (yield select(
        (s: RootState) => selectReadWordPicture(s).showPictures
      )) as boolean;
      if (showPictures) {
        break;
      }
      const action: { type: string; payload?: number } = yield take(
        readWordPictureSlice.actions.readPart.type
      );
      const index = action.payload as number;
      const rwp: ReadWordPictureState = yield select(selectReadWordPicture);
      const part = rwp.wordParts[index];
      if (!part || (!rwp.showPictures && !part.readed)) {
        continue;
      }
      yield* playPart(part.content, context);
    }

    while (true) {
      const action: { type: string; payload?: string | number } = yield take([
        readWordPictureSlice.actions.chooseCorrect.type,
        readWordPictureSlice.actions.chooseWrong.type,
        readWordPictureSlice.actions.readPart.type,
      ]);
      if (action.type === readWordPictureSlice.actions.readPart.type) {
        const idx = action.payload as number;
        const rwp: ReadWordPictureState = yield select(selectReadWordPicture);
        const p = rwp.wordParts[idx];
        if (p) {
          yield* playPart(p.content, context);
        }
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
      yield* playWrongFeedback(action.payload as string, context);
      yield put(readWordPictureSlice.actions.retryAfterWrong());
      break;
    }
  }
}
