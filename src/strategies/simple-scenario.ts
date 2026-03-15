import type { RoundResult, RoundSpec } from '@/domain/types';

/**
 * Простая стратегия: заранее заданная последовательность с ветвлением по правильности.
 * Первый раунд — «выбери слог» (4 варианта). После correct — «собери слог», после wrong — снова «выбери слог» (3 варианта).
 * Далее цикл повторяется.
 */
export function* simpleStrategy(): Generator<
  RoundSpec | undefined,
  void,
  RoundResult | undefined
> {
  yield { taskType: 'pickSyllable', difficulty: 4 };

  while (true) {
    const result = yield;
    if (result?.correct) {
      yield { taskType: 'composeSyllable' };
    } else {
      yield { taskType: 'pickSyllable', difficulty: 3 };
    }
  }
}
