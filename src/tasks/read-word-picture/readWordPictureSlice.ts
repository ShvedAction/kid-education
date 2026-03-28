import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { ReadWordPictureRound, TWordPart } from './types';
import type { PictureOption } from './types';
import { splitWordIntoParts } from './wordSyllables';

/**
 * Состояние задания «Прочитай слово и выбери картинку» в store (ключ `readWordPicture`).
 *
 * @remarks
 * - `options` — варианты на экране; при ошибке выбранный вариант убирается.
 * - `status` — idle (ожидание выбора), wrong (озвучивается фидбек), correct (озвучивается «Правильно», затем следующий раунд).
 * - `hasStarted` / `spoken` — раунд начат и инструкция озвучена.
 */
export interface ReadWordPictureState {
  options: PictureOption[];
  status: 'idle' | 'correct' | 'wrong';
  hasStarted: boolean;
  spoken: boolean;
  wordParts: TWordPart[];
  targetWord: string;
}

const initialState: ReadWordPictureState = {
  options: [],
  status: 'idle',
  hasStarted: false,
  spoken: false,
  wordParts: [],
  targetWord: '',
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
        wordParts: splitWordIntoParts(action.payload.word).map((prt, index) => ({
          content: prt,
          readed: false,
          current: index == 0,
        }))
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
    /** Пользователь нажал на слог; сага озвучивает только этот слог. Payload — текст слога (части). */
    readPart(_state, _action: PayloadAction<number>) { },
    markPart(state, {payload: {readed_ind, current_ind}}: PayloadAction<{ readed_ind: number, current_ind?: number }>) {
      state.wordParts = state.wordParts.map((part, ind) => {
        if (ind === readed_ind){
          return {...part, readed: true};
        }
        if (ind === current_ind){
          return {...part, current: true};
        }
        return part;
      });
    },
    /** Выбран неверный вариант. Payload — id варианта; сага озвучивает фидбек и диспатчит wrongDone. */
    chooseWrong(state, action: PayloadAction<string>) {
      state.options = state.options.filter((o) => o.id !== action.payload);
      state.status = 'wrong';
    },
    /** Сага закончила озвучку фидбека при ошибке; снова можно выбирать. */
    wrongDone(state) {
      state.status = 'idle';
    },
    /** Выбран верный вариант; сага озвучивает «Правильно» и вызывает dispatchNextRound(). */
    chooseCorrect(state) {
      state.status = 'correct';
    },
  },
  selectors: {
    isAllPartsReaded: (state) => {
      return state.wordParts.every(part => part.readed);
    }
  }
});

export const {
  reset,
  startRound,
  instructionDone,
  readPart,
  chooseWrong,
  wrongDone,
  chooseCorrect,
} = readWordPictureSlice.actions;
