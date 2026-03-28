/**
 * Типы задания «Прочитать слово и выбрать картинку».
 * @see docs/ROADMAP.md
 */

/** Вариант картинки (пока только alt, src — позже) */
export interface PictureOption {
  id: string;
  alt: string;
  url?: string;
}

export type TWordExample = PictureOption & {
  word: string;
  level: number;
};

/** Конфигурация задания «прочитай слово и выбери картинку» */
export interface ReadWordPictureTaskConfig {
  type: 'readWordPicture';
  /** Пока без параметров сложности; позже — число вариантов, источник слов */
}

/** Раунд: слово и варианты картинок, одна из которых соответствует слову */
export interface ReadWordPictureRound {
  type: 'readWordPicture';
  /** Слово, которое нужно прочитать и сопоставить с картинкой */
  word: string;
  /** Варианты картинок (включая правильную); после ошибки выбранный убирается */
  options: PictureOption[];
  /** id правильного варианта (соответствует слову) */
  correctId: string;
}

export type TWordPart = {
  content: string;
  readed: boolean;
  current: boolean;
}
