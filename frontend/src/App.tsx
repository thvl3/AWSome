import { Game } from '@/components/Game';
import { StartMenu } from '@/components/StartMenu';
import { useGameStore } from '@/stores/gameStore';
import { useGameConnection } from '@/hooks/useGameConnection';

export default function App() {
  const isPlaying = useGameStore((state) => state.isPlaying);
  const { connect } = useGameConnection();

  const handleStart = (name: string) => {
    connect(name);
  };

  return (
    <div className="h-full flex items-center justify-center bg-game-bg">
      {!isPlaying ? (
        <StartMenu onStart={handleStart} />
      ) : (
        <Game />
      )}
    </div>
  );
} 