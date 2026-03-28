import type { PictureOption } from './types';
import type { TWordPart } from './types';
import { isVowel } from '@/domain/letters';
import './ReadWordPictureRoundView.css';
import { wordDB } from './word-db';

/**
 * Пропсы презентационного компонента «Прочитай слово и выбери картинку».
 */
export interface ReadWordPictureRoundViewProps {
  options: PictureOption[];
  wordParts: TWordPart[];
  showPictures: boolean;
  status: 'idle' | 'correct' | 'wrong';
  hasStarted: boolean;
  spoken: boolean;
  onStart: () => void;
  onReadPart: (index: number) => void;
  onChooseOption: (optionId: string) => void;
}

/** Рендер слова по слогам из store: по порядку только активный слог, после — все. */
function WordBySyllables({
  wordParts,
  showPictures,
  status,
  onReadPart,
}: {
  wordParts: TWordPart[];
  showPictures: boolean;
  status: 'idle' | 'correct' | 'wrong';
  onReadPart: (index: number) => void;
}) {
  return (
    <span
      className="read-word-picture-word"
      data-testid="read-word-picture-word"
      role="group"
      aria-label="Слово по слогам"
    >
      {wordParts.map((part, idx) => {
        const disabled =
          status !== 'idle' ||
          (!showPictures ? !part.current : false);
        if (part.content.length === 2) {
          return (
            <button
              key={`${idx}-${part.content}`}
              type="button"
              className="read-word-picture-syllable-chip"
              disabled={disabled}
              onClick={() => onReadPart(idx)}
              aria-label={`Прочитать слог ${part.content}`}
              data-testid={`read-word-picture-syllable-${idx}`}
            >
              <span className="letter-chip consonant">{part.content[0]}</span>
              <span className="letter-chip vowel">{part.content[1]}</span>
            </button>
          );
        }
        const cls = isVowel(part.content) ? 'vowel' : 'consonant';
        return (
          <button
            key={`${idx}-${part.content}`}
            type="button"
            className={`read-word-picture-letter-single letter-chip ${cls}`}
            disabled={disabled}
            onClick={() => onReadPart(idx)}
            aria-label={`Прочитать ${part.content}`}
            data-testid={`read-word-picture-syllable-${idx}`}
          >
            {part.content}
          </button>
        );
      })}
    </span>
  );
}

/** Чистое представление раунда «Прочитай слово и выбери картинку». */
export function ReadWordPictureRoundView({
  options,
  wordParts,
  showPictures,
  status,
  hasStarted,
  spoken,
  onStart,
  onReadPart,
  onChooseOption,
}: ReadWordPictureRoundViewProps) {
  if (!hasStarted) {
    return (
      <div
        className="read-word-picture-round"
        data-testid="read-word-picture-round"
      >
        <button
          type="button"
          className="start-button"
          onClick={onStart}
          aria-label="Начать задание"
          data-testid="read-word-picture-start"
        >
          Начать
        </button>
      </div>
    );
  }

  return (
    <div
      className="read-word-picture-round"
      data-testid="read-word-picture-round"
    >
      <div className="read-word-picture-word-wrap">
        <WordBySyllables
          wordParts={wordParts}
          showPictures={showPictures}
          status={status}
          onReadPart={onReadPart}
        />
      </div>
      {showPictures && (
        <div
          className="read-word-picture-options"
          role="group"
          aria-label="Варианты картинок"
          data-testid="read-word-picture-options"
        >
          {options.map((opt) => {
            const word = wordDB.find((w) => w.id === opt.id);
            return (
              <button
                key={opt.id}
                type="button"
                className="read-word-picture-option"
                onClick={() => onChooseOption(opt.id)}
                disabled={status !== 'idle'}
                data-testid={`read-word-picture-option-${opt.id}`}
              >
                {word?.url ? <img src={word.url} alt={opt.alt} /> : opt.alt}
              </button>
            );
          })}
        </div>
      )}
      {!spoken && (
        <p className="read-word-picture-hint" data-testid="read-word-picture-hint">
          Слушай задание…
        </p>
      )}
    </div>
  );
}
