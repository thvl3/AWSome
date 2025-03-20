import { create } from 'zustand';
import { GameState } from '@awsome-tank-shooter/shared';

interface GameStore {
  isPlaying: boolean;
  gameState: GameState | null;
  localPlayerId: string | null;
  startGame: () => void;
  endGame: () => void;
  setGameState: (state: GameState) => void;
  setLocalPlayerId: (id: string) => void;
}

export const useGameStore = create<GameStore>((set) => ({
  isPlaying: false,
  gameState: null,
  localPlayerId: null,
  startGame: () => set({ isPlaying: true }),
  endGame: () => set({ isPlaying: false, gameState: null, localPlayerId: null }),
  setGameState: (state) => set({ gameState: state }),
  setLocalPlayerId: (id) => set({ localPlayerId: id }),
})); 