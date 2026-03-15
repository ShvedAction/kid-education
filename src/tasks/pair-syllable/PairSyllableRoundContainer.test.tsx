/**
 * Интеграционные сценарии контейнера: действия в beforeEach, проверки в it.
 * DnD симулируем через dispatch placeLetter; targetFind выбирается сагой при переходе в finding.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  render,
  screen,
  waitFor,
  fireEvent,
  act,
} from '@testing-library/react';
import { Provider } from 'react-redux';
import { PairSyllableRoundContainer } from './PairSyllableRoundContainer';
import {
  createStoreForStory,
  sessionSlice,
} from '@/store';
import { pairSyllableSlice } from './pairSyllableSlice';
import type { TTSProvider } from '@/domain/tts';
import type { PairSyllableRound } from './types';

const defaultRound: PairSyllableRound = {
  type: 'pairSyllable',
  source_syllables: ['МА', 'НО'],
};

function makeStoreWithRound(round: PairSyllableRound, tts: TTSProvider) {
  const storyStore = createStoreForStory(tts);
  storyStore.dispatch(sessionSlice.actions.setTaskType('pairSyllable'));
  storyStore.dispatch(sessionSlice.actions.setRound(round));
  storyStore.dispatch(pairSyllableSlice.actions.reset(round));
  return storyStore;
}

describe('PairSyllable task', () => {
  let mockTTS: TTSProvider;
  let store: ReturnType<typeof createStoreForStory>;

  beforeEach(() => {
    mockTTS = {
      speak: vi.fn().mockResolvedValue(undefined),
      cancel: vi.fn(),
    };
    store = makeStoreWithRound(defaultRound, mockTTS);
    render(
      <Provider store={store}>
        <PairSyllableRoundContainer />
      </Provider>
    );
  });

  describe('success render', () => {
    it('should render start button', () => {
      expect(screen.getByTestId('pair-syllable-start')).toBeVisible();
    });
  });

  describe('click start button', () => {
    beforeEach(async () => {
      fireEvent.click(screen.getByTestId('pair-syllable-start'));
      await act(async () => {
        await screen.findByTestId('pair-syllable-letters');
      });
    });

    it('should render letters area', () => {
      expect(screen.getByTestId('pair-syllable-letters')).toBeInTheDocument();
    });

    it('should speak instruction', () => {
      expect(mockTTS.speak).toHaveBeenCalledWith(
        'Сложи гласную и согласную в слог.'
      );
    });

    describe('place letter on letter (valid order)', () => {
      beforeEach(async () => {
        const state = store.getState();
        const letters = state.pairSyllable.letters;
        const letterM = letters.find((l) => l.letter === 'М')!;
        const letterA = letters.find((l) => l.letter === 'А')!;
        act(() => {
          store.dispatch(
            pairSyllableSlice.actions.placeLetter({
              draggedId: letterA.id,
              dropX: letterM.position.x + 2,
              dropY: letterM.position.y,
              width_percent: 10,
              height_percent: 10,
            })
          );
        });
        await act(async () => {
          await waitFor(() => {
            expect(store.getState().pairSyllable.letters.length).toBe(2);
          });
        });
        await act(async () => {
          await waitFor(() => {
            expect(mockTTS.speak).toHaveBeenCalledWith('ма', expect.any(Object));
          });
        });
      });

      it('should form one pair and speak syllable', () => {
        expect(mockTTS.speak).toHaveBeenCalledWith('ма', expect.any(Object));
      });

      it('should have one formed syllable MA', () => {
        const formed = store.getState().pairSyllable.formedSyllables;
        expect(formed).toHaveLength(1);
        expect(formed[0]!.syllable).toBe('МА');
      });
    });

    describe('drop in empty place', () => {
      let letterId: string;
      beforeEach(() => {
        const state = store.getState();
        const letter = state.pairSyllable.letters[0]!;
        letterId = letter.id;
        act(() => {
          store.dispatch(
            pairSyllableSlice.actions.placeLetter({
              draggedId: letter.id,
              dropX: 95,
              dropY: 95,
              width_percent: 10,
              height_percent: 10,
            })
          );
        });
      });

      it('should update letter position', () => {
        const updated = store.getState().pairSyllable.letters.find(
          (l) => l.id === letterId
        );
        expect(updated?.position).toEqual({ x: 95, y: 95 });
      });
    });

    describe('form all pairs', () => {
      beforeEach(async () => {
        let state = store.getState();
        let letters = state.pairSyllable.letters;
        const letterM = letters.find((l) => l.letter === 'М')!;
        const letterA = letters.find((l) => l.letter === 'А')!;
        act(() => {
          store.dispatch(
            pairSyllableSlice.actions.placeLetter({
              draggedId: letterA.id,
              dropX: letterM.position.x + 2,
              dropY: letterM.position.y,
              width_percent: 10,
              height_percent: 10,
            })
          );
        });
        await act(async () => {
          await waitFor(() => {
            expect(store.getState().pairSyllable.letters.length).toBe(2);
          });
        });
        state = store.getState();
        letters = state.pairSyllable.letters;
        const letterN2 = letters.find((l) => l.letter === 'Н')!;
        const letterO2 = letters.find((l) => l.letter === 'О')!;
        act(() => {
          store.dispatch(
            pairSyllableSlice.actions.placeLetter({
              draggedId: letterO2.id,
              dropX: letterN2.position.x + 2,
              dropY: letterN2.position.y,
              width_percent: 10,
              height_percent: 10,
            })
          );
        });
        await act(async () => {
          await waitFor(() => {
            expect(store.getState().pairSyllable.phase).toBe('finding');
          });
        });
        await act(async () => {
          await waitFor(() => {
            expect(mockTTS.speak).toHaveBeenCalledWith('Найди слог');
          });
        });
        await act(async () => {
          await waitFor(() => {
            expect(store.getState().pairSyllable.targetFind).toBeTruthy();
          });
        });
      });

      it('should switch to finding phase', () => {
        expect(store.getState().pairSyllable.phase).toBe('finding');
      });

      it('should have targetFind set from formed syllables', () => {
        const { targetFind, formedSyllables } =
          store.getState().pairSyllable;
        expect(targetFind).toBeTruthy();
        const formedSyllableStrings = formedSyllables.map((s) => s.syllable);
        expect(formedSyllableStrings).toContain(targetFind);
      });

      it('should speak Найди слог and target syllable', () => {
        expect(mockTTS.speak).toHaveBeenCalledWith('Найди слог');
        const targetFind = store.getState().pairSyllable.targetFind;
        expect(mockTTS.speak).toHaveBeenCalledWith(
          targetFind!.toLowerCase(),
          expect.any(Object)
        );
      });

      it('should have two formed syllables', () => {
        expect(store.getState().pairSyllable.formedSyllables).toHaveLength(2);
      });

      describe('click correct syllable', () => {
        beforeEach(async () => {
          const targetFind = store.getState().pairSyllable.targetFind;
          const targetSyllableId = store
            .getState()
            .pairSyllable.formedSyllables.find(
              (s) => s.syllable === targetFind
            )?.id;
          act(() => {
            fireEvent.click(
              screen.getByTestId(`pair-syllable-choose-${targetSyllableId}`)
            );
          });
          await act(async () => {
            await waitFor(() => {
              expect(mockTTS.speak).toHaveBeenCalledWith('Правильно');
            });
          });
        });

        it('should speak Правильно', () => {
          expect(mockTTS.speak).toHaveBeenCalledWith('Правильно');
        });

        it('should show start button for next round', () => {
          expect(screen.getByTestId('pair-syllable-start')).toBeVisible();
        });
      });
    });

    describe('place letter wrong order (consonant on vowel)', () => {
      beforeEach(async () => {
        const state = store.getState();
        const letters = state.pairSyllable.letters;
        const letterM = letters.find((l) => l.letter === 'М')!;
        const letterA = letters.find((l) => l.letter === 'А')!;
        act(() => {
          store.dispatch(
            pairSyllableSlice.actions.placeLetter({
              draggedId: letterM.id,
              dropX: letterA.position.x + 2,
              dropY: letterA.position.y,
              width_percent: 10,
              height_percent: 10,
            })
          );
        });
        await act(async () => {
          await waitFor(() => {
            expect(mockTTS.speak).toHaveBeenCalledWith(
              'В слоге сначала согласная, потом гласная. Гласная должна быть справа.'
            );
          });
        });
      });

      it('should speak wrongOrder feedback', () => {
        expect(mockTTS.speak).toHaveBeenCalledWith(
          'В слоге сначала согласная, потом гласная. Гласная должна быть справа.'
        );
      });

      it('should not change letters count', () => {
        expect(store.getState().pairSyllable.letters.length).toBe(4);
      });
    });
  });
});
