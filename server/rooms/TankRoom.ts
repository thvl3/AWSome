import { Room, Client } from "colyseus";
import { GAME_CONFIG } from "../../shared/src/constants.js";
import { PlayerInput } from "../../shared/src/types.js";
import { TankGameState, Player, Bullet } from "../types.js";

export class TankRoom extends Room<TankGameState> {
  maxClients = 8;
  lastUpdateTime = Date.now();
  fixedTimeStep = 1000 / 60; // 60 updates per second

  onCreate() {
    console.log("TankRoom created!");
    this.setState(new TankGameState());

    // Set up physics update loop
    this.setSimulationInterval(() => this.update());

    // Handle player input
    this.onMessage("input", (client, input: PlayerInput) => {
      const player = this.state.players.get(client.sessionId);
      if (!player) return;

      // Store input
      player.input = input;
    });
  }

  onJoin(client: Client) {
    console.log(`Player ${client.sessionId} joined!`);

    // Create new player at random position
    const player = new Player(
      client.sessionId,
      Math.random() * GAME_CONFIG.ARENA_WIDTH,
      Math.random() * GAME_CONFIG.ARENA_HEIGHT
    );
    
    this.state.players.set(client.sessionId, player);
  }

  onLeave(client: Client) {
    console.log(`Player ${client.sessionId} left!`);
    this.state.players.delete(client.sessionId);
  }

  update() {
    const now = Date.now();
    const deltaTime = (now - this.lastUpdateTime) / 1000;
    this.lastUpdateTime = now;

    // Update player positions
    this.state.players.forEach((player, id) => {
      // Process input
      const input = player.input;
      if (!input) return;

      // Calculate movement
      let speed = 0;
      if (input.up) speed = GAME_CONFIG.TANK_SPEED;
      if (input.down) speed = -GAME_CONFIG.TANK_SPEED;

      // Calculate rotation
      let rotationSpeed = 0;
      if (input.left) rotationSpeed = -GAME_CONFIG.TANK_ROTATION_SPEED;
      if (input.right) rotationSpeed = GAME_CONFIG.TANK_ROTATION_SPEED;

      // Set turret angle based on input
      player.angle = input.angle;

      // Apply movement
      const moveAngle = player.angle;
      player.vx = Math.cos(moveAngle) * speed;
      player.vy = Math.sin(moveAngle) * speed;

      // Update position
      player.x += player.vx * deltaTime;
      player.y += player.vy * deltaTime;

      // Handle shooting
      if (input.shooting && now - player.lastShot > GAME_CONFIG.BULLET_COOLDOWN) {
        this.createBullet(player);
        player.lastShot = now;
      }

      // Keep player within bounds
      player.x = Math.max(0, Math.min(player.x, GAME_CONFIG.ARENA_WIDTH));
      player.y = Math.max(0, Math.min(player.y, GAME_CONFIG.ARENA_HEIGHT));
    });

    // Update bullet positions
    this.state.bullets.forEach((bullet, id) => {
      // Update position
      bullet.x += bullet.vx * deltaTime;
      bullet.y += bullet.vy * deltaTime;

      // Check if bullet is out of bounds
      if (
        bullet.x < 0 ||
        bullet.x > GAME_CONFIG.ARENA_WIDTH ||
        bullet.y < 0 ||
        bullet.y > GAME_CONFIG.ARENA_HEIGHT
      ) {
        this.state.bullets.delete(id);
        return;
      }

      // Check for collisions with players
      this.state.players.forEach((player, playerId) => {
        // Skip if bullet belongs to this player
        if (bullet.playerId === playerId) return;

        // Check collision
        const dx = bullet.x - player.x;
        const dy = bullet.y - player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < GAME_CONFIG.TANK_SIZE / 2 + GAME_CONFIG.BULLET_SIZE / 2) {
          // Player hit!
          this.state.bullets.delete(id);
          // Reset player position on hit
          player.x = Math.random() * GAME_CONFIG.ARENA_WIDTH;
          player.y = Math.random() * GAME_CONFIG.ARENA_HEIGHT;
        }
      });
    });
  }

  createBullet(player: Player) {
    const bulletId = `bullet_${this.state.bulletIdCounter++}`;
    const angle = player.angle;
    
    // Create bullet at the tip of the tank's turret
    const turretLength = GAME_CONFIG.TANK_SIZE / 2 + 20;
    const startX = player.x + Math.cos(angle) * turretLength;
    const startY = player.y + Math.sin(angle) * turretLength;

    const bullet = new Bullet(
      bulletId,
      player.id,
      startX,
      startY,
      Math.cos(angle) * GAME_CONFIG.BULLET_SPEED,
      Math.sin(angle) * GAME_CONFIG.BULLET_SPEED
    );
    
    this.state.bullets.set(bulletId, bullet);
  }
} 