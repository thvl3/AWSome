import { GameState, Tank, GAME_CONFIG } from '@awsome-tank-shooter/shared';

interface InterpolatedTank extends Tank {
  targetX: number;
  targetY: number;
  targetAngle: number;
  velocityX: number;
  velocityY: number;
  lastUpdateTime: number;
  previousX: number;
  previousY: number;
}

interface InterpolatedGameState extends GameState {
  players: InterpolatedTank[];
}

export class GameStateManager {
  private currentState: InterpolatedGameState | null = null;
  private interpolatedState: InterpolatedGameState | null = null;
  private lastUpdateTime = 0;
  private readonly interpolationDelay = GAME_CONFIG.CLIENT_INTERPOLATION_DELAY;
  private readonly interpolationSpeed = 0.25; // Reduced for smoother transitions
  private readonly velocitySmoothing = 0.4; // Velocity smoothing factor

  public updateState(newState: GameState) {
    const now = Date.now();
    
    if (!this.currentState) {
      this.currentState = this.initializeInterpolatedState(newState, now);
      this.interpolatedState = this.initializeInterpolatedState(newState, now);
      this.lastUpdateTime = now;
      return;
    }

    // Update current state and set new target positions
    this.currentState = {
      ...newState,
      players: newState.players.map(player => {
        const currentPlayer = this.getCurrentInterpolatedPlayer(player.id);
        const dt = currentPlayer ? Math.max((now - currentPlayer.lastUpdateTime) / 1000, 0.001) : 0.016;

        // Calculate new velocities with smoothing
        const newVelocityX = currentPlayer ? (player.x - currentPlayer.x) / dt : 0;
        const newVelocityY = currentPlayer ? (player.y - currentPlayer.y) / dt : 0;

        const smoothedVelocityX = currentPlayer 
          ? currentPlayer.velocityX * (1 - this.velocitySmoothing) + newVelocityX * this.velocitySmoothing
          : newVelocityX;
        const smoothedVelocityY = currentPlayer 
          ? currentPlayer.velocityY * (1 - this.velocitySmoothing) + newVelocityY * this.velocitySmoothing
          : newVelocityY;

        return {
          ...player,
          targetX: player.x,
          targetY: player.y,
          targetAngle: player.angle,
          velocityX: smoothedVelocityX,
          velocityY: smoothedVelocityY,
          x: currentPlayer ? currentPlayer.x : player.x,
          y: currentPlayer ? currentPlayer.y : player.y,
          angle: currentPlayer ? currentPlayer.angle : player.angle,
          lastUpdateTime: now,
          previousX: currentPlayer ? currentPlayer.x : player.x,
          previousY: currentPlayer ? currentPlayer.y : player.y,
        } as InterpolatedTank;
      }),
    };

    this.lastUpdateTime = now;
  }

  public getInterpolatedState(): GameState {
    if (!this.currentState || !this.interpolatedState) {
      return this.currentState || { 
        players: [], 
        bullets: [],
        walls: [],
        scores: {}
      };
    }

    const now = Date.now();
    const dt = Math.min((now - this.lastUpdateTime) / this.interpolationDelay, 1);

    // Update interpolated positions with smoothed velocity-based prediction
    this.interpolatedState = {
      ...this.currentState,
      players: this.currentState.players.map(player => {
        const interpolatedPlayer = this.getCurrentInterpolatedPlayer(player.id);
        if (!interpolatedPlayer) return player;

        const timeSinceLastUpdate = Math.min((now - interpolatedPlayer.lastUpdateTime) / 1000, 0.1);
        
        // Predict position based on smoothed velocity
        const predictedX = interpolatedPlayer.x + interpolatedPlayer.velocityX * timeSinceLastUpdate;
        const predictedY = interpolatedPlayer.y + interpolatedPlayer.velocityY * timeSinceLastUpdate;

        // Calculate the maximum allowed movement distance
        const maxMovement = GAME_CONFIG.TANK_SPEED * timeSinceLastUpdate * 1.5;
        
        // Smoothly interpolate between current and predicted positions with movement limiting
        const dx = player.targetX - predictedX;
        const dy = player.targetY - predictedY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        const limitedDx = distance > maxMovement ? (dx / distance) * maxMovement : dx;
        const limitedDy = distance > maxMovement ? (dy / distance) * maxMovement : dy;
        
        const da = this.shortestAngleDifference(interpolatedPlayer.angle, player.targetAngle);

        return {
          ...player,
          x: predictedX + limitedDx * this.interpolationSpeed,
          y: predictedY + limitedDy * this.interpolationSpeed,
          angle: interpolatedPlayer.angle + da * this.interpolationSpeed,
          targetX: player.targetX,
          targetY: player.targetY,
          targetAngle: player.targetAngle,
          velocityX: interpolatedPlayer.velocityX,
          velocityY: interpolatedPlayer.velocityY,
          lastUpdateTime: interpolatedPlayer.lastUpdateTime,
          previousX: interpolatedPlayer.x,
          previousY: interpolatedPlayer.y,
        } as InterpolatedTank;
      }),
    };

    return this.interpolatedState;
  }

  private getCurrentInterpolatedPlayer(id: string): InterpolatedTank | undefined {
    return this.interpolatedState?.players.find(p => p.id === id) as InterpolatedTank;
  }

  private initializeInterpolatedState(state: GameState, now: number): InterpolatedGameState {
    return {
      ...state,
      players: state.players.map(player => ({
        ...player,
        targetX: player.x,
        targetY: player.y,
        targetAngle: player.angle,
        velocityX: 0,
        velocityY: 0,
        lastUpdateTime: now,
        previousX: player.x,
        previousY: player.y,
      } as InterpolatedTank)),
    };
  }

  private shortestAngleDifference(current: number, target: number): number {
    let diff = target - current;
    while (diff > Math.PI) diff -= 2 * Math.PI;
    while (diff < -Math.PI) diff -= 2 * Math.PI;
    return diff;
  }
} 