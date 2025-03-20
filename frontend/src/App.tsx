import { useState } from 'react';
import { Game } from '@/components/Game';
import { StartMenu } from '@/components/StartMenu';
import { useGameStore } from '@/stores/gameStore';

export default function App() {
  const [playerName, setPlayerName] = useState('');
  const isPlaying = useGameStore((state) => state.isPlaying);

  const handleStart = (name: string) => {
    setPlayerName(name);
    useGameStore.getState().startGame();
  };

  return (
    <div className="h-full flex items-center justify-center bg-game-bg">
      {!isPlaying ? (
        <StartMenu onStart={handleStart} />
      ) : (
        <Game playerName={playerName} />
      )}
    </div>
  );
} 