import { create } from 'zustand';
import { GameState } from '@awsome-tank-shooter/shared';

interface GameStore {
  gameState: GameState | null;
  localPlayerId: string | null;
  isPlaying: boolean;
  setGameState: (state: GameState) => void;
  setLocalPlayerId: (id: string) => void;
  setIsPlaying: (playing: boolean) => void;
  reset: () => void;
}

const initialState = {
  gameState: null,
  localPlayerId: null,
  isPlaying: false
};

export const useGameStore = create<GameStore>((set, get) => ({
  ...initialState,

  setGameState: (state) => {
    console.log('Setting game state:', state);
    set({ gameState: state });
  },

  setLocalPlayerId: (id) => {
    console.log('Setting local player ID:', id);
    set({ localPlayerId: id });
  },

  setIsPlaying: (playing) => {
    console.log('Setting isPlaying:', playing);
    const currentState = get();
    console.log('Current state:', {
      isPlaying: currentState.isPlaying,
      localPlayerId: currentState.localPlayerId,
      hasGameState: !!currentState.gameState
    });
    set({ isPlaying: playing });
  },

  reset: () => {
    console.log('Resetting game store');
    set(initialState);
  }
})); 