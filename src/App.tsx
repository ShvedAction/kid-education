import { useAppSelector } from '@/store';
import { PickSyllableRoundContainer } from '@/tasks/pick-syllable';
import { ComposeSyllableRoundContainer } from '@/tasks/compose-syllable';
import { ClassifyLetterRoundContainer } from '@/tasks/classify-letter';
import { PairSyllableRoundContainer } from '@/tasks/pair-syllable';
import { ReadWordPictureRoundContainer } from '@/tasks/read-word-picture';
import './App.css';

export default function App() {
  const currentRound = useAppSelector((s) => s.session.currentRound);
  const roundKey = useAppSelector((s) => s.session.roundKey);

  if (currentRound === null) return null;

  return (
    <div className="app" data-testid="app">
      <header className="header" data-testid="app-header">
        <h1>Учимся читать</h1>
      </header>
      <main className="main" data-testid="main">
        {currentRound.type === 'pickSyllable' && (
          <PickSyllableRoundContainer key={roundKey} />
        )}
        {currentRound.type === 'composeSyllable' && (
          <ComposeSyllableRoundContainer key={roundKey} />
        )}
        {currentRound.type === 'classifyLetter' && (
          <ClassifyLetterRoundContainer key={roundKey} />
        )}
        {currentRound.type === 'pairSyllable' && (
          <PairSyllableRoundContainer key={roundKey} />
        )}
        {currentRound.type === 'readWordPicture' && (
          <ReadWordPictureRoundContainer key={roundKey} />
        )}
      </main>
    </div>
  );
}
