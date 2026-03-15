import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type {
  Round,
  TaskType,
  DifficultyLevel,
  RoundResult,
} from '@/domain/types';

export interface SessionState {
  taskType: TaskType;
  difficulty: DifficultyLevel;
  currentRound: Round | null;
  roundKey: number;
}

const initialState: SessionState = {
  taskType: 'pickSyllable',
  difficulty: 4,
  currentRound: null,
  roundKey: 0,
};

export const sessionSlice = createSlice({
  name: 'session',
  initialState,
  reducers: {
    setTaskType(state, action: PayloadAction<TaskType>) {
      state.taskType = action.payload;
    },
    setDifficulty(state, action: PayloadAction<DifficultyLevel>) {
      state.difficulty = action.payload;
    },
    setRound(state, action: PayloadAction<Round | null>) {
      state.currentRound = action.payload;
      state.roundKey += 1;
    },
    /** Диспатчат саги заданий по завершении раунда. Обрабатывает strategy/story runner. */
    roundFinished(_state, _action: PayloadAction<RoundResult>) {
      // no state change; runner listens and sets next round
    },
  },
});

export const { setTaskType, setDifficulty, setRound, roundFinished } =
  sessionSlice.actions;
