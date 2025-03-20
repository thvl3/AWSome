import { Container, Graphics } from '@pixi/react';
import { useCallback } from 'react';
import { Graphics as PixiGraphics } from 'pixi.js';
import { GAME_CONFIG, WALLS } from '@awsome-tank-shooter/shared';
import { Tank } from './Tank';
import { Bullet } from './Bullet';
import { useGameStore } from '@/stores/gameStore';

export function GameScene() {
  const gameState = useGameStore((state) => state.gameState);
  const localPlayerId = useGameStore((state) => state.localPlayerId);

  const drawWall = useCallback((g: PixiGraphics) => {
    g.clear();
    g.beginFill(0x333333);
    g.lineStyle(2, 0x666666);

    WALLS.forEach((wall) => {
      g.drawRect(wall.x, wall.y, wall.width, wall.height);
    });

    g.endFill();
  }, []);

  if (!gameState) return null;

  return (
    <Container>
      <Graphics draw={drawWall} />
      
      {gameState.tanks.map((tank) => (
        <Tank
          key={tank.id}
          tank={tank}
          isLocal={tank.id === localPlayerId}
        />
      ))}

      {gameState.bullets.map((bullet) => (
        <Bullet key={bullet.id} bullet={bullet} />
      ))}
    </Container>
  );
} 