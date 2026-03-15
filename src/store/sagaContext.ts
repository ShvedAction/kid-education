import type { TTSProvider } from '@/domain/tts';

/** Контекст для саг (TTS, store; dispatchNextRound — для story mode). */
export interface SagaContext {
  tts: TTSProvider;
  store: { dispatch: (action: unknown) => unknown };
  /** Для story/тестов: вызов следующего раунда по session.taskType/difficulty. */
  dispatchNextRound?: () => void;
}
