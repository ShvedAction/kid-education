import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { ReadWordPictureRound, TWordPart } from './types';
import type { PictureOption } from './types';
import { splitWordIntoParts } from './wordSyllables';

function initialWordParts(word: string): TWordPart[] {
  return splitWordIntoParts(word).map((prt, index) => ({
    content: prt,
    readed: false,
    current: index === 0,
  }));
}

function shuffleOptions(options: PictureOption[]): PictureOption[] {
  const copy = [...options];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = copy[i]!;
    copy[i] = copy[j]!;
    copy[j] = t;
  }
  return copy;
}

/**
 * Состояние задания «Прочитай слово и выбери картинку» в store (ключ `readWordPicture`).
 *
 * @remarks
 * - `options` — варианты на экране; при ошибке порядок перемешивается, набор тот же.
 * - `showPictures` — картинки видны только после прохождения слогов по порядку.
 * - `status` — idle, wrong (озвучивается фидбек), correct (озвучивается «Правильно», затем следующий раунд).
 * - `hasStarted` / `spoken` — раунд начат и инструкция озвучена.
 */
export interface ReadWordPictureState {
  options: PictureOption[];
  status: 'idle' | 'correct' | 'wrong';
  hasStarted: boolean;
  spoken: boolean;
  wordParts: TWordPart[];
  targetWord: string;
  showPictures: boolean;
}

const initialState: ReadWordPictureState = {
  options: [],
  status: 'idle',
  hasStarted: false,
  spoken: false,
  wordParts: [],
  targetWord: '',
  showPictures: false,
};

export const readWordPictureSlice = createSlice({
  name: 'readWordPicture',
  initialState,
  reducers: {
    /** Сброс при новом раунде; вызывается из nextRound thunk. */
    reset(_state, action: PayloadAction<ReadWordPictureRound>) {
      return {
        options: [...action.payload.options],
        status: 'idle',
        hasStarted: false,
        spoken: false,
        targetWord: action.payload.word,
        showPictures: false,
        wordParts: initialWordParts(action.payload.word),
      };
    },
    /** Пользователь нажал «Начать»; сага озвучивает инструкцию, затем instructionDone. */
    startRound(state) {
      state.hasStarted = true;
      state.spoken = false;
    },
    /** Сага закончила озвучку инструкции. */
    instructionDone(state) {
      state.spoken = true;
    },
    /**
     * Клик по слогу (индекс). Пока `showPictures` false — только ожидаемый по порядку слог
     * меняет состояние; после последнего открываются картинки. При `showPictures` true — без изменений в store.
     */
    readPart(state, action: PayloadAction<number>) {
      const index = action.payload;
      if (state.showPictures) {
        return;
      }
      const currentIdx = state.wordParts.findIndex((p) => p.current);
      if (currentIdx === -1 || index !== currentIdx) {
        return;
      }
      const last = index === state.wordParts.length - 1;
      state.wordParts = state.wordParts.map((p, i) => {
        if (i === index) {
          return { ...p, readed: true, current: false };
        }
        if (!last && i === index + 1) {
          return { ...p, current: true };
        }
        return { ...p, current: false };
      });
      if (last) {
        state.showPictures = true;
      }
    },
    /** Выбран неверный вариант. Payload — id варианта (для саги / TTS). */
    chooseWrong(state, _action: PayloadAction<string>) {
      state.status = 'wrong';
    },
    /**
     * После озвучки неверного выбора: перемешать картинки, снова скрыть их и сбросить прохождение слогов.
     */
    retryAfterWrong(state) {
      state.options = shuffleOptions(state.options);
      state.showPictures = false;
      state.status = 'idle';
      state.wordParts = initialWordParts(state.targetWord);
    },
    /** Выбран верный вариант; сага озвучивает «Правильно» и вызывает dispatchNextRound(). */
    chooseCorrect(state) {
      state.status = 'correct';
    },
  },
});

export const {
  reset,
  startRound,
  instructionDone,
  readPart,
  chooseWrong,
  retryAfterWrong,
  chooseCorrect,
} = readWordPictureSlice.actions;
