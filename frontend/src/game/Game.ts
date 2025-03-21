import Phaser from 'phaser';
import { MainScene } from './MainScene';
import { Room } from 'colyseus.js';

// Simple GameScene for single player mode
class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }
  
  create() {
    this.add.text(400, 300, 'Single player mode', {
      color: '#ffffff',
      fontSize: '20px'
    }).setOrigin(0.5);
  }
}

export class Game extends Phaser.Game {
  constructor(containerId: string, options?: { multiplayer?: boolean, room?: Room, localPlayerId?: string }) {
    const { multiplayer = false, room, localPlayerId } = options || {};
    
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: containerId,
      width: 1900,
      height: 1060,
      backgroundColor: '#1a1a1a',
      physics: {
        default: 'arcade',
        arcade: {
          debug: false,
          gravity: { x: 0, y: 0 }
        }
      },
      scene: []
    };

    super(config);
    
    // Add scenes after game initialization
    if (multiplayer) {
      const mainScene = new MainScene();
      this.scene.add('MainScene', mainScene, true);
      
      // Pass room and playerId to the scene
      mainScene.room = room;
      mainScene.localPlayerId = localPlayerId;
    } else {
      this.scene.add('GameScene', GameScene, true);
    }
    
    console.log('Phaser game initialized with:', {
      containerId,
      multiplayer,
      hasRoom: !!room,
      localPlayerId
    });
  }
} 