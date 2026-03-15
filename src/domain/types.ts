/**
 * Типы домена (см. docs/VOCABULARY.md).
 * Задел на несколько типов заданий и конфигураций.
 */

/** Слог — строка из 1–2 букв, напр. "НА", "КУ" */
export type Syllable = string;

/** Сложность: число вариантов в раунде (3–6) */
export type DifficultyLevel = 3 | 4 | 5 | 6;

/** Конфигурация задания «выбери слог» */
export interface PickSyllableTaskConfig {
  type: 'pickSyllable';
  /** Число вариантов на экране */
  optionsCount: DifficultyLevel;
}

/** Конфигурация задания «собери слог» (drag-and-drop букв в слоты) */
export interface ComposeSyllableTaskConfig {
  type: 'composeSyllable';
  /** Пока без параметров сложности; позже — лишние буквы-дистракторы */
}

import type {
  ClassifyLetterTaskConfig,
  ClassifyLetterRound,
} from '@/tasks/classify-letter/types';
import type {
  PairSyllableTaskConfig,
  PairSyllableRound,
} from '@/tasks/pair-syllable/types';
import type {
  ReadWordPictureTaskConfig,
  ReadWordPictureRound,
} from '@/tasks/read-word-picture/types';

export type { ClassifyLetterTaskConfig, ClassifyLetterRound };
export type { PairSyllableTaskConfig, PairSyllableRound };
export type { ReadWordPictureTaskConfig, ReadWordPictureRound };

/** Общий тип конфигурации задания (расширяется другими типами) */
export type TaskConfig =
  | PickSyllableTaskConfig
  | ComposeSyllableTaskConfig
  | ClassifyLetterTaskConfig
  | PairSyllableTaskConfig
  | ReadWordPictureTaskConfig;

/** Идентификатор типа задания для микса в будущем */
export type TaskType = TaskConfig['type'];

/** Раунд задания «выбери слог» */
export interface PickSyllableRound {
  type: 'pickSyllable';
  /** Слог, который нужно выбрать */
  target: Syllable;
  /** Варианты на экране (включая target); после ошибок список уменьшается */
  options: Syllable[];
}

/** Раунд задания «собери слог»: буквы разбросаны, в центре слоты для слога */
export interface ComposeSyllableRound {
  type: 'composeSyllable';
  /** Слог, который нужно собрать, напр. "НО" */
  target: Syllable;
  /** Буквы для перетаскивания (обычно target.split(''), можно добавить дистракторы) */
  letters: string[];
}

export type Round =
  | PickSyllableRound
  | ComposeSyllableRound
  | ClassifyLetterRound
  | PairSyllableRound
  | ReadWordPictureRound;

/** Результат попытки в раунде */
export type AttemptResult =
  | { kind: 'correct' }
  | { kind: 'wrong'; chosen: Syllable };

/** Результат завершённого раунда (для стратегий). */
export interface RoundResult {
  correct: boolean;
  attempts?: number;
}

/** Спецификация следующего раунда (что запрашивает стратегия). */
export interface RoundSpec {
  taskType: TaskType;
  difficulty?: DifficultyLevel;
}
