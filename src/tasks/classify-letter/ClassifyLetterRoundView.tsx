import { useState, useCallback } from 'react';
import type { ClassifyLetterRound } from './types';
import type { ClassifyLetterItem } from './classifyLetterSlice';
import './ClassifyLetterRoundView.css';

/**
 * Пропсы презентационного компонента «Гласная или согласная».
 *
 * @remarks
 * items, hasStarted, spoken приходят из контейнера; onStart, onSpeakLetter, onDropInZone — колбэки.
 */
export interface ClassifyLetterRoundViewProps {
  round: ClassifyLetterRound;
  items: ClassifyLetterItem[];
  hasStarted: boolean;
  spoken: boolean;
  wrongLetterId: string | null;
  onStart: () => void;
  onSpeakLetter: (letter: string) => void;
  onDropInZone: (letterId: string, zone: 'vowel' | 'consonant') => void;
}

const PAYLOAD_KEY = 'application/json';

export function ClassifyLetterRoundView({
  items,
  hasStarted,
  spoken,
  wrongLetterId,
  onStart,
  onSpeakLetter,
  onDropInZone,
}: ClassifyLetterRoundViewProps) {
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const handleDragStart = useCallback(
    (e: React.DragEvent, item: ClassifyLetterItem) => {
      if (item.placedZone !== null) return;
      setDraggingId(item.id);
      onSpeakLetter(item.letter);
      e.dataTransfer.setData(
        PAYLOAD_KEY,
        JSON.stringify({ letterId: item.id, letter: item.letter })
      );
      e.dataTransfer.effectAllowed = 'move';
    },
    [onSpeakLetter]
  );

  const handleDragEnd = useCallback(() => {
    setDraggingId(null);
  }, []);

  const preventDefault = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, zone: 'vowel' | 'consonant') => {
      e.preventDefault();
      setDraggingId(null);
      const raw = e.dataTransfer.getData(PAYLOAD_KEY);
      if (!raw) return;
      try {
        const { letterId } = JSON.parse(raw) as { letterId: string; letter: string };
        onDropInZone(letterId, zone);
      } catch {
        // ignore
      }
    },
    [onDropInZone]
  );

  const pending = items.filter((i) => i.placedZone === null);
  const inVowel = items.filter((i) => i.placedZone === 'vowel');
  const inConsonant = items.filter((i) => i.placedZone === 'consonant');

  return (
    <div
      className="classify-letter-round"
      data-testid="classify-letter-round"
    >
      {!hasStarted ? (
        <>
          <button
            type="button"
            className="start-button"
            onClick={onStart}
            aria-label="Начать задание"
            data-testid="classify-letter-start"
          >
            Начать
          </button>
        </>
      ) : (
        <>
          <div
            className="classify-letter-zones"
            role="group"
            aria-label="Зоны для букв"
            data-testid="classify-letter-zones"
          >
            <div
              className="classify-letter-zone zone-vowel"
              onDragOver={preventDefault}
              onDrop={(e) => handleDrop(e, 'vowel')}
              data-zone="vowel"
              data-testid="classify-letter-zone-vowel"
            >
              <span className="zone-label">Гласные</span>
              <div className="zone-letters">
                {inVowel.map((item) => (
                  <span
                    key={item.id}
                    className="letter-chip correct"
                    data-testid={`classify-letter-placed-${item.id}`}
                  >
                    {item.letter}
                  </span>
                ))}
              </div>
            </div>
            <div
              className="classify-letter-zone zone-consonant"
              onDragOver={preventDefault}
              onDrop={(e) => handleDrop(e, 'consonant')}
              data-zone="consonant"
              data-testid="classify-letter-zone-consonant"
            >
              <span className="zone-label">Согласные</span>
              <div className="zone-letters">
                {inConsonant.map((item) => (
                  <span
                    key={item.id}
                    className="letter-chip correct"
                    data-testid={`classify-letter-placed-${item.id}`}
                  >
                    {item.letter}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div
            className="classify-letter-pool"
            data-testid="classify-letter-pool"
          >
            {pending.map((item) => (
              <span
                key={item.id}
                className={`letter-chip ${draggingId === item.id ? 'dragging' : ''} ${wrongLetterId === item.id ? 'wrong' : ''}`}
                style={{
                  left: `${item.position.x}%`,
                  top: `${item.position.y}%`,
                }}
                draggable
                onDragStart={(e) => handleDragStart(e, item)}
                onDragEnd={handleDragEnd}
                data-testid={`classify-letter-chip-${item.id}`}
              >
                {item.letter}
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
