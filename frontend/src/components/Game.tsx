import { Stage, Container } from '@pixi/react';
import { useEffect } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { GAME_CONFIG } from '@awsome-tank-shooter/shared';
import { GameScene } from './GameScene';
import { Scoreboard } from './Scoreboard';
import { useGameConnection } from '@/hooks/useGameConnection';

interface GameProps {
  playerName: string;
}

export function Game({ playerName }: GameProps) {
  const { connect, disconnect } = useGameConnection();

  useEffect(() => {
    connect(playerName);
    return () => disconnect();
  }, [playerName, connect, disconnect]);

  return (
    <div className="relative w-full h-full">
      <Stage
        width={GAME_CONFIG.ARENA_WIDTH}
        height={GAME_CONFIG.ARENA_HEIGHT}
        options={{
          backgroundColor: 0x1a1a1a,
          antialias: true,
          resolution: window.devicePixelRatio || 1,
        }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
      >
        <Container>
          <GameScene />
        </Container>
      </Stage>
      <Scoreboard className="absolute top-4 right-4" />
    </div>
  );
} 