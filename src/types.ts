// === Neon Pac VR -- Types & Constants (expanded) ===

export const CELL_SIZE = 0.12;
export const WALL_HEIGHT = 0.06;
export const MAZE_OFFSET_Y = 0.5;

export const PACMAN_SPEED = 3.0;
export const GHOST_SPEED_BASE = 2.2;
export const GHOST_FRIGHTENED_SPEED = 1.2;
export const GHOST_RETURNING_SPEED = 5.0;
export const POWER_PELLET_DURATION = 7;
export const INITIAL_LIVES = 3;
export const READY_DURATION = 2.0;
export const DYING_DURATION = 1.5;
export const LEVEL_COMPLETE_DURATION = 2.0;

export const DOT_SCORE = 10;
export const POWER_PELLET_SCORE = 50;
export const GHOST_EAT_SCORES = [200, 400, 800, 1600];
export const FRUIT_SCORE = 100;
export const EXTRA_LIFE_SCORE = 10000; // Extra life every 10K points

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
  MODE_SELECT = 'modeselect',
  READY = 'ready',
  PLAYING = 'playing',
  DYING = 'dying',
  GAME_OVER = 'gameover',
  LEVEL_COMPLETE = 'levelcomplete',
  PAUSED = 'paused',
  WIN = 'win',
}

export enum GameMode {
  CLASSIC = 'classic',
  SPEED = 'speed',
  DARK = 'dark',
  SURVIVAL = 'survival',
  MARATHON = 'marathon',
  ZEN = 'zen',
  DAILY = 'daily',
}

export enum Difficulty {
  EASY = 'easy',
  NORMAL = 'normal',
  HARD = 'hard',
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

// Fruit types by level
export enum FruitType {
  CHERRY = 'cherry',
  STRAWBERRY = 'strawberry',
  ORANGE = 'orange',
  APPLE = 'apple',
  MELON = 'melon',
  GALAXIAN = 'galaxian',
  BELL = 'bell',
  KEY = 'key',
}

export const FRUIT_BY_LEVEL: FruitType[] = [
  FruitType.CHERRY,      // level 1
  FruitType.STRAWBERRY,  // level 2
  FruitType.ORANGE,      // level 3-4
  FruitType.ORANGE,
  FruitType.APPLE,       // level 5-6
  FruitType.APPLE,
  FruitType.MELON,       // level 7-8
  FruitType.MELON,
  FruitType.GALAXIAN,    // level 9-10
  FruitType.GALAXIAN,
  FruitType.BELL,        // level 11-12
  FruitType.BELL,
  FruitType.KEY,         // level 13+
];

export const FRUIT_SCORES: Record<FruitType, number> = {
  [FruitType.CHERRY]: 100,
  [FruitType.STRAWBERRY]: 300,
  [FruitType.ORANGE]: 500,
  [FruitType.APPLE]: 700,
  [FruitType.MELON]: 1000,
  [FruitType.GALAXIAN]: 2000,
  [FruitType.BELL]: 3000,
  [FruitType.KEY]: 5000,
};

export const FRUIT_COLORS: Record<FruitType, number> = {
  [FruitType.CHERRY]: 0xff2222,
  [FruitType.STRAWBERRY]: 0xff4466,
  [FruitType.ORANGE]: 0xff8800,
  [FruitType.APPLE]: 0x44ff44,
  [FruitType.MELON]: 0x22ff88,
  [FruitType.GALAXIAN]: 0x8888ff,
  [FruitType.BELL]: 0xffff44,
  [FruitType.KEY]: 0xffaaff,
};

// Difficulty modifiers
export const DIFFICULTY_MODS: Record<Difficulty, {
  speedMult: number;
  ghostSpeedMult: number;
  frightDuration: number;
  lives: number;
  ghostReleaseMult: number;
}> = {
  [Difficulty.EASY]: {
    speedMult: 1.0,
    ghostSpeedMult: 0.8,
    frightDuration: 10,
    lives: 5,
    ghostReleaseMult: 1.5,
  },
  [Difficulty.NORMAL]: {
    speedMult: 1.0,
    ghostSpeedMult: 1.0,
    frightDuration: 7,
    lives: 3,
    ghostReleaseMult: 1.0,
  },
  [Difficulty.HARD]: {
    speedMult: 1.0,
    ghostSpeedMult: 1.3,
    frightDuration: 4,
    lives: 2,
    ghostReleaseMult: 0.6,
  },
};

// Game mode configs
export const MODE_CONFIGS: Record<GameMode, {
  label: string;
  description: string;
  speedMult: number;
  darkMode: boolean;
  survivalMode: boolean;
  infiniteLives: boolean;
}> = {
  [GameMode.CLASSIC]: {
    label: 'Classic',
    description: 'The original Pac-Man experience',
    speedMult: 1.0,
    darkMode: false,
    survivalMode: false,
    infiniteLives: false,
  },
  [GameMode.SPEED]: {
    label: 'Speed Run',
    description: 'Everything moves faster!',
    speedMult: 1.5,
    darkMode: false,
    survivalMode: false,
    infiniteLives: false,
  },
  [GameMode.DARK]: {
    label: 'Dark Mode',
    description: 'Limited visibility around Pac-Man',
    speedMult: 1.0,
    darkMode: true,
    survivalMode: false,
    infiniteLives: false,
  },
  [GameMode.SURVIVAL]: {
    label: 'Survival',
    description: 'One life. How far can you go?',
    speedMult: 1.1,
    darkMode: false,
    survivalMode: true,
    infiniteLives: false,
  },
  [GameMode.MARATHON]: {
    label: 'Marathon',
    description: 'Ghosts get faster every level',
    speedMult: 1.0,
    darkMode: false,
    survivalMode: false,
    infiniteLives: false,
  },
  [GameMode.ZEN]: {
    label: 'Zen',
    description: 'No ghosts. Just dots.',
    speedMult: 0.8,
    darkMode: false,
    survivalMode: false,
    infiniteLives: true,
  },
  [GameMode.DAILY]: {
    label: 'Daily Challenge',
    description: 'Unique challenge every day',
    speedMult: 1.2,
    darkMode: false,
    survivalMode: false,
    infiniteLives: false,
  },
};

// Power-up types
export enum PowerUpType {
  SPEED_BOOST = 'speed_boost',
  GHOST_FREEZE = 'ghost_freeze',
  SCORE_DOUBLER = 'score_doubler',
  SHIELD = 'shield',
}

export const POWERUP_COLORS: Record<PowerUpType, number> = {
  [PowerUpType.SPEED_BOOST]: 0x00ff88,
  [PowerUpType.GHOST_FREEZE]: 0x44ccff,
  [PowerUpType.SCORE_DOUBLER]: 0xffdd00,
  [PowerUpType.SHIELD]: 0xff44ff,
};

export const POWERUP_LABELS: Record<PowerUpType, string> = {
  [PowerUpType.SPEED_BOOST]: 'SPEED',
  [PowerUpType.GHOST_FREEZE]: 'FREEZE',
  [PowerUpType.SCORE_DOUBLER]: '2x PTS',
  [PowerUpType.SHIELD]: 'SHIELD',
};

export const POWERUP_DURATIONS: Record<PowerUpType, number> = {
  [PowerUpType.SPEED_BOOST]: 5,
  [PowerUpType.GHOST_FREEZE]: 3,
  [PowerUpType.SCORE_DOUBLER]: 8,
  [PowerUpType.SHIELD]: 0, // single-use, no timer
};

// Maze themes
export enum MazeTheme {
  NEON_BLUE = 'neon_blue',
  CYBER_RED = 'cyber_red',
  MATRIX_GREEN = 'matrix_green',
  VAPOR_PURPLE = 'vapor_purple',
  SUNSET_ORANGE = 'sunset_orange',
}

export const THEME_COLORS: Record<MazeTheme, {
  wall: number;
  wallEmissive: number;
  edge: number;
  dot: number;
  floor: number;
  fog: number;
  accent: number;
}> = {
  [MazeTheme.NEON_BLUE]: {
    wall: 0x0066ff, wallEmissive: 0x0044cc, edge: 0x00aaff,
    dot: 0xffff88, floor: 0x050510, fog: 0x000811, accent: 0x0088ff,
  },
  [MazeTheme.CYBER_RED]: {
    wall: 0xcc0033, wallEmissive: 0x990022, edge: 0xff3366,
    dot: 0xffcc88, floor: 0x100505, fog: 0x0a0205, accent: 0xff4466,
  },
  [MazeTheme.MATRIX_GREEN]: {
    wall: 0x00cc44, wallEmissive: 0x009933, edge: 0x44ff88,
    dot: 0xccffaa, floor: 0x051005, fog: 0x020804, accent: 0x44ff66,
  },
  [MazeTheme.VAPOR_PURPLE]: {
    wall: 0x8800cc, wallEmissive: 0x660099, edge: 0xaa44ff,
    dot: 0xffaaff, floor: 0x0a0510, fog: 0x050210, accent: 0xcc66ff,
  },
  [MazeTheme.SUNSET_ORANGE]: {
    wall: 0xcc6600, wallEmissive: 0x994400, edge: 0xffaa44,
    dot: 0xffffaa, floor: 0x100a05, fog: 0x0a0502, accent: 0xff8844,
  },
};
