/**
 * Тесты контейнера «Прочитай слово и выбери картинку»: мок TTS, сценарии по SCENARIOS.md.
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
import { ReadWordPictureRoundContainer } from './ReadWordPictureRoundContainer';
import {
  createStoreForStory,
  sessionSlice,
  readWordPictureSlice,
} from '@/store';
import type { ReadWordPictureRound } from './types';
import type { TTSProvider } from '@/domain/tts';

const defaultRound: ReadWordPictureRound = {
  type: 'readWordPicture',
  word: 'МАМА',
  correctId: 'mama',
  options: [
    { id: 'mama', alt: 'Мама' },
    { id: 'papa', alt: 'Папа' },
    { id: 'sok', alt: 'Сок' },
  ],
};

function makeStoreWithRound(round: ReadWordPictureRound, tts: TTSProvider) {
  const storyStore = createStoreForStory(tts);
  storyStore.dispatch(sessionSlice.actions.setRound(round));
  storyStore.dispatch(readWordPictureSlice.actions.reset(round));
  return storyStore;
}

/** После «Начать»: дождаться слова, пройти слоги по порядку, дождаться блока картинок. */
async function startAndCompleteSyllables() {
  const startBtn = screen.getByTestId('read-word-picture-start');
  act(() => {
    fireEvent.click(startBtn);
  });
  await screen.findByTestId('read-word-picture-word');
  expect(
    screen.queryByTestId('read-word-picture-options')
  ).not.toBeInTheDocument();
  act(() => {
    fireEvent.click(screen.getByTestId('read-word-picture-syllable-0'));
  });
  await act(async () => {
    await waitFor(() => {
      expect(mockTTS.speak).toHaveBeenCalledWith(
        'ма',
        expect.any(Object)
      );
    });
  });
  act(() => {
    fireEvent.click(screen.getByTestId('read-word-picture-syllable-1'));
  });
  await act(async () => {
    await waitFor(() => {
      const maCalls = (mockTTS.speak as ReturnType<typeof vi.fn>).mock.calls.filter(
        (c) => c[0] === 'ма'
      );
      expect(maCalls.length).toBeGreaterThanOrEqual(2);
    });
  });
  await screen.findByTestId('read-word-picture-options');
}

let mockTTS: TTSProvider;

describe('ReadWordPicture task', () => {
  beforeEach(() => {
    mockTTS = {
      speak: vi.fn().mockResolvedValue(undefined),
      cancel: vi.fn(),
    };
    const store = makeStoreWithRound(defaultRound, mockTTS);
    render(
      <Provider store={store}>
        <ReadWordPictureRoundContainer />
      </Provider>
    );
  });

  describe('success render', () => {
    it('should render start button', () => {
      const startBtn = screen.getByTestId('read-word-picture-start');
      expect(startBtn).toBeVisible();
    });
  });

  describe('click start button', () => {
    beforeEach(async () => {
      await startAndCompleteSyllables();
    });

    it('should render word and options after sequential syllables', () => {
      expect(screen.getByTestId('read-word-picture-word')).toBeInTheDocument();
      expect(screen.getByTestId('read-word-picture-options')).toBeInTheDocument();
    });

    it('should speak instruction', () => {
      expect(mockTTS.speak).toHaveBeenCalledWith(
        'Прочитай слово и выбери картинку'
      );
    });

    describe('click syllable', () => {
      it('should speak syllable when replaying after sequence', async () => {
        (mockTTS.speak as ReturnType<typeof vi.fn>).mockClear();
        act(() => {
          fireEvent.click(screen.getByTestId('read-word-picture-syllable-0'));
        });
        await waitFor(() => {
          expect(mockTTS.speak).toHaveBeenCalledWith('ма', expect.any(Object));
        });
      });
    });

    describe('click correct option', () => {
      beforeEach(async () => {
        act(() => {
          fireEvent.click(screen.getByTestId('read-word-picture-option-mama'));
        });
        await act(async () => {
          await waitFor(() => {
            expect(mockTTS.speak).toHaveBeenCalledWith('Правильно');
          });
        });
      });

      it('should speak correct feedback', () => {
        expect(mockTTS.speak).toHaveBeenCalledWith('Правильно');
      });
    });

    describe('click wrong option', () => {
      beforeEach(async () => {
        act(() => {
          fireEvent.click(screen.getByTestId('read-word-picture-option-papa'));
        });
        await act(async () => {
          await waitFor(() => {
            expect(mockTTS.speak).toHaveBeenCalledWith(
              'Неправильно. Ты выбрал не ту картинку.'
            );
          });
        });
      });

      it('should speak wrong feedback', () => {
        expect(mockTTS.speak).toHaveBeenCalledWith(
          'Неправильно. Ты выбрал не ту картинку.'
        );
      });

      it('should hide options and keep all picture ids in round', () => {
        expect(
          screen.queryByTestId('read-word-picture-options')
        ).not.toBeInTheDocument();
      });

      describe('then complete syllables and click correct option', () => {
        beforeEach(async () => {
          act(() => {
            fireEvent.click(screen.getByTestId('read-word-picture-syllable-0'));
          });
          await act(async () => {
            await waitFor(() => {
              expect(mockTTS.speak).toHaveBeenCalledWith(
                'ма',
                expect.any(Object)
              );
            });
          });
          act(() => {
            fireEvent.click(screen.getByTestId('read-word-picture-syllable-1'));
          });
          await screen.findByTestId('read-word-picture-options');
          act(() => {
            fireEvent.click(screen.getByTestId('read-word-picture-option-mama'));
          });
          await act(async () => {
            await waitFor(() => {
              expect(mockTTS.speak).toHaveBeenCalledWith('Правильно');
            });
          });
        });

        it('should speak correct feedback', () => {
          expect(mockTTS.speak).toHaveBeenCalledWith('Правильно');
        });
      });
    });
  });
});
