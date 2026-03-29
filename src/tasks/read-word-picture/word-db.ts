import type { ReadWordPictureRound, TWordExample } from './types';

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = copy[i]!;
    copy[i] = copy[j]!;
    copy[j] = t;
  }
  return copy;
}

function toPictureOption(w: TWordExample) {
  return { id: w.id, alt: w.alt, url: w.url };
}

/**
 * Случайный раунд readWordPicture: одно слово из базы и ровно три варианта картинок
 * (целевое слово + два случайных отличных от него), порядок вариантов перемешан.
 */
export function randomReadWordPictureRound(): ReadWordPictureRound {
  const target = wordDB[Math.floor(Math.random() * wordDB.length)]!;
  const pool = wordDB.filter((w) => w.id !== target.id);
  const pick1 = pool.splice(Math.floor(Math.random() * pool.length), 1)[0]!;
  const pick2 = pool.splice(Math.floor(Math.random() * pool.length), 1)[0]!;
  const pick3 = pool.splice(Math.floor(Math.random() * pool.length), 1)[0]!;
  const options = shuffle([target, pick1, pick2, pick3]).map(toPictureOption);
  return {
    type: 'readWordPicture',
    word: target.word,
    correctId: target.id,
    options,
  };
}

export const wordDB: TWordExample[] = [
  {
    word: 'СОК',
    level: 1,
    id: 'sok',
    alt: 'Сок',
    url: '/word-img/sok.png',
  },
  {
    word: 'ЛУК',
    level: 1,
    id: 'luk',
    alt: 'Лук',
    url: 'word-img/luk.png',
  },
  {
    word: 'СТОЛ',
    level: 2,
    id: 'stol',
    alt: 'Стол',
    url: '/word-img/table.png',
  },
  {
    word: 'СЛОН',
    level: 2,
    id: 'slon',
    alt: 'Слон',
    url: '/word-img/elephant.png',
  },
  {
    word: 'ДОМ',
    level: 1,
    id: 'dom',
    alt: 'Дом',
    url: '/word-img/house.png',
  },
  {
    word: 'КОТ',
    level: 1,
    id: 'kot',
    alt: 'Кот',
    url: '/word-img/cat.png',
  },
  {
    word: 'ПОЛ',
    level: 1,
    id: 'pol',
    alt: 'Пол',
    url: '/word-img/floor.png',
  },
  {
    word: 'МАТ',
    level: 1,
    id: 'mat',
    alt: 'Мат',
    url: '/word-img/mat.png',
  },
  {
    word: 'БАЛ',
    level: 1,
    id: 'bal',
    alt: 'Бал',
    url: '/word-img/bal.png',
  },
  {
    word: 'БОТ',
    level: 1,
    id: 'bot',
    alt: 'Бот',
    url: '/word-img/bot.png',
  },
  {
    word: 'ВАТА',
    level: 1,
    id: 'vata',
    alt: 'Вата',
    url: '/word-img/cotton.png',
  },
];