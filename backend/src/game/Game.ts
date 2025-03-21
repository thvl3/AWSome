import { Tank, GameState, PlayerInput, Bullet, Wall, Vector2D } from '@awsome-tank-shooter/shared';
import { GAME_CONFIG, WALLS } from '@awsome-tank-shooter/shared';
import { Server } from 'socket.io';

// Declare global io variable for emitting events
declare global {
  var io: Server | undefined;
}

export class Game {
  private players: Map<string, Tank>;
  private bullets: Array<Bullet>;
  private walls: Array<Wall>;
  private scores: Record<string, number>;
  private lastUpdate: number;
  private readonly fixedDeltaTime: number;

  constructor() {
    this.players = new Map();
    this.bullets = [];
    this.scores = {};
    this.lastUpdate = Date.now();
    this.fixedDeltaTime = 1 / GAME_CONFIG.SERVER_TICK_RATE;
    
    // Initialize walls
    this.walls = WALLS.map((wallConfig, index) => ({
      id: `wall-${index}`,
      position: { x: wallConfig.x, y: wallConfig.y },
      width: wallConfig.width,
      height: wallConfig.height
    }));
  }

  public addPlayer(id: string, name: string): Tank {
    const tank: Tank = {
      id,
      name,
      x: Math.random() * (GAME_CONFIG.ARENA_WIDTH - GAME_CONFIG.TANK_SIZE),
      y: Math.random() * (GAME_CONFIG.ARENA_HEIGHT - GAME_CONFIG.TANK_SIZE),
      angle: 0,
      health: GAME_CONFIG.TANK_HEALTH,
      score: 0,
      lastShot: 0,
    };
    this.players.set(id, tank);
    this.scores[id] = 0;
    return tank;
  }

  public removePlayer(id: string): void {
    this.players.delete(id);
    delete this.scores[id];
  }

  public updatePlayerInput(id: string, input: PlayerInput): void {
    const player = this.players.get(id);
    if (!player) return;

    // Update tank position based on input using fixed timestep
    const speed = GAME_CONFIG.TANK_SPEED * this.fixedDeltaTime;

    // Calculate movement vector
    let dx = 0;
    let dy = 0;
    if (input.up) dy -= 1;
    if (input.down) dy += 1;
    if (input.left) dx -= 1;
    if (input.right) dx += 1;

    // Normalize diagonal movement
    if (dx !== 0 && dy !== 0) {
      const length = Math.sqrt(dx * dx + dy * dy);
      dx /= length;
      dy /= length;
    }

    // Calculate new position
    const newX = player.x + dx * speed;
    const newY = player.y + dy * speed;
    
    // Check for collision with walls before applying movement
    const tankRadius = GAME_CONFIG.TANK_SIZE / 2;
    const tankCenterX = newX + tankRadius;
    const tankCenterY = newY + tankRadius;
    
    let collided = false;
    
    for (const wall of this.walls) {
      // Simple AABB collision check with circular tank
      const closestX = Math.max(wall.position.x, Math.min(tankCenterX, wall.position.x + wall.width));
      const closestY = Math.max(wall.position.y, Math.min(tankCenterY, wall.position.y + wall.height));
      
      const distanceX = tankCenterX - closestX;
      const distanceY = tankCenterY - closestY;
      const distanceSquared = distanceX * distanceX + distanceY * distanceY;
      
      if (distanceSquared < tankRadius * tankRadius) {
        collided = true;
        break;
      }
    }
    
    // Apply movement if no collision
    if (!collided) {
      player.x = newX;
      player.y = newY;
    }

    // Update tank angle
    player.angle = input.angle;

    // Handle shooting
    if (input.shooting && Date.now() - player.lastShot >= GAME_CONFIG.BULLET_COOLDOWN) {
      this.spawnBullet(id);
      player.lastShot = Date.now();
    }

    // Keep tank within bounds
    player.x = Math.max(0, Math.min(GAME_CONFIG.ARENA_WIDTH - GAME_CONFIG.TANK_SIZE, player.x));
    player.y = Math.max(0, Math.min(GAME_CONFIG.ARENA_HEIGHT - GAME_CONFIG.TANK_SIZE, player.y));
  }

  private spawnBullet(ownerId: string): void {
    const owner = this.players.get(ownerId);
    if (!owner) return;

    const bulletCenterX = owner.x + GAME_CONFIG.TANK_SIZE / 2;
    const bulletCenterY = owner.y + GAME_CONFIG.TANK_SIZE / 2;
    
    // Calculate bullet spawn position at the end of the tank barrel
    const spawnDistance = GAME_CONFIG.TANK_SIZE / 2 + 5;
    const spawnX = bulletCenterX + Math.cos(owner.angle) * spawnDistance;
    const spawnY = bulletCenterY + Math.sin(owner.angle) * spawnDistance;

    const bullet: Bullet = {
      id: `${ownerId}-${Date.now()}`,
      x: spawnX,
      y: spawnY,
      angle: owner.angle,
      ownerId,
      createdAt: Date.now(),
    };
    this.bullets.push(bullet);
  }

  public update(): void {
    const now = Date.now();
    this.lastUpdate = now;

    // Update bullet positions using fixed timestep
    this.bullets = this.bullets.filter(bullet => {
      // Remove old bullets
      if (now - bullet.createdAt > GAME_CONFIG.BULLET_LIFETIME) {
        return false;
      }

      // Calculate new position
      const speed = GAME_CONFIG.BULLET_SPEED * this.fixedDeltaTime;
      const newX = bullet.x + Math.cos(bullet.angle) * speed;
      const newY = bullet.y + Math.sin(bullet.angle) * speed;
      
      // Check for collisions with walls
      for (const wall of this.walls) {
        if (this.bulletCollidesWithWall(newX, newY, wall)) {
          return false; // Remove bullet on wall collision
        }
      }
      
      // Update position if no wall collision
      bullet.x = newX;
      bullet.y = newY;

      // Check for collisions with players
      for (const [playerId, player] of this.players) {
        if (playerId === bullet.ownerId) continue; // Skip owner

        const dx = bullet.x - (player.x + GAME_CONFIG.TANK_SIZE / 2);
        const dy = bullet.y - (player.y + GAME_CONFIG.TANK_SIZE / 2);
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < GAME_CONFIG.TANK_SIZE / 2) {
          // Hit detected
          player.health -= GAME_CONFIG.BULLET_DAMAGE;
          
          // Emit playerHit event
          global.io?.emit('playerHit', { targetId: playerId, damage: GAME_CONFIG.BULLET_DAMAGE });
          
          if (player.health <= 0) {
            // Player eliminated
            const owner = this.players.get(bullet.ownerId);
            if (owner) {
              owner.score += GAME_CONFIG.SCORE_PER_KILL;
              this.scores[bullet.ownerId] = owner.score;
              
              // Emit score update
              global.io?.emit('scoreUpdate', this.scores);
              
              // Emit player eliminated event
              global.io?.emit('playerEliminated', playerId);
            }
            this.respawnPlayer(playerId);
          }
          return false; // Remove bullet
        }
      }

      return true;
    });
  }
  
  private bulletCollidesWithWall(bulletX: number, bulletY: number, wall: Wall): boolean {
    // Simple collision check between bullet point and wall rectangle
    return (
      bulletX >= wall.position.x &&
      bulletX <= wall.position.x + wall.width &&
      bulletY >= wall.position.y &&
      bulletY <= wall.position.y + wall.height
    );
  }

  private respawnPlayer(id: string): void {
    const player = this.players.get(id);
    if (!player) return;

    // Find a spawn position away from walls
    let validSpawn = false;
    let spawnX = 0;
    let spawnY = 0;
    let attempts = 0;
    
    while (!validSpawn && attempts < 20) {
      spawnX = Math.random() * (GAME_CONFIG.ARENA_WIDTH - GAME_CONFIG.TANK_SIZE);
      spawnY = Math.random() * (GAME_CONFIG.ARENA_HEIGHT - GAME_CONFIG.TANK_SIZE);
      
      validSpawn = true;
      const tankRadius = GAME_CONFIG.TANK_SIZE / 2;
      const tankCenterX = spawnX + tankRadius;
      const tankCenterY = spawnY + tankRadius;
      
      // Check distance from all walls
      for (const wall of this.walls) {
        const closestX = Math.max(wall.position.x, Math.min(tankCenterX, wall.position.x + wall.width));
        const closestY = Math.max(wall.position.y, Math.min(tankCenterY, wall.position.y + wall.height));
        
        const distanceX = tankCenterX - closestX;
        const distanceY = tankCenterY - closestY;
        const distanceSquared = distanceX * distanceX + distanceY * distanceY;
        
        // Add some buffer space
        if (distanceSquared < (tankRadius + 20) * (tankRadius + 20)) {
          validSpawn = false;
          break;
        }
      }
      
      attempts++;
    }
    
    // If we couldn't find a valid spawn after max attempts, just use any position
    if (!validSpawn) {
      spawnX = Math.random() * (GAME_CONFIG.ARENA_WIDTH - GAME_CONFIG.TANK_SIZE);
      spawnY = Math.random() * (GAME_CONFIG.ARENA_HEIGHT - GAME_CONFIG.TANK_SIZE);
    }
    
    player.x = spawnX;
    player.y = spawnY;
    player.health = GAME_CONFIG.TANK_HEALTH;
  }

  public getState(): GameState {
    return {
      players: Array.from(this.players.values()),
      bullets: this.bullets,
      walls: this.walls,
      scores: this.scores
    };
  }
} 