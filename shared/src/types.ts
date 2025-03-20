export interface Vector2D {
  x: number;
  y: number;
}

export interface Tank {
  id: string;
  position: Vector2D;
  angle: number; // turret angle in radians
  health: number;
  score: number;
}

export interface Bullet {
  id: string;
  ownerId: string;
  position: Vector2D;
  angle: number; // direction in radians
  speed: number;
}

export interface Wall {
  id: string;
  position: Vector2D;
  width: number;
  height: number;
}

export interface GameState {
  tanks: Tank[];
  bullets: Bullet[];
  walls: Wall[];
  scores: Record<string, number>;
}

export interface PlayerInput {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  turretAngle: number;
  shooting: boolean;
}

// Socket.IO event types
export interface ServerToClientEvents {
  gameState: (state: GameState) => void;
  playerJoined: (player: Tank) => void;
  playerLeft: (playerId: string) => void;
  playerHit: (data: { targetId: string; damage: number }) => void;
  playerEliminated: (playerId: string) => void;
  scoreUpdate: (scores: Record<string, number>) => void;
}

export interface ClientToServerEvents {
  input: (input: PlayerInput) => void;
  join: (playerName: string) => void;
  leave: () => void;
} 