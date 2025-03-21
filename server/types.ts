import { Schema, type } from "@colyseus/schema";
import { PlayerInput } from "../shared/src/types.js";

export class Player extends Schema {
  @type("string") id: string;
  @type("number") x: number = 0;
  @type("number") y: number = 0;
  @type("number") angle: number = 0;
  @type("number") vx: number = 0;
  @type("number") vy: number = 0;
  @type("number") lastShot: number = 0;
  
  // Input state (not synced)
  input: PlayerInput;
  
  constructor(id: string, x: number, y: number) {
    super();
    this.id = id;
    this.x = x;
    this.y = y;
    this.input = {
      up: false,
      down: false,
      left: false,
      right: false,
      angle: 0,
      shooting: false
    };
  }
}

export class Bullet extends Schema {
  @type("string") id: string;
  @type("string") playerId: string;
  @type("number") x: number = 0;
  @type("number") y: number = 0;
  @type("number") vx: number = 0;
  @type("number") vy: number = 0;
  
  constructor(id: string, playerId: string, x: number, y: number, vx: number, vy: number) {
    super();
    this.id = id;
    this.playerId = playerId;
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
  }
}

export class TankGameState extends Schema {
  @type({ map: Player }) players = new Map<string, Player>();
  @type({ map: Bullet }) bullets = new Map<string, Bullet>();
  bulletIdCounter: number = 0;
} 