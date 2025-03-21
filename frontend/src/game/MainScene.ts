import Phaser from 'phaser';
import { Room } from 'colyseus.js';
import { GAME_CONFIG, WALLS } from '@awsome-tank-shooter/shared';
import { PlayerInput } from '@awsome-tank-shooter/shared';

interface ServerPlayer {
  id: string;
  x: number;
  y: number;
  angle: number;
  onChange: (changes: any) => void;
}

interface ServerBullet {
  id: string;
  x: number;
  y: number;
  playerId: string;
  onChange: (changes: any) => void;
}

export class MainScene extends Phaser.Scene {
  public room?: Room;
  public localPlayerId?: string;
  private tanks: Map<string, Phaser.GameObjects.Container> = new Map();
  private bullets: Map<string, Phaser.GameObjects.Container> = new Map();
  private debugText?: Phaser.GameObjects.Text;
  private keys: Record<string, Phaser.Input.Keyboard.Key> = {};
  private shooting: boolean = false;
  private walls?: Phaser.GameObjects.Group;
  private lastInputTime: number = 0;
  private readonly inputThrottle: number = 1000 / 30; // Send inputs 30 times per second
  private isUpdating: boolean = false;
  private isInitialized: boolean = false;
  private errorCount: number = 0;

  constructor() {
    super('MainScene');
  }

  init(data: any) {
    try {
      console.log('MainScene init with data:', data);
      
      if (data) {
        this.room = data.room;
        this.localPlayerId = data.localPlayerId;
      }
      
      console.log('MainScene initialized with:', {
        hasRoom: !!this.room,
        localPlayerId: this.localPlayerId
      });
    } catch (error) {
      console.error('Error in MainScene init:', error);
    }
  }

  create() {
    try {
      console.log('MainScene create starting');
      
      // Create background
      const bg = this.add.rectangle(0, 0, GAME_CONFIG.ARENA_WIDTH, GAME_CONFIG.ARENA_HEIGHT, 0x1a1a1a);
      bg.setOrigin(0, 0);
      
      // Create grid
      const grid = this.add.grid(
        0, 0,
        GAME_CONFIG.ARENA_WIDTH,
        GAME_CONFIG.ARENA_HEIGHT,
        100, 100,
        0x222222, 0.3
      );
      grid.setOrigin(0, 0);
      
      // Initialize walls group
      this.walls = this.add.group();
      
      // Create walls
      if (WALLS && WALLS.length > 0) {
        WALLS.forEach(wall => {
          const rect = this.add.rectangle(wall.x, wall.y, wall.width, wall.height, 0x444444);
          rect.setOrigin(0, 0);
          this.walls?.add(rect);
        });
      }
      
      // Set up keyboard controls
      if (this.input && this.input.keyboard) {
        this.keys = {
          w: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
          a: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
          s: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
          d: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
          space: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
        };
      }
      
      // Set up mouse input
      this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
        if (pointer.leftButtonDown()) {
          this.shooting = true;
        }
      });
      
      this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
        if (!pointer.leftButtonDown()) {
          this.shooting = false;
        }
      });
      
      // Set up Colyseus state change listeners
      if (this.room) {
        // Listen for state changes
        this.room.state.players.onAdd = (player: ServerPlayer, key: string) => {
          const isLocalPlayer = key === this.localPlayerId;
          const tank = this.createTank({
            id: key,
            x: player.x,
            y: player.y,
            isLocalPlayer
          });
          this.tanks.set(key, tank);
          
          // For local player, follow with camera
          if (isLocalPlayer) {
            this.cameras.main.startFollow(tank, true);
          }
          
          // Listen for player updates
          player.onChange = () => {
            if (tank) {
              tank.setPosition(player.x, player.y);
              
              // Update tank turret rotation
              const turret = tank.getAt(1) as Phaser.GameObjects.Rectangle;
              if (turret) {
                turret.setRotation(player.angle - Math.PI/2);
              }
            }
          };
        };
        
        // Listen for player removals
        this.room.state.players.onRemove = (player: ServerPlayer, key: string) => {
          const tank = this.tanks.get(key);
          if (tank) {
            tank.destroy();
            this.tanks.delete(key);
          }
        };
        
        // Listen for bullet additions
        this.room.state.bullets.onAdd = (bullet: ServerBullet, key: string) => {
          const bulletObj = this.createBullet({
            id: key,
            x: bullet.x,
            y: bullet.y
          });
          this.bullets.set(key, bulletObj);
          
          // Listen for bullet updates
          bullet.onChange = () => {
            if (bulletObj) {
              bulletObj.setPosition(bullet.x, bullet.y);
            }
          };
        };
        
        // Listen for bullet removals
        this.room.state.bullets.onRemove = (bullet: ServerBullet, key: string) => {
          const bulletObj = this.bullets.get(key);
          if (bulletObj) {
            bulletObj.destroy();
            this.bullets.delete(key);
          }
        };
      } else {
        console.error('Colyseus room not available in create');
      }
      
      this.isInitialized = true;
      console.log('MainScene create completed');
    } catch (error) {
      console.error('Error in MainScene create:', error);
    }
  }

  private createTank(player: { id: string, x: number, y: number, isLocalPlayer: boolean }): Phaser.GameObjects.Container {
    try {
      const container = this.add.container(player.x, player.y);
      
      // Tank body
      const body = this.add.circle(0, 0, GAME_CONFIG.TANK_SIZE / 2, player.isLocalPlayer ? 0x00ff00 : 0xff0000);
      
      // Tank turret
      const turret = this.add.rectangle(0, 0, 5, 20, 0x00ffff);
      turret.setOrigin(0.5, 1);
      
      container.add([body, turret]);
      return container;
    } catch (error) {
      console.error('Error creating tank:', error);
      return this.add.container(0, 0);
    }
  }
  
  private createBullet(bullet: { id: string, x: number, y: number }): Phaser.GameObjects.Container {
    try {
      const container = this.add.container(bullet.x, bullet.y);
      const body = this.add.circle(0, 0, GAME_CONFIG.BULLET_SIZE / 2, 0xffff00);
      container.add(body);
      return container;
    } catch (error) {
      console.error('Error creating bullet:', error);
      return this.add.container(0, 0);
    }
  }

  update(time: number, delta: number) {
    try {
      // Only send input at throttled rate
      if (time - this.lastInputTime < this.inputThrottle) {
        return;
      }
      
      this.lastInputTime = time;
      
      // Send input to server via Colyseus
      if (this.room && this.localPlayerId && !this.isUpdating) {
        const localTank = this.tanks.get(this.localPlayerId);
        if (!localTank) return;
        
        // Get mouse position
        const pointer = this.input.activePointer;
        const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
        
        // Calculate angle
        const dx = worldPoint.x - localTank.x;
        const dy = worldPoint.y - localTank.y;
        const angle = Math.atan2(dy, dx);
        
        // Create input state
        const input: PlayerInput = {
          up: this.keys.w?.isDown ?? false,
          down: this.keys.s?.isDown ?? false,
          left: this.keys.a?.isDown ?? false,
          right: this.keys.d?.isDown ?? false,
          angle,
          shooting: this.shooting || (this.keys.space?.isDown ?? false)
        };
        
        // Send to Colyseus room
        this.room.send("input", input);
      }
    } catch (error) {
      console.error('Error in update:', error);
    }
  }
} 