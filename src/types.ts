// === Neon Pac VR -- Types & Constants ===

export const CELL_SIZE = 0.12;
export const WALL_HEIGHT = 0.06;
export const MAZE_OFFSET_Y = 0.5; // maze sits at this Y height

export const PACMAN_SPEED = 3.0; // cells per second
export const GHOST_SPEED_BASE = 2.2;
export const GHOST_FRIGHTENED_SPEED = 1.2;
export const GHOST_RETURNING_SPEED = 5.0;
export const POWER_PELLET_DURATION = 7; // seconds
export const INITIAL_LIVES = 3;
export const READY_DURATION = 2.0;
export const DYING_DURATION = 1.5;
export const LEVEL_COMPLETE_DURATION = 2.0;

export const DOT_SCORE = 10;
export const POWER_PELLET_SCORE = 50;
export const GHOST_EAT_SCORES = [200, 400, 800, 1600];
export const FRUIT_SCORE = 100;

export enum CellType {
  WALL = '#',
  DOT = '.',
  POWER = 'o',
  EMPTY = ' ',
  GHOST_HOUSE = 'G',
}

export enum Direction {
  NONE = -1,
  UP = 0,
  RIGHT = 1,
  DOWN = 2,
  LEFT = 3,
}

export enum GhostName {
  BLINKY = 'blinky',
  PINKY = 'pinky',
  INKY = 'inky',
  CLYDE = 'clyde',
}

export enum GhostMode {
  SCATTER = 'scatter',
  CHASE = 'chase',
  FRIGHTENED = 'frightened',
  EATEN = 'eaten',
  HOUSE = 'house',
}

export enum GameState {
  MENU = 'menu',
  READY = 'ready',
  PLAYING = 'playing',
  DYING = 'dying',
  GAME_OVER = 'gameover',
  LEVEL_COMPLETE = 'levelcomplete',
  PAUSED = 'paused',
  WIN = 'win',
}

export interface GridPos {
  col: number;
  row: number;
}

export const DIR_VECTORS: Record<number, GridPos> = {
  [Direction.UP]: { col: 0, row: -1 },
  [Direction.RIGHT]: { col: 1, row: 0 },
  [Direction.DOWN]: { col: 0, row: 1 },
  [Direction.LEFT]: { col: -1, row: 0 },
};

export const OPPOSITE_DIR: Record<number, Direction> = {
  [Direction.UP]: Direction.DOWN,
  [Direction.RIGHT]: Direction.LEFT,
  [Direction.DOWN]: Direction.UP,
  [Direction.LEFT]: Direction.RIGHT,
};

export const GHOST_COLORS: Record<GhostName, number> = {
  [GhostName.BLINKY]: 0xff0000,
  [GhostName.PINKY]: 0xff69b4,
  [GhostName.INKY]: 0x00ffff,
  [GhostName.CLYDE]: 0xffa500,
};

export const FRIGHTENED_COLOR = 0x2222ff;
export const EATEN_COLOR = 0xffffff;
