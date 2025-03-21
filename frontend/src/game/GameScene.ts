import Phaser from 'phaser';

export class GameScene extends Phaser.Scene {
    private tank?: Phaser.GameObjects.Container;
    private turret?: Phaser.GameObjects.Rectangle;
    private collisionCircle?: Phaser.GameObjects.Graphics;
    private crosshair?: Phaser.GameObjects.Graphics;
    private keys?: { [key: string]: Phaser.Input.Keyboard.Key };
    private debugText?: Phaser.GameObjects.Text;
    private readonly TANK_RADIUS = 20;
    private readonly CROSSHAIR_SIZE = 8;
    private projectiles?: Phaser.GameObjects.Group;
    private obstacles?: Phaser.GameObjects.Group;
    private readonly BULLET_SPEED = 400;
    private readonly BULLET_RADIUS = 4;
    private lastFired: number = 0;
    private readonly FIRE_RATE = 250; // Minimum time between shots in ms

    constructor() {
        super({ 
            key: 'GameScene',
            physics: {
                default: 'arcade',
                arcade: {
                    debug: false
                }
            }
        });
    }

    preload() {
        // Create loading text
        const loadingText = this.add.text(400, 300, 'Loading...', {
            fontSize: '32px',
            color: '#fff'
        }).setOrigin(0.5);

        // When loading completes, remove the text
        this.load.on('complete', () => loadingText.destroy());
    }

    create() {
        // Set background color
        this.cameras.main.setBackgroundColor('#1a1a1a');

        // Add background grid
        const grid = this.add.grid(
            950, 530,           // x, y (center of screen)
            1900, 1060,        // width, height
            50, 50,            // cell width, height
            0x333333, 1,       // fill
            0x000000, 0.1      // border
        );

        // Initialize groups
        this.projectiles = this.add.group();
        this.obstacles = this.add.group();

        // Create tank container at center of screen
        this.tank = this.add.container(950, 530);
        
        // Tank body (red circle)
        const body = this.add.circle(0, 0, this.TANK_RADIUS, 0xff0000);
        
        // Tank turret (green rectangle)
        this.turret = this.add.rectangle(0, 0, 5, 30, 0x00ff00);
        this.turret.setOrigin(0.5, -0.5);
        
        this.tank.add([body, this.turret]);

        // Enable physics for tank
        this.physics.world.enable(this.tank);
        const tankBody = this.tank.body as Phaser.Physics.Arcade.Body;
        tankBody.setCircle(this.TANK_RADIUS);
        tankBody.setCollideWorldBounds(true);

        // Create obstacles
        this.createObstacles();

        // Create debug collision circle
        this.collisionCircle = this.add.graphics();
        this.collisionCircle.lineStyle(1, 0x00ffff);
        this.collisionCircle.strokeCircle(0, 0, this.TANK_RADIUS);

        // Create crosshair
        this.crosshair = this.add.graphics();
        this.crosshair.lineStyle(1, 0xffff00);
        this.crosshair.setDepth(1000);

        // Hide system cursor
        this.input.setDefaultCursor('none');

        // Set up keyboard controls
        this.keys = {
            w: this.input.keyboard.addKey('W'),
            s: this.input.keyboard.addKey('S'),
            a: this.input.keyboard.addKey('A'),
            d: this.input.keyboard.addKey('D')
        };

        // Add debug text
        this.debugText = this.add.text(10, 10, '', {
            color: '#ffffff',
            fontSize: '14px',
            backgroundColor: '#000000'
        });

        // Make turret rotate to follow pointer
        this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
            if (this.tank && this.turret) {
                const dx = pointer.x - this.tank.x;
                const dy = pointer.y - this.tank.y;
                const angle = Math.atan2(dy, dx) - Math.PI/2;
                this.turret.setRotation(angle);

                // Update crosshair position
                if (this.crosshair) {
                    this.crosshair.clear();
                    this.crosshair.lineStyle(1, 0xffff00);
                    
                    // Draw crosshair
                    const size = this.CROSSHAIR_SIZE;
                    this.crosshair.beginPath();
                    this.crosshair.moveTo(pointer.x - size, pointer.y);
                    this.crosshair.lineTo(pointer.x + size, pointer.y);
                    this.crosshair.moveTo(pointer.x, pointer.y - size);
                    this.crosshair.lineTo(pointer.x, pointer.y + size);
                    this.crosshair.strokeCircle(pointer.x, pointer.y, size/2);
                    this.crosshair.closePath();
                    this.crosshair.strokePath();
                }
            }
        });

        // Add firing controls
        this.input.keyboard.addKey('SPACE').on('down', () => this.fireBullet());
        this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            if (pointer.leftButtonDown()) {
                this.fireBullet();
            }
        });
    }

    private createObstacles() {
        if (!this.obstacles) return;

        const obstacleConfigs = [
            { x: 300, y: 300, width: 100, height: 100 },
            { x: 800, y: 500, width: 200, height: 50 },
            { x: 1500, y: 700, width: 50, height: 200 },
            { x: 1200, y: 200, width: 150, height: 150 },
            { x: 500, y: 800, width: 120, height: 120 }
        ];

        obstacleConfigs.forEach(config => {
            const obstacle = this.add.rectangle(config.x, config.y, config.width, config.height, 0x666666);
            obstacle.setStrokeStyle(2, 0x888888);
            this.obstacles?.add(obstacle);
            
            this.physics.world.enable(obstacle);
            const body = obstacle.body as Phaser.Physics.Arcade.Body;
            body.setImmovable(true);
            body.moves = false;
            body.setSize(config.width, config.height, true);
            body.setOffset(22, 22);
        });
    }

    private fireBullet() {
        if (!this.tank || !this.turret || !this.projectiles || !this.obstacles) return;

        const currentTime = this.time.now;
        if (currentTime - this.lastFired < this.FIRE_RATE) return;

        this.lastFired = currentTime;

        // Calculate bullet spawn position at turret tip
        const turretAngle = this.turret.rotation + Math.PI/2;
        const spawnOffset = 30; // Length of turret
        const spawnX = this.tank.x + Math.cos(turretAngle) * spawnOffset;
        const spawnY = this.tank.y + Math.sin(turretAngle) * spawnOffset;

        // Create bullet
        const bullet = this.add.circle(spawnX, spawnY, this.BULLET_RADIUS, 0xffff00);
        this.projectiles.add(bullet);

        // Set bullet velocity
        const velocity = this.physics!.velocityFromAngle(
            Phaser.Math.RadToDeg(turretAngle),
            this.BULLET_SPEED
        );

        // Enable physics for the bullet
        this.physics.world.enable(bullet);
        const bulletBody = (bullet.body as Phaser.Physics.Arcade.Body);
        if (bulletBody) {
            bulletBody.setVelocity(velocity.x, velocity.y);
            bulletBody.setCircle(this.BULLET_RADIUS);
            bulletBody.setOffset(22,22);
            // Add collision between bullet and obstacles
            this.physics.add.collider(bullet, this.obstacles, () => {
                bullet.destroy();
            });
        }

        // Destroy bullet after 2 seconds if it hasn't hit anything
        this.time.delayedCall(2000, () => {
            if (bullet && !bullet.active) {
                bullet.destroy();
            }
        });
    }

    update() {
        if (!this.tank || !this.keys) return;

        const speed = 3;
        let dx = 0;
        let dy = 0;

        if (this.keys.w?.isDown) dy -= 1;
        if (this.keys.s?.isDown) dy += 1;
        if (this.keys.a?.isDown) dx -= 1;
        if (this.keys.d?.isDown) dx += 1;

        if (dx !== 0 && dy !== 0) {
            const length = Math.sqrt(dx * dx + dy * dy);
            dx /= length;
            dy /= length;
        }

        if (this.tank.body) {
            const tankBody = this.tank.body as Phaser.Physics.Arcade.Body;
            tankBody.setVelocity(dx * speed * 60, dy * speed * 60);
        }

        // Handle collisions
        if (this.obstacles) {
            this.physics.collide(this.tank, this.obstacles);
        }

        // Update collision circle position
        if (this.collisionCircle && this.tank) {
            this.collisionCircle.clear();
            this.collisionCircle.lineStyle(1, 0x00ffff);
            this.collisionCircle.strokeCircle(this.tank.x, this.tank.y, this.TANK_RADIUS);
        }

        // Update debug text
        if (this.debugText && this.tank) {
            this.debugText.setText([
                `FPS: ${this.game.loop.actualFps.toFixed(1)}`,
                `Tank Position: ${Math.floor(this.tank.x)}, ${Math.floor(this.tank.y)}`,
                `Tank Angle: ${Math.floor(this.turret?.rotation || 0 * (180/Math.PI))}°`
            ].join('\n'));
        }
    }
} 