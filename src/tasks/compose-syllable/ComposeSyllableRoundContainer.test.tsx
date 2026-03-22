/**
 * Сага обновляет store асинхронно. Действия пользователя — в beforeEach,
 * ожидание «успокоения» — через await act(async () => findBy... / waitFor(...)).
 * Заполнение слогов в jsdom симулируем через store (нет DragEvent/dataTransfer).
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
import { ComposeSyllableRoundContainer } from './ComposeSyllableRoundContainer';
import {
  createStoreForStory,
  sessionSlice,
  composeSyllableSlice,
} from '@/store';
import type { TTSProvider } from '@/domain/tts';
import type { ComposeSyllableRound } from '@/domain/types';

const defaultRound: ComposeSyllableRound = {
  type: 'composeSyllable',
  target: 'НО',
  letters: ['Н', 'О'],
};

function makeStoreWithRound(
  round: { type: 'composeSyllable'; target: string; letters: string[] },
  tts: TTSProvider
) {
  const storyStore = createStoreForStory(tts);
  storyStore.dispatch(sessionSlice.actions.setTaskType('composeSyllable'));
  storyStore.dispatch(sessionSlice.actions.setRound(round));
  storyStore.dispatch(composeSyllableSlice.actions.reset(round));
  return storyStore;
}

/** Симуляция результата перетаскивания: заполненные слоты + chooseCorrect/chooseWrong. */
function simulateFilledSlots(
  store: ReturnType<typeof createStoreForStory>,
  slots: string[],
  isCorrect: boolean
) {
  act(() => {
    store.dispatch(composeSyllableSlice.actions.setSlots([...slots]));
    store.dispatch(composeSyllableSlice.actions.setPool([]));
    if (isCorrect) {
      store.dispatch(composeSyllableSlice.actions.chooseCorrect());
    } else {
      store.dispatch(composeSyllableSlice.actions.chooseWrong(slots.join('')));
    }
  });
}

describe('ComposeSyllable task', () => {
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
        <ComposeSyllableRoundContainer />
      </Provider>
    );
  });

  describe('success render', () => {
    it('should render start button', () => {
      const startBtn = screen.getByTestId('compose-syllable-start');
      expect(startBtn).toBeVisible();
    });
  });

  describe('click start button', () => {
    beforeEach(async () => {
      const startBtn = screen.getByTestId('compose-syllable-start');
      expect(startBtn).toBeVisible();
      act(() => {
        fireEvent.click(startBtn);
      });
      await act(async () => {
        await screen.findByTestId('compose-syllable-slots');
      });
    });

    describe('should render slots and pool', () => {
      it('should render slots', () => {
        const slots = screen.getByTestId('compose-syllable-slots');
        expect(slots).toBeInTheDocument();
      });
      it('should render pool', () => {
        const pool = screen.getByTestId('compose-syllable-pool');
        expect(pool).toBeInTheDocument();
      });
      it('should speak instruction', () => {
        expect(mockTTS.speak).toHaveBeenCalledWith('Собери слог');
        expect(mockTTS.speak).toHaveBeenCalledWith(
          'но',
          expect.any(Object)
        );
      });
    });

    describe('fill slots correct order', () => {
      beforeEach(async () => {
        simulateFilledSlots(store, ['Н', 'О'], true);
        await act(async () => {
          await waitFor(() => {
            expect(mockTTS.speak).toHaveBeenCalledWith(
              'Правильно! Молодец!'
            );
          });
        });
      });
      it('should speak correct feedback', () => {
        expect(mockTTS.speak).toHaveBeenCalledWith('Правильно! Молодец!');
      });
      it('should show next round', () => {
        expect(
          screen.getByTestId('compose-syllable-start')
        ).toBeVisible();
      });
    });

    describe('fill slots wrong order', () => {
      beforeEach(async () => {
        simulateFilledSlots(store, ['О', 'Н'], false);
      });
      it('should speak wrong feedback', async () => {
        await waitFor(() => {
          expect(mockTTS.speak).toHaveBeenCalledWith(
            'Это слог'
          );
          expect(mockTTS.speak).toHaveBeenCalledWith(
            'он', expect.any(Object)
          );
          expect(mockTTS.speak).toHaveBeenCalledWith(
            'Составь слог:'
          );
          expect(mockTTS.speak).toHaveBeenCalledWith(
            'но', expect.any(Object)
          );
        });
      });
      it('should reset slots and pool', async () => {
        await waitFor(async () => {
          const state = store.getState();
          expect(state.composeSyllable.slots).toEqual([null, null]);
          expect(state.composeSyllable.pool).toHaveLength(2);
        });
      });
      describe('then fill slots correct order', () => {
        beforeEach(async () => {
          await waitFor(async () => {
            const state = store.getState();
            expect(state.composeSyllable.slots).toEqual([null, null]);
            expect(state.composeSyllable.pool).toHaveLength(2);
          });
          simulateFilledSlots(store, ['Н', 'О'], true);
        });
        it('should speak correct feedback', async () => {
          await waitFor(() => {
            expect(mockTTS.speak).toHaveBeenCalledWith(
              'Правильно! Молодец!'
            );
          });
        });
      });
    });
  });
});
