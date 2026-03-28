import { useCallback } from 'react';
import { ReadWordPictureRoundView } from './ReadWordPictureRoundView';
import { useAppDispatch, useAppSelector } from '@/store/store';
import { readWordPictureSlice } from './readWordPictureSlice';

/**
 * Контейнер задания «Прочитай слово и выбери картинку»: подключает View к store
 * и диспатчит экшены slice. Озвучка выполняется сагой по экшенам startRound,
 * readPart (индекс слога), chooseWrong, chooseCorrect, retryAfterWrong (из саги).
 */
export function ReadWordPictureRoundContainer() {
  const dispatch = useAppDispatch();
  const round = useAppSelector((s) =>
    s.session.currentRound?.type === 'readWordPicture'
      ? s.session.currentRound
      : null
  );
  const { options, status, hasStarted, spoken, wordParts, showPictures } =
    useAppSelector((s) => s.readWordPicture);

  const handleStart = useCallback(() => {
    dispatch(readWordPictureSlice.actions.startRound());
  }, [dispatch]);

  const handleReadPart = useCallback(
    (index: number) => {
      dispatch(readWordPictureSlice.actions.readPart(index));
    },
    [dispatch]
  );

  const handleChooseOption = useCallback(
    (optionId: string) => {
      if (status !== 'idle' || !round) return;
      if (optionId === round.correctId) {
        dispatch(readWordPictureSlice.actions.chooseCorrect());
        return;
      }
      dispatch(readWordPictureSlice.actions.chooseWrong(optionId));
    },
    [dispatch, status, round]
  );

  if (!round) return null;

  return (
    <ReadWordPictureRoundView
      options={options}
      wordParts={wordParts}
      showPictures={showPictures}
      status={status}
      hasStarted={hasStarted}
      spoken={spoken}
      onStart={handleStart}
      onReadPart={handleReadPart}
      onChooseOption={handleChooseOption}
    />
  );
}
