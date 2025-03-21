export interface Vector2D {
  x: number;
  y: number;
}

export interface Tank {
  id: string;
  name: string;
  x: number;
  y: number;
  angle: number;
  health: number;
  score: number;
  lastShot: number;
}

export interface Bullet {
  id: string;
  x: number;
  y: number;
  angle: number;
  ownerId: string;
  createdAt: number;
}

export interface Wall {
  id: string;
  position: Vector2D;
  width: number;
  height: number;
}

export interface GameState {
  players: Tank[];
  bullets: Bullet[];
  walls: Wall[];
  scores: Record<string, number>;
}

export interface PlayerInput {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  angle: number;
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