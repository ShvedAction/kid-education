import { useState, useCallback } from 'react';
import type { ComposeSyllableRound as Round } from '@/domain/types';

export type DragSource = { kind: 'pool' } | { kind: 'slot'; index: number };

/**
 * Пропсы презентационного компонента «Собери слог».
 *
 * @remarks
 * Данные раунда и состояние (slots, pool, status, hasStarted, spoken) приходят из контейнера;
 * onStart — запуск раунда (озвучка через сагу), onDropToSlot / onDropToPool — DnD.
 */
export interface ComposeSyllableRoundViewProps {
  round: Round;
  slots: (string | null)[];
  pool: string[];
  status: 'idle' | 'correct' | 'wrong';
  hasStarted: boolean;
  spoken: boolean;
  onStart: () => void;
  onDropToSlot: (slotIndex: number, payload: { source: DragSource; letter: string }) => void;
  onDropToPool: (payload: { source: DragSource; letter: string }) => void;
}

/** Чистое представление раунда «Собери слог» (без TTS, данные снаружи). */
export function ComposeSyllableRoundView({
  round,
  slots,
  pool,
  status,
  hasStarted,
  spoken,
  onStart,
  onDropToSlot,
  onDropToPool,
}: ComposeSyllableRoundViewProps) {
  const [dragging, setDragging] = useState<{
    source: DragSource;
    letter: string;
  } | null>(null);

  const target = round.target;

  const handleDragStart = useCallback(
    (e: React.DragEvent, source: DragSource, letter: string) => {
      setDragging({ source, letter });
      e.dataTransfer.setData(
        'application/json',
        JSON.stringify({ source, letter })
      );
      e.dataTransfer.effectAllowed = 'move';
    },
    []
  );

  const handleDragEnd = useCallback(() => {
    setDragging(null);
  }, []);

  const handleDropOnSlot = useCallback(
    (e: React.DragEvent, slotIndex: number) => {
      e.preventDefault();
      const raw = e.dataTransfer.getData('application/json');
      if (!raw) return;
      setDragging(null);
      try {
        const payload = JSON.parse(raw) as { source: DragSource; letter: string };
        onDropToSlot(slotIndex, payload);
      } catch {
        // ignore
      }
    },
    [onDropToSlot]
  );

  const handleDropOnPool = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const raw = e.dataTransfer.getData('application/json');
      if (!raw) return;
      try {
        const payload = JSON.parse(raw) as { source: DragSource; letter: string };
        if (payload.source.kind === 'slot') {
          onDropToPool(payload);
        }
      } catch {
        // ignore
      }
      setDragging(null);
    },
    [onDropToPool]
  );

  const preventDefault = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  return (
    <div
      className="compose-syllable-round"
      data-testid="compose-syllable-round"
    >
      <p className="instruction" data-testid="compose-syllable-instruction" style={{ display: 'none' }}>
        Собери слог <strong>{target}</strong>
      </p>

      {!hasStarted ? (
        <button
          type="button"
          className="start-button"
          onClick={onStart}
          aria-label="Начать задание"
          data-testid="compose-syllable-start"
        >
          Начать
        </button>
      ) : (
        <>
          <div
            className="slots"
            role="group"
            aria-label="Слоты для слога"
            data-testid="compose-syllable-slots"
          >
            {slots.map((letter, index) => (
              <div
                key={`slot-${index}`}
                className={`slot ${letter ? 'filled' : ''}`}
                onDragOver={preventDefault}
                onDrop={(ev) => {
                  const raw = ev.dataTransfer.getData('application/json');
                  if (!raw) return;
                  try {
                    const { source } = JSON.parse(raw) as { source: DragSource };
                    if (source.kind === 'slot' && source.index === index) return;
                    handleDropOnSlot(ev, index);
                  } catch {
                    // ignore
                  }
                }}
              >
                {letter ? (
                  <span
                    className="slot-letter"
                    draggable
                    onDragStart={(ev) =>
                      handleDragStart(ev, { kind: 'slot', index }, letter)
                    }
                    onDragEnd={handleDragEnd}
                  >
                    {letter}
                  </span>
                ) : (
                  <span className="slot-placeholder" aria-hidden>
                    ?
                  </span>
                )}
              </div>
            ))}
          </div>

          <div
            className="letters-pool"
            role="group"
            aria-label="Буквы"
            onDragOver={preventDefault}
            onDrop={handleDropOnPool}
            data-testid="compose-syllable-pool"
          >
            {pool.map((letter, i) => (
              <span
                key={`${letter}-${i}`}
                className={`letter-chip ${dragging?.source.kind === 'pool' && dragging.letter === letter ? 'dragging' : ''}`}
                draggable
                onDragStart={(ev) => handleDragStart(ev, { kind: 'pool' }, letter)}
                onDragEnd={handleDragEnd}
              >
                {letter}
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
