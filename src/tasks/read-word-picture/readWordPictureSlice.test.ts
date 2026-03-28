import { describe, it, expect, vi, afterEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import { readWordPictureSlice } from './readWordPictureSlice';
import type { ReadWordPictureRound } from './types';

const round: ReadWordPictureRound = {
  type: 'readWordPicture',
  word: 'МАМА',
  correctId: 'mama',
  options: [
    { id: 'mama', alt: 'Мама' },
    { id: 'papa', alt: 'Папа' },
    { id: 'sok', alt: 'Сок' },
  ],
};

describe('readWordPictureSlice', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('reset', () => {
    it('should set options and initial state', () => {
      const store = configureStore({
        reducer: { readWordPicture: readWordPictureSlice.reducer },
      });
      store.dispatch(readWordPictureSlice.actions.reset(round));
      const state = store.getState().readWordPicture;
      expect(state.options).toHaveLength(3);
      expect(state.options.map((o) => o.id)).toEqual(['mama', 'papa', 'sok']);
      expect(state.status).toBe('idle');
      expect(state.hasStarted).toBe(false);
      expect(state.spoken).toBe(false);
      expect(state.showPictures).toBe(false);
      expect(state.targetWord).toBe('МАМА');
      expect(state.wordParts).toHaveLength(2);
      expect(state.wordParts[0]!.current).toBe(true);
      expect(state.wordParts[0]!.readed).toBe(false);
    });
  });

  describe('readPart sequential', () => {
    it('should advance only current syllable and open pictures after last', () => {
      const store = configureStore({
        reducer: { readWordPicture: readWordPictureSlice.reducer },
      });
      store.dispatch(readWordPictureSlice.actions.reset(round));
      store.dispatch(readWordPictureSlice.actions.readPart(1));
      expect(store.getState().readWordPicture.wordParts[1]!.readed).toBe(false);
      store.dispatch(readWordPictureSlice.actions.readPart(0));
      const s1 = store.getState().readWordPicture;
      expect(s1.wordParts[0]!.readed).toBe(true);
      expect(s1.wordParts[1]!.current).toBe(true);
      expect(s1.showPictures).toBe(false);
      store.dispatch(readWordPictureSlice.actions.readPart(1));
      const s2 = store.getState().readWordPicture;
      expect(s2.wordParts[1]!.readed).toBe(true);
      expect(s2.showPictures).toBe(true);
    });
  });

  describe('readPart free phase', () => {
    it('should not change wordParts when showPictures is true', () => {
      const store = configureStore({
        reducer: { readWordPicture: readWordPictureSlice.reducer },
      });
      store.dispatch(readWordPictureSlice.actions.reset(round));
      store.dispatch(readWordPictureSlice.actions.readPart(0));
      store.dispatch(readWordPictureSlice.actions.readPart(1));
      const before = store.getState().readWordPicture.wordParts;
      store.dispatch(readWordPictureSlice.actions.readPart(0));
      expect(store.getState().readWordPicture.wordParts).toEqual(before);
    });
  });

  describe('startRound', () => {
    it('should set hasStarted and clear spoken', () => {
      const store = configureStore({
        reducer: { readWordPicture: readWordPictureSlice.reducer },
      });
      store.dispatch(readWordPictureSlice.actions.reset(round));
      store.dispatch(readWordPictureSlice.actions.startRound());
      const state = store.getState().readWordPicture;
      expect(state.hasStarted).toBe(true);
      expect(state.spoken).toBe(false);
    });
  });

  describe('instructionDone', () => {
    it('should set spoken to true', () => {
      const store = configureStore({
        reducer: { readWordPicture: readWordPictureSlice.reducer },
      });
      store.dispatch(readWordPictureSlice.actions.reset(round));
      store.dispatch(readWordPictureSlice.actions.startRound());
      store.dispatch(readWordPictureSlice.actions.instructionDone());
      expect(store.getState().readWordPicture.spoken).toBe(true);
    });
  });

  describe('chooseWrong', () => {
    it('should set status to wrong without removing options', () => {
      const store = configureStore({
        reducer: { readWordPicture: readWordPictureSlice.reducer },
      });
      store.dispatch(readWordPictureSlice.actions.reset(round));
      store.dispatch(readWordPictureSlice.actions.startRound());
      store.dispatch(readWordPictureSlice.actions.chooseWrong('papa'));
      const state = store.getState().readWordPicture;
      expect(state.options).toHaveLength(3);
      expect(state.status).toBe('wrong');
    });
  });

  describe('retryAfterWrong', () => {
    it('should reset syllables, hide pictures, set idle and shuffle options', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0);
      const store = configureStore({
        reducer: { readWordPicture: readWordPictureSlice.reducer },
      });
      store.dispatch(readWordPictureSlice.actions.reset(round));
      store.dispatch(readWordPictureSlice.actions.readPart(0));
      store.dispatch(readWordPictureSlice.actions.readPart(1));
      expect(store.getState().readWordPicture.showPictures).toBe(true);
      store.dispatch(readWordPictureSlice.actions.chooseWrong('papa'));
      store.dispatch(readWordPictureSlice.actions.retryAfterWrong());
      const state = store.getState().readWordPicture;
      expect(state.status).toBe('idle');
      expect(state.showPictures).toBe(false);
      expect(state.wordParts[0]!.current).toBe(true);
      expect(state.wordParts.every((p) => !p.readed)).toBe(true);
      expect(state.options.map((o) => o.id).sort()).toEqual(
        ['mama', 'papa', 'sok'].sort()
      );
      expect(state.options.map((o) => o.id)).not.toEqual(['mama', 'papa', 'sok']);
    });
  });

  describe('chooseCorrect', () => {
    it('should set status to correct', () => {
      const store = configureStore({
        reducer: { readWordPicture: readWordPictureSlice.reducer },
      });
      store.dispatch(readWordPictureSlice.actions.reset(round));
      store.dispatch(readWordPictureSlice.actions.startRound());
      store.dispatch(readWordPictureSlice.actions.chooseCorrect());
      expect(store.getState().readWordPicture.status).toBe('correct');
    });
  });
});
