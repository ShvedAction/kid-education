import { call, put, select, take } from 'redux-saga/effects';
import { isVowel } from '@/domain/letters';
import { SYLLABLE_RATE } from '@/domain/tts';
import type { SagaContext } from '@/store/sagaContext';
import type { RootState } from '@/store/store';
import { sessionSlice } from '@/store/sessionSlice';
import { pairSyllableSlice } from './pairSyllableSlice';

const INSTRUCTION = 'Сложи гласную и согласную в слог.';
const FIND_PHRASE = 'Найди слог';

function* playInstruction(context: SagaContext) {
  const { tts } = context;
  try {
    yield call([tts, tts.speak], INSTRUCTION);
  } catch {
    // ignore
  }
  yield put(pairSyllableSlice.actions.instructionDone());
}

/**
 * Сага «один раунд» задания «Сложи слог».
 * Раунд заканчивается на chooseCorrect (фаза «найди слог»).
 */
export function* runPairSyllableRound(context: SagaContext) {
  yield take(pairSyllableSlice.actions.startRound.type);
  yield* playInstruction(context);

  while (true) {
    const action: { type: string; payload?: unknown } = yield take([
      pairSyllableSlice.actions.placeLetter.type,
      pairSyllableSlice.actions.pairFormed.type,
      pairSyllableSlice.actions.pairRejected.type,
      pairSyllableSlice.actions.chooseCorrect.type,
      pairSyllableSlice.actions.chooseWrong.type,
    ]);

    if (action.type === pairSyllableSlice.actions.chooseCorrect.type) {
      try {
        yield call([context.tts, context.tts.speak], 'Правильно');
      } catch {
        // ignore
      }
      yield put(sessionSlice.actions.roundFinished({ correct: true }));
      return;
    }

    if (action.type === pairSyllableSlice.actions.chooseWrong.type) {
      const state: RootState = yield select();
      const wrongId = state.pairSyllable.wrongSyllableId;
      const formed = state.pairSyllable.formedSyllables;
      const chosen = wrongId ? formed.find((s) => s.id === wrongId) : null;
      try {
        yield call([context.tts, context.tts.speak], 'Это слог ');
        if (chosen) {
          yield call([context.tts, context.tts.speak], chosen.syllable.toLowerCase(), {
            rate: SYLLABLE_RATE,
          });
        }
      } catch {
        // ignore
      }
      yield put(pairSyllableSlice.actions.wrongDone());
      continue;
    }

    if (action.type === pairSyllableSlice.actions.placeLetter.type) {
      const { payload } = action as ReturnType<typeof pairSyllableSlice.actions.placeLetter>;
      const { draggedId, dropX, dropY, width_percent, height_percent } = payload;
      const nearestEntry = (yield select((state: RootState) => {
        return state.pairSyllable.letters
          .filter((l) => l.id !== draggedId)
          .map((el) =>
            [
              Math.hypot(el.position.x - dropX, el.position.y - dropY),
              el.id,
            ] as [number, string]
          )
          .sort((a, b) => a[0] - b[0])[0];
      })) as [number, string] | undefined;
      if (!nearestEntry) continue;
      const [nearestdistance, nearestId] = nearestEntry;
      if (nearestdistance > Math.hypot(width_percent, height_percent)) continue;

      const state: RootState = yield select();
      const { letters } = state.pairSyllable;
      const round = state.session.currentRound;
      if (round?.type !== 'pairSyllable') continue;

      const dragged = letters.find((l) => l.id === draggedId);
      const target = letters.find((l) => l.id === nearestId);
      if (!dragged || !target) continue;

      const right = dropX > target.position.x;
      yield put(
        pairSyllableSlice.actions.placeSticked({
          draggedId,
          dropX: right
            ? target.position.x + width_percent
            : target.position.x - width_percent,
          dropY: target.position.y,
        })
      );

      const targetX = target.position.x;
      const leftLetter = targetX < dropX ? target : dragged;
      const rightLetter = targetX < dropX ? dragged : target;

      const consonantLeft = !isVowel(leftLetter.letter);
      const vowelRight = isVowel(rightLetter.letter);
      const syllable = leftLetter.letter + rightLetter.letter;

      if (!consonantLeft || !vowelRight) {
        const msg =
          'В слоге сначала согласная, потом гласная. Гласная должна быть справа.';
        try {
          yield call([context.tts, context.tts.speak], msg);
        } catch {
          // ignore
        }
        yield put(
          pairSyllableSlice.actions.pairRejected({ reason: 'wrongOrder' })
        );
        continue;
      }
      try {
        yield call([context.tts, context.tts.speak], syllable.toLowerCase(), {
          rate: SYLLABLE_RATE,
        });
      } catch {
        // ignore
      }
      yield put(
        pairSyllableSlice.actions.pairFormed({
          syllable,
          letterIds: [leftLetter.id, rightLetter.id],
        })
      );
      const stateAfterForm: RootState = yield select();
      if (stateAfterForm.pairSyllable.letters.length === 0) {
        const formed = stateAfterForm.pairSyllable.formedSyllables;
        if (formed.length > 0) {
          const targetSyllable =
            formed[Math.floor(Math.random() * formed.length)]!.syllable;
          yield put(pairSyllableSlice.actions.setTargetFind(targetSyllable));
        }
        yield put(pairSyllableSlice.actions.setPhaseFinding());
        const stateFind: RootState = yield select();
        const targetFind = stateFind.pairSyllable.targetFind;
        if (targetFind) {
          try {
            yield call([context.tts, context.tts.speak], FIND_PHRASE);
            yield call([context.tts, context.tts.speak], targetFind.toLowerCase(), {
              rate: SYLLABLE_RATE,
            });
          } catch {
            // ignore
          }
        }
      }
      continue;
    }

    if (action.type === pairSyllableSlice.actions.pairFormed.type) {
      continue;
    }

    if (action.type === pairSyllableSlice.actions.pairRejected.type) {
      const reason = (action as ReturnType<typeof pairSyllableSlice.actions.pairRejected>).payload.reason;
      const msg =
        reason === 'wrongOrder'
          ? 'В слоге сначала согласная, потом гласная. Гласная должна быть справа.'
          : 'Такой слог не подходит.';
      try {
        yield call([context.tts, context.tts.speak], msg);
      } catch {
        // ignore
      }
    }
  }
}
