import { Container, Graphics } from '@pixi/react';
import { useCallback } from 'react';
import { Graphics as PixiGraphics } from 'pixi.js';
import { Tank as TankType, GAME_CONFIG } from '@awsome-tank-shooter/shared';

interface TankProps {
  tank: TankType;
  isLocal: boolean;
}

export function Tank({ tank, isLocal }: TankProps) {
  const drawTank = useCallback((g: PixiGraphics) => {
    g.clear();

    // Draw tank body
    g.beginFill(isLocal ? 0x4ade80 : 0x3b82f6);
    g.lineStyle(2, 0x000000);
    g.drawRect(
      -GAME_CONFIG.TANK_SIZE / 2,
      -GAME_CONFIG.TANK_SIZE / 2,
      GAME_CONFIG.TANK_SIZE,
      GAME_CONFIG.TANK_SIZE
    );
    g.endFill();

    // Draw tank turret
    g.beginFill(0x000000);
    g.lineStyle(0);
    g.drawRect(
      0,
      -4,
      GAME_CONFIG.TANK_SIZE / 2,
      8
    );
    g.endFill();

    // Draw health bar
    const healthWidth = GAME_CONFIG.TANK_SIZE;
    const healthHeight = 4;
    const healthY = -GAME_CONFIG.TANK_SIZE / 2 - 10;
    
    // Health bar background
    g.beginFill(0x000000);
    g.drawRect(-healthWidth / 2, healthY, healthWidth, healthHeight);
    g.endFill();

    // Health bar fill
    const healthPercent = tank.health / GAME_CONFIG.TANK_HEALTH;
    g.beginFill(healthPercent > 0.5 ? 0x4ade80 : healthPercent > 0.25 ? 0xfbbf24 : 0xf43f5e);
    g.drawRect(-healthWidth / 2, healthY, healthWidth * healthPercent, healthHeight);
    g.endFill();
  }, [tank.health, isLocal]);

  return (
    <Container
      x={tank.position.x}
      y={tank.position.y}
      rotation={tank.angle}
    >
      <Graphics draw={drawTank} />
    </Container>
  );
} 