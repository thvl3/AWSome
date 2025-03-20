export const GAME_CONFIG = {
  // Tank settings
  TANK_SPEED: 200, // pixels per second
  TANK_ROTATION_SPEED: 3, // radians per second
  TANK_SIZE: 40, // pixels
  TANK_HEALTH: 3,
  TANK_RESPAWN_DELAY: 3000, // milliseconds

  // Bullet settings
  BULLET_SPEED: 400, // pixels per second
  BULLET_SIZE: 8, // pixels
  BULLET_DAMAGE: 1,
  BULLET_LIFETIME: 2000, // milliseconds
  BULLET_COOLDOWN: 500, // milliseconds between shots

  // Arena settings
  ARENA_WIDTH: 1200, // pixels
  ARENA_HEIGHT: 800, // pixels
  WALL_THICKNESS: 20, // pixels

  // Network settings
  SERVER_TICK_RATE: 30, // ticks per second
  CLIENT_INTERPOLATION_DELAY: 100, // milliseconds

  // Game settings
  MAX_PLAYERS: 20,
  SCORE_PER_KILL: 1,
} as const;

export const WALLS: Array<{ x: number; y: number; width: number; height: number }> = [
  // Arena boundaries
  { x: 0, y: 0, width: GAME_CONFIG.ARENA_WIDTH, height: GAME_CONFIG.WALL_THICKNESS }, // top
  { x: 0, y: GAME_CONFIG.ARENA_HEIGHT - GAME_CONFIG.WALL_THICKNESS, width: GAME_CONFIG.ARENA_WIDTH, height: GAME_CONFIG.WALL_THICKNESS }, // bottom
  { x: 0, y: 0, width: GAME_CONFIG.WALL_THICKNESS, height: GAME_CONFIG.ARENA_HEIGHT }, // left
  { x: GAME_CONFIG.ARENA_WIDTH - GAME_CONFIG.WALL_THICKNESS, y: 0, width: GAME_CONFIG.WALL_THICKNESS, height: GAME_CONFIG.ARENA_HEIGHT }, // right

  // Obstacles
  { x: 300, y: 200, width: 200, height: 200 }, // center obstacle
  { x: 100, y: 100, width: 100, height: 100 }, // top-left obstacle
  { x: GAME_CONFIG.ARENA_WIDTH - 200, y: GAME_CONFIG.ARENA_HEIGHT - 200, width: 100, height: 100 }, // bottom-right obstacle
]; 