// This is a wrapper module to handle imports from the shared package
import * as sharedModule from '../../../shared/dist/index.js';

// Re-export everything from the shared package
export const {
  GAME_CONFIG,
  WALLS,
  // Add other exports as needed
} = sharedModule; 