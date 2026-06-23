// === Neon Pac VR -- Game State Manager (v3: multi-layout, skins, leaderboard) ===

import { Mesh, Group, MeshStandardMaterial, SphereGeometry, Color, MeshBasicMaterial, PointLight } from '@iwsdk/core';
import {
  GameState,
  Direction,
  DIR_VECTORS,
  GhostMode,
  GhostName,
  PACMAN_SPEED,
  GHOST_SPEED_BASE,
  GHOST_FRIGHTENED_SPEED,
  GHOST_RETURNING_SPEED,
  POWER_PELLET_DURATION,
  INITIAL_LIVES,
  READY_DURATION,
  DYING_DURATION,
  LEVEL_COMPLETE_DURATION,
  DOT_SCORE,
  POWER_PELLET_SCORE,
  GHOST_EAT_SCORES,
  OPPOSITE_DIR,
  FRIGHTENED_COLOR,
  EATEN_COLOR,
  GameMode,
  Difficulty,
  DIFFICULTY_MODS,
  MODE_CONFIGS,
  FruitType,
  FRUIT_BY_LEVEL,
  FRUIT_SCORES,
  FRUIT_COLORS,
  CELL_SIZE,
  EXTRA_LIFE_SCORE,
  type GridPos,
} from './types';
import {
  PACMAN_START,
  BLINKY_START,
  GHOST_HOUSE_EXIT,
  MAZE_COLS,
  MAZE_ROWS,
  DotGrid,
  isWalkable,
  canMove,
  getAvailableDirections,
  gridToWorld,
  setMazeLayout,
  PacSkin,
  PAC_SKIN_COLORS,
} from './maze';
import { getMazeForLevel, MAZE_NAMES, ALL_MAZES } from './maze-layouts';
import { AudioManager } from './audio-manager';
import { AchievementManager } from './achievements';
import { StatsManager } from './stats-manager';
import { LeaderboardManager } from './leaderboard';

interface Ghost {
  name: GhostName;
  col: number;
  row: number;
  targetCol: number;
  targetRow: number;
  dir: Direction;
  nextDir: Direction;
  mode: GhostMode;
  moveProgress: number;
  startCol: number;
  startRow: number;
  releaseTimer: number;
  releaseDelay: number;
  mesh: Mesh;
  originalColor: number;
}

interface FruitEntity {
  type: FruitType;
  col: number;
  row: number;
  mesh: Mesh;
  timer: number;
  active: boolean;
}

export class GameManager {
  // State
  state: GameState = GameState.MENU;
  score = 0;
  highScore = 0;
  lives = INITIAL_LIVES;
  level = 1;

  // Mode & difficulty
  gameMode: GameMode = GameMode.CLASSIC;
  difficulty: Difficulty = Difficulty.NORMAL;

  // Pac-Man skin
  pacSkin: PacSkin = PacSkin.CLASSIC;

  // Pac-Man
  pacCol: number;
  pacRow: number;
  pacDir = Direction.NONE;
  pacNextDir = Direction.NONE;
  pacMoveProgress = 0;
  pacMesh: Mesh;

  // Ghosts
  ghosts: Ghost[] = [];
  ghostEyes: Array<{ leftWhite: Mesh; rightWhite: Mesh; leftPupil: Mesh; rightPupil: Mesh }> = [];

  // Dots
  dotGrid: DotGrid;
  dotMeshes: Map<string, Mesh>;

  // Power pellet
  frightTimer = 0;
  ghostsEatenThisPower = 0;

  // Timers
  stateTimer = 0;
  wakaTimer = 0;
  frightenedSoundTimer = 0;
  scatterChaseTimer = 0;
  scatterChaseCycle = 0;
  isScatterPhase = true;

  // Fruit
  fruit: FruitEntity | null = null;
  private fruitSpawnDots1 = 70;
  private fruitSpawnDots2 = 170;
  private fruitSpawned1 = false;
  private fruitSpawned2 = false;
  private mazeGroup: Group;

  // Dark mode light
  private darkLight: PointLight | null = null;
  private darkRadius = 1.2;

  // Extra life tracking
  private nextExtraLifeScore = EXTRA_LIFE_SCORE;

  // Maze layout name
  currentMazeName = 'Classic';

  // Achievement tracking per-game
  private levelStartLives = 0;
  private gameStartScore = 0;
  private quadKillsThisGame = 0;
  private levelsWithoutDeath = 0;
  private tunnelUsesThisGame = 0;
  private usedTunnelThisLevel = false;

  // Managers
  audio: AudioManager;
  achievements: AchievementManager;
  statsManager: StatsManager;
  leaderboard: LeaderboardManager;

  // Fright timer info for HUD display
  get frightTimerRemaining(): number { return this.frightTimer; }
  get frightTimerMax(): number {
    return DIFFICULTY_MODS[this.difficulty].frightDuration;
  }

  // Daily Challenge tracking
  private dailyChallengesCompleted = 0;
  private extraLivesThisGame = 0;
  private skinsUsed = new Set<string>();
  private themesUsed = new Set<string>();
  private difficultiesUsed = new Set<string>();
  private mazesVisited = new Set<string>();

  // Level flash callback
  onLevelFlash?: () => void;
  // Camera shake callback
  onCameraShake?: (intensity: number) => void;

  // Callbacks
  onScoreChange?: (score: number, highScore: number) => void;
  onLivesChange?: (lives: number) => void;
  onLevelChange?: (level: number) => void;
  onStateChange?: (state: GameState) => void;
  onFruitEaten?: (fruitType: FruitType, score: number) => void;
  onComboDisplay?: (text: string) => void;
  onExtraLife?: () => void;
  onMazeChange?: (mazeName: string) => void;
  onRebuildMaze?: () => void;

  constructor(
    pacMesh: Mesh,
    ghostMeshes: Mesh[],
    dotGrid: DotGrid,
    dotMeshes: Map<string, Mesh>,
    mazeGroup: Group,
    ghostEyes: Array<{ leftWhite: Mesh; rightWhite: Mesh; leftPupil: Mesh; rightPupil: Mesh }>,
  ) {
    this.pacMesh = pacMesh;
    this.dotGrid = dotGrid;
    this.dotMeshes = dotMeshes;
    this.mazeGroup = mazeGroup;
    this.ghostEyes = ghostEyes;
    this.pacCol = PACMAN_START.col;
    this.pacRow = PACMAN_START.row;
    this.audio = new AudioManager();
    this.achievements = new AchievementManager();
    this.statsManager = new StatsManager();
    this.leaderboard = new LeaderboardManager();

    // Load high score & skin
    try {
      const saved = localStorage.getItem('neon-pac-highscore');
      if (saved) this.highScore = parseInt(saved, 10);
      const savedSkin = localStorage.getItem('neon-pac-skin') as PacSkin | null;
      if (savedSkin && PAC_SKIN_COLORS[savedSkin]) this.pacSkin = savedSkin;
      const savedDaily = localStorage.getItem('neon-pac-daily-count');
      if (savedDaily) this.dailyChallengesCompleted = parseInt(savedDaily, 10);
      const savedSkins = localStorage.getItem('neon-pac-skins-used');
      if (savedSkins) this.skinsUsed = new Set(JSON.parse(savedSkins));
      const savedThemes = localStorage.getItem('neon-pac-themes-used');
      if (savedThemes) this.themesUsed = new Set(JSON.parse(savedThemes));
      const savedDiffs = localStorage.getItem('neon-pac-diffs-used');
      if (savedDiffs) this.difficultiesUsed = new Set(JSON.parse(savedDiffs));
    } catch { /* ignore */ }

    // Init ghosts
    const names = [GhostName.BLINKY, GhostName.PINKY, GhostName.INKY, GhostName.CLYDE];
    const startPositions: GridPos[] = [
      BLINKY_START,
      { col: 9, row: 10 },
      { col: 10, row: 10 },
      { col: 11, row: 10 },
    ];
    const delays = [0, 3, 6, 9];

    for (let i = 0; i < 4; i++) {
      this.ghosts.push({
        name: names[i],
        col: startPositions[i].col,
        row: startPositions[i].row,
        targetCol: 0,
        targetRow: 0,
        dir: Direction.LEFT,
        nextDir: Direction.LEFT,
        mode: i === 0 ? GhostMode.SCATTER : GhostMode.HOUSE,
        moveProgress: 0,
        startCol: startPositions[i].col,
        startRow: startPositions[i].row,
        releaseTimer: 0,
        releaseDelay: delays[i],
        mesh: ghostMeshes[i],
        originalColor: [0xff0000, 0xff69b4, 0x00ffff, 0xffa500][i],
      });
    }
  }

  setPacSkin(skin: PacSkin): void {
    this.pacSkin = skin;
    const colors = PAC_SKIN_COLORS[skin];
    const mat = this.pacMesh.material as MeshStandardMaterial;
    mat.color.setHex(colors.main);
    mat.emissive.setHex(colors.emissive);
    this.skinsUsed.add(skin);
    try {
      localStorage.setItem('neon-pac-skin', skin);
      localStorage.setItem('neon-pac-skins-used', JSON.stringify(Array.from(this.skinsUsed)));
    } catch { /* ignore */ }
    if (this.skinsUsed.size >= 5) this.achievements.unlock('all_skins_used');
  }

  trackThemeUsed(theme: string): void {
    this.themesUsed.add(theme);
    try { localStorage.setItem('neon-pac-themes-used', JSON.stringify(Array.from(this.themesUsed))); } catch { /* ignore */ }
    if (this.themesUsed.size >= 5) this.achievements.unlock('all_themes_used');
  }

  private getDailySeed(): number {
    const d = new Date();
    const dateStr = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    let hash = 0;
    for (let i = 0; i < dateStr.length; i++) {
      hash = ((hash << 5) - hash + dateStr.charCodeAt(i)) | 0;
    }
    return Math.abs(hash);
  }

  startGame(mode?: GameMode): void {
    if (mode !== undefined) this.gameMode = mode;
    const diffMod = DIFFICULTY_MODS[this.difficulty];
    const modeCfg = MODE_CONFIGS[this.gameMode];

    // Track difficulty used
    this.difficultiesUsed.add(this.difficulty);
    try { localStorage.setItem('neon-pac-diffs-used', JSON.stringify(Array.from(this.difficultiesUsed))); } catch { /* ignore */ }
    if (this.difficultiesUsed.size >= 3) this.achievements.unlock('all_difficulties');

    this.score = 0;
    this.gameStartScore = 0;
    this.lives = modeCfg.survivalMode ? 1 : diffMod.lives;
    this.level = 1;
    this.nextExtraLifeScore = EXTRA_LIFE_SCORE;
    this.extraLivesThisGame = 0;

    // Daily Challenge: use seeded maze selection
    if (this.gameMode === GameMode.DAILY) {
      const seed = this.getDailySeed();
      const mazeIdx = seed % ALL_MAZES.length;
      setMazeLayout(ALL_MAZES[mazeIdx]);
      this.currentMazeName = MAZE_NAMES[mazeIdx];
      // Daily has 2 lives and faster ghosts
      this.lives = 2;
    } else {
      // Set maze layout for level 1
      const maze = getMazeForLevel(this.level);
      setMazeLayout(maze);
      this.currentMazeName = MAZE_NAMES[(this.level - 1) % MAZE_NAMES.length];
    }

    this.dotGrid.reset();
    this.resetPositions();
    this.showAllDots();
    this.state = GameState.READY;
    this.stateTimer = READY_DURATION;
    this.audio.playGameStart();

    // Reset per-game tracking
    this.fruitSpawned1 = false;
    this.fruitSpawned2 = false;
    this.removeFruit();
    this.quadKillsThisGame = 0;
    this.levelsWithoutDeath = 0;
    this.tunnelUsesThisGame = 0;
    this.usedTunnelThisLevel = false;
    this.levelStartLives = this.lives;

    // Zen mode: hide ghosts
    if (this.gameMode === GameMode.ZEN) {
      for (let i = 0; i < this.ghosts.length; i++) {
        const g = this.ghosts[i];
        g.mesh.visible = false;
        g.mode = GhostMode.HOUSE;
        // Hide eyes
        if (this.ghostEyes[i]) {
          this.ghostEyes[i].leftWhite.visible = false;
          this.ghostEyes[i].rightWhite.visible = false;
        }
      }
    } else {
      for (let i = 0; i < this.ghosts.length; i++) {
        this.ghosts[i].mesh.visible = true;
        if (this.ghostEyes[i]) {
          this.ghostEyes[i].leftWhite.visible = true;
          this.ghostEyes[i].rightWhite.visible = true;
        }
      }
    }

    // Dark mode setup
    this.setupDarkMode(modeCfg.darkMode);

    // Stats
    this.statsManager.startGame(this.gameMode);

    this.onMazeChange?.(this.currentMazeName);
    this.notifyAll();
  }

  private setupDarkMode(enabled: boolean): void {
    if (enabled) {
      if (!this.darkLight) {
        this.darkLight = new PointLight(0xffffff, 3, this.darkRadius);
        this.mazeGroup.add(this.darkLight);
      }
      this.darkLight.visible = true;
    } else if (this.darkLight) {
      this.darkLight.visible = false;
    }
  }

  private notifyAll(): void {
    this.onScoreChange?.(this.score, this.highScore);
    this.onLivesChange?.(this.lives);
    this.onLevelChange?.(this.level);
    this.onStateChange?.(this.state);
  }

  private resetPositions(): void {
    this.pacCol = PACMAN_START.col;
    this.pacRow = PACMAN_START.row;
    this.pacDir = Direction.NONE;
    this.pacNextDir = Direction.NONE;
    this.pacMoveProgress = 0;

    const startPositions: GridPos[] = [
      BLINKY_START,
      { col: 9, row: 10 },
      { col: 10, row: 10 },
      { col: 11, row: 10 },
    ];
    const diffMod = DIFFICULTY_MODS[this.difficulty];
    const delays = [0, 3, 6, 9].map((d) => d * diffMod.ghostReleaseMult);

    for (let i = 0; i < this.ghosts.length; i++) {
      const g = this.ghosts[i];
      g.col = startPositions[i].col;
      g.row = startPositions[i].row;
      g.dir = Direction.LEFT;
      g.nextDir = Direction.LEFT;
      g.mode = i === 0 ? GhostMode.SCATTER : GhostMode.HOUSE;
      g.moveProgress = 0;
      g.releaseTimer = 0;
      g.releaseDelay = delays[i] - Math.min(this.level - 1, 3) * 0.5;
      this.setGhostColor(g, g.originalColor);
      // Show eyes normally
      if (this.ghostEyes[i]) {
        this.ghostEyes[i].leftWhite.visible = true;
        this.ghostEyes[i].rightWhite.visible = true;
      }
    }
    this.frightTimer = 0;
    this.ghostsEatenThisPower = 0;
    this.scatterChaseTimer = 0;
    this.scatterChaseCycle = 0;
    this.isScatterPhase = true;

    this.updateMeshPositions();
  }

  private showAllDots(): void {
    for (const [, mesh] of this.dotMeshes) {
      mesh.visible = true;
    }
  }

  setInput(dir: Direction): void {
    if (this.state === GameState.PLAYING) {
      this.pacNextDir = dir;
    }
  }

  update(delta: number): void {
    switch (this.state) {
      case GameState.READY:
        this.stateTimer -= delta;
        if (this.stateTimer <= 0) {
          this.state = GameState.PLAYING;
          this.onStateChange?.(this.state);
        }
        break;

      case GameState.PLAYING:
        this.statsManager.updateTime(delta);
        this.updatePlaying(delta);
        break;

      case GameState.DYING:
        this.stateTimer -= delta;
        const deathProgress = 1 - (this.stateTimer / DYING_DURATION);
        const shrink = Math.max(0.1, 1 - deathProgress);
        this.pacMesh.scale.setScalar(shrink);
        if (this.stateTimer <= 0) {
          this.pacMesh.scale.setScalar(1);
          if (this.lives <= 0) {
            this.endGame();
          } else {
            this.resetPositions();
            this.state = GameState.READY;
            this.stateTimer = READY_DURATION;
            this.onStateChange?.(this.state);
          }
        }
        break;

      case GameState.LEVEL_COMPLETE:
        this.stateTimer -= delta;
        if (this.stateTimer <= 0) {
          this.checkLevelClearAchievements();
          this.statsManager.recordLevelClear(this.statsManager.currentLevelTime);

          this.level++;

          // Daily Challenge keeps same maze
          if (this.gameMode !== GameMode.DAILY) {
            const newMaze = getMazeForLevel(this.level);
            setMazeLayout(newMaze);
            this.currentMazeName = MAZE_NAMES[(this.level - 1) % MAZE_NAMES.length];
          }
          this.mazesVisited.add(this.currentMazeName);
          if (this.mazesVisited.size >= 4) this.achievements.unlock('all_mazes');

          this.dotGrid.reset();
          this.resetPositions();
          this.fruitSpawned1 = false;
          this.fruitSpawned2 = false;
          this.removeFruit();
          this.usedTunnelThisLevel = false;
          this.levelStartLives = this.lives;
          this.state = GameState.READY;
          this.stateTimer = READY_DURATION;

          // Signal maze rebuild needed and flash
          this.onRebuildMaze?.();
          this.onLevelFlash?.();
          this.onMazeChange?.(this.currentMazeName);
          this.onLevelChange?.(this.level);
          this.onStateChange?.(this.state);
          this.checkLevelAchievements();
        }
        break;
    }

    // Animate power pellets
    this.animatePowerPellets(delta);

    // Update dark mode light
    if (this.darkLight?.visible) {
      const pacWorld = gridToWorld(this.pacCol, this.pacRow);
      this.darkLight.position.set(pacWorld.x, pacWorld.y + 0.3, pacWorld.z);
    }

    // Update ghost eyes direction
    this.updateGhostEyes();
  }

  private updateGhostEyes(): void {
    for (let i = 0; i < this.ghosts.length; i++) {
      const ghost = this.ghosts[i];
      const eyes = this.ghostEyes[i];
      if (!eyes) continue;

      if (ghost.mode === GhostMode.FRIGHTENED) {
        // Hide pupils, show scared look
        eyes.leftWhite.visible = true;
        eyes.rightWhite.visible = true;
        (eyes.leftWhite.material as MeshBasicMaterial).color.setHex(0x4444ff);
        (eyes.rightWhite.material as MeshBasicMaterial).color.setHex(0x4444ff);
        eyes.leftPupil.visible = false;
        eyes.rightPupil.visible = false;
      } else if (ghost.mode === GhostMode.EATEN) {
        // Only eyes visible (ghost body becomes see-through from setGhostColor)
        eyes.leftWhite.visible = true;
        eyes.rightWhite.visible = true;
        (eyes.leftWhite.material as MeshBasicMaterial).color.setHex(0xffffff);
        (eyes.rightWhite.material as MeshBasicMaterial).color.setHex(0xffffff);
        eyes.leftPupil.visible = true;
        eyes.rightPupil.visible = true;
      } else if (ghost.mode === GhostMode.HOUSE) {
        eyes.leftPupil.visible = true;
        eyes.rightPupil.visible = true;
        (eyes.leftWhite.material as MeshBasicMaterial).color.setHex(0xffffff);
        (eyes.rightWhite.material as MeshBasicMaterial).color.setHex(0xffffff);
      } else {
        // Normal - show pupils pointing toward target
        eyes.leftWhite.visible = true;
        eyes.rightWhite.visible = true;
        eyes.leftPupil.visible = true;
        eyes.rightPupil.visible = true;
        (eyes.leftWhite.material as MeshBasicMaterial).color.setHex(0xffffff);
        (eyes.rightWhite.material as MeshBasicMaterial).color.setHex(0xffffff);

        // Point pupils toward movement direction
        const offset = CELL_SIZE * 0.03;
        const dv = DIR_VECTORS[ghost.dir];
        if (dv) {
          const dx = dv.col * offset;
          const dz = dv.row * offset;
          eyes.leftPupil.position.set(dx, 0, -CELL_SIZE * 0.06 + dz);
          eyes.rightPupil.position.set(dx, 0, -CELL_SIZE * 0.06 + dz);
        }
      }
    }
  }

  private updatePlaying(delta: number): void {
    const modeCfg = MODE_CONFIGS[this.gameMode];
    const speedMult = modeCfg.speedMult;
    const marathonGhostBoost = this.gameMode === GameMode.MARATHON ? (this.level - 1) * 0.15 : 0;

    if (this.gameMode !== GameMode.ZEN) {
      this.updateScatterChase(delta);
    }

    if (this.frightTimer > 0) {
      this.frightTimer -= delta;
      this.frightenedSoundTimer -= delta;
      if (this.frightenedSoundTimer <= 0) {
        this.audio.playFrightenedLoop(true);
        this.frightenedSoundTimer = 0.5;
      }
      if (this.frightTimer <= 0) {
        this.endFrightened();
      }
    }

    this.updatePacMan(delta * speedMult);

    if (this.gameMode !== GameMode.ZEN) {
      for (const ghost of this.ghosts) {
        this.updateGhost(ghost, delta * speedMult, marathonGhostBoost);
      }
    }

    this.updateFruit(delta);
    this.updateMeshPositions();
    this.checkDotCollection();
    this.checkFruitCollection();

    if (this.gameMode !== GameMode.ZEN) {
      this.checkGhostCollisions();
    }

    this.checkScoreAchievements();
    this.checkExtraLife();
  }

  private checkExtraLife(): void {
    if (this.score >= this.nextExtraLifeScore) {
      this.lives++;
      this.extraLivesThisGame++;
      this.nextExtraLifeScore += EXTRA_LIFE_SCORE;
      this.audio.playExtraLife();
      this.onExtraLife?.();
      this.onLivesChange?.(this.lives);
      this.onComboDisplay?.('EXTRA LIFE!');

      // Achievements
      this.achievements.unlock('extra_life');
      if (this.extraLivesThisGame >= 3) this.achievements.unlock('extra_life_3');
    }
  }

  private updateScatterChase(delta: number): void {
    if (this.frightTimer > 0) return;

    this.scatterChaseTimer += delta;
    const durations = this.isScatterPhase
      ? [7, 7, 5, 5][Math.min(this.scatterChaseCycle, 3)]
      : [20, 20, 20, Infinity][Math.min(this.scatterChaseCycle, 3)];

    if (this.scatterChaseTimer >= durations) {
      this.scatterChaseTimer = 0;
      if (!this.isScatterPhase) this.scatterChaseCycle++;
      this.isScatterPhase = !this.isScatterPhase;

      for (const g of this.ghosts) {
        if (g.mode === GhostMode.CHASE || g.mode === GhostMode.SCATTER) {
          g.mode = this.isScatterPhase ? GhostMode.SCATTER : GhostMode.CHASE;
          g.dir = OPPOSITE_DIR[g.dir] ?? g.dir;
        }
      }
    }
  }

  private updatePacMan(delta: number): void {
    const speed = PACMAN_SPEED + (this.level - 1) * 0.15;

    // Corner pre-turning: try queued direction at wider threshold
    if (this.pacNextDir !== Direction.NONE) {
      if (this.pacMoveProgress <= 0.3 || this.pacMoveProgress >= 0.8) {
        if (canMove(this.pacCol, this.pacRow, this.pacNextDir)) {
          this.pacDir = this.pacNextDir;
          this.pacNextDir = Direction.NONE;
        }
      }
      // Also try at destination cell for pre-turn around corners
      if (this.pacDir !== Direction.NONE && this.pacMoveProgress >= 0.7) {
        const dv = DIR_VECTORS[this.pacDir];
        let nextCol = this.pacCol + dv.col;
        const nextRow = this.pacRow + dv.row;
        if (nextCol < 0) nextCol = MAZE_COLS - 1;
        if (nextCol >= MAZE_COLS) nextCol = 0;
        if (canMove(nextCol, nextRow, this.pacNextDir)) {
          // Will apply the turn when we arrive at next cell
        }
      }
    }

    if (this.pacDir === Direction.NONE) return;

    if (this.pacMoveProgress <= 0 && !canMove(this.pacCol, this.pacRow, this.pacDir)) {
      this.pacDir = Direction.NONE;
      return;
    }

    this.pacMoveProgress += speed * delta;

    if (this.pacMoveProgress >= 1) {
      this.pacMoveProgress = 0;
      const dv = DIR_VECTORS[this.pacDir];
      this.pacCol += dv.col;
      this.pacRow += dv.row;

      if (this.pacCol < 0) {
        this.pacCol = MAZE_COLS - 1;
        this.tunnelUsesThisGame++;
        this.usedTunnelThisLevel = true;
        this.statsManager.recordTunnelUse();
      }
      if (this.pacCol >= MAZE_COLS) {
        this.pacCol = 0;
        this.tunnelUsesThisGame++;
        this.usedTunnelThisLevel = true;
        this.statsManager.recordTunnelUse();
      }

      // Apply buffered pre-turn on arrival at new cell
      if (this.pacNextDir !== Direction.NONE && canMove(this.pacCol, this.pacRow, this.pacNextDir)) {
        this.pacDir = this.pacNextDir;
        this.pacNextDir = Direction.NONE;
      } else if (!canMove(this.pacCol, this.pacRow, this.pacDir)) {
        this.pacDir = Direction.NONE;
      }
    }
  }

  private updateGhost(ghost: Ghost, delta: number, extraSpeed = 0): void {
    if (ghost.mode === GhostMode.HOUSE) {
      ghost.releaseTimer += delta;
      if (ghost.releaseTimer >= ghost.releaseDelay) {
        ghost.mode = this.isScatterPhase ? GhostMode.SCATTER : GhostMode.CHASE;
        ghost.col = GHOST_HOUSE_EXIT.col;
        ghost.row = GHOST_HOUSE_EXIT.row;
        ghost.moveProgress = 0;
        ghost.dir = Direction.UP;
      }
      return;
    }

    const diffMod = DIFFICULTY_MODS[this.difficulty];
    let speed = (GHOST_SPEED_BASE + (this.level - 1) * 0.1 + extraSpeed) * diffMod.ghostSpeedMult;
    if (ghost.mode === GhostMode.FRIGHTENED) speed = GHOST_FRIGHTENED_SPEED;
    if (ghost.mode === GhostMode.EATEN) speed = GHOST_RETURNING_SPEED;

    ghost.moveProgress += speed * delta;

    if (ghost.moveProgress >= 1) {
      ghost.moveProgress = 0;
      const dv = DIR_VECTORS[ghost.dir];
      ghost.col += dv.col;
      ghost.row += dv.row;

      if (ghost.col < 0) ghost.col = MAZE_COLS - 1;
      if (ghost.col >= MAZE_COLS) ghost.col = 0;

      if (ghost.mode === GhostMode.EATEN) {
        if (ghost.col === GHOST_HOUSE_EXIT.col && ghost.row === GHOST_HOUSE_EXIT.row) {
          ghost.mode = this.isScatterPhase ? GhostMode.SCATTER : GhostMode.CHASE;
          this.setGhostColor(ghost, ghost.originalColor);
        }
      }

      ghost.dir = this.chooseGhostDirection(ghost);
    }
  }

  private chooseGhostDirection(ghost: Ghost): Direction {
    const allowGH = ghost.mode === GhostMode.EATEN;
    const available = getAvailableDirections(ghost.col, ghost.row, allowGH);
    const noReverse = available.filter((d) => d !== OPPOSITE_DIR[ghost.dir]);
    const choices = noReverse.length > 0 ? noReverse : available;

    if (choices.length === 0) return ghost.dir;
    if (choices.length === 1) return choices[0];

    this.updateGhostTarget(ghost);

    if (ghost.mode === GhostMode.FRIGHTENED) {
      return choices[Math.floor(Math.random() * choices.length)];
    }

    let bestDir = choices[0];
    let bestDist = Infinity;
    for (const d of choices) {
      const dv = DIR_VECTORS[d];
      let nc = ghost.col + dv.col;
      const nr = ghost.row + dv.row;
      if (nc < 0) nc = MAZE_COLS - 1;
      if (nc >= MAZE_COLS) nc = 0;
      const dist = (nc - ghost.targetCol) ** 2 + (nr - ghost.targetRow) ** 2;
      if (dist < bestDist) {
        bestDist = dist;
        bestDir = d;
      }
    }
    return bestDir;
  }

  private updateGhostTarget(ghost: Ghost): void {
    if (ghost.mode === GhostMode.EATEN) {
      ghost.targetCol = GHOST_HOUSE_EXIT.col;
      ghost.targetRow = GHOST_HOUSE_EXIT.row;
      return;
    }

    if (ghost.mode === GhostMode.SCATTER || this.isScatterPhase) {
      switch (ghost.name) {
        case GhostName.BLINKY: ghost.targetCol = MAZE_COLS - 2; ghost.targetRow = 0; break;
        case GhostName.PINKY: ghost.targetCol = 1; ghost.targetRow = 0; break;
        case GhostName.INKY: ghost.targetCol = MAZE_COLS - 2; ghost.targetRow = MAZE_ROWS - 1; break;
        case GhostName.CLYDE: ghost.targetCol = 1; ghost.targetRow = MAZE_ROWS - 1; break;
      }
      return;
    }

    switch (ghost.name) {
      case GhostName.BLINKY:
        ghost.targetCol = this.pacCol;
        ghost.targetRow = this.pacRow;
        break;
      case GhostName.PINKY: {
        const dv = this.pacDir !== Direction.NONE ? DIR_VECTORS[this.pacDir] : { col: 0, row: -1 };
        ghost.targetCol = this.pacCol + dv.col * 4;
        ghost.targetRow = this.pacRow + dv.row * 4;
        break;
      }
      case GhostName.INKY: {
        const blinky = this.ghosts[0];
        const dv2 = this.pacDir !== Direction.NONE ? DIR_VECTORS[this.pacDir] : { col: 0, row: -1 };
        const pivotCol = this.pacCol + dv2.col * 2;
        const pivotRow = this.pacRow + dv2.row * 2;
        ghost.targetCol = pivotCol + (pivotCol - blinky.col);
        ghost.targetRow = pivotRow + (pivotRow - blinky.row);
        break;
      }
      case GhostName.CLYDE: {
        const dist = Math.abs(ghost.col - this.pacCol) + Math.abs(ghost.row - this.pacRow);
        if (dist > 8) {
          ghost.targetCol = this.pacCol;
          ghost.targetRow = this.pacRow;
        } else {
          ghost.targetCol = 1;
          ghost.targetRow = MAZE_ROWS - 1;
        }
        break;
      }
    }
  }

  // ---- Fruit ----
  private updateFruit(delta: number): void {
    const dotsEaten = this.dotGrid.dotsEaten;
    if (!this.fruitSpawned1 && dotsEaten >= this.fruitSpawnDots1) {
      this.fruitSpawned1 = true;
      this.spawnFruit();
    }
    if (!this.fruitSpawned2 && dotsEaten >= this.fruitSpawnDots2) {
      this.fruitSpawned2 = true;
      this.spawnFruit();
    }

    if (this.fruit?.active) {
      this.fruit.timer -= delta;
      const pulse = 1 + Math.sin(this.fruit.timer * 5) * 0.15;
      this.fruit.mesh.scale.setScalar(pulse);
      if (this.fruit.timer <= 0) {
        this.removeFruit();
      }
    }
  }

  private spawnFruit(): void {
    if (this.fruit?.active) return;

    const levelIdx = Math.min(this.level - 1, FRUIT_BY_LEVEL.length - 1);
    const fruitType = FRUIT_BY_LEVEL[levelIdx];
    const color = FRUIT_COLORS[fruitType];

    const col = 10;
    const row = 14;
    const pos = gridToWorld(col, row);

    const geo = new SphereGeometry(CELL_SIZE * 0.35, 12, 8);
    const mat = new MeshStandardMaterial({
      color,
      emissive: new Color(color),
      emissiveIntensity: 0.8,
    });
    const mesh = new Mesh(geo, mat);
    mesh.position.set(pos.x, pos.y + 0.04, pos.z);
    this.mazeGroup.add(mesh);

    this.fruit = {
      type: fruitType,
      col,
      row,
      mesh,
      timer: 10,
      active: true,
    };
  }

  private removeFruit(): void {
    if (this.fruit) {
      this.mazeGroup.remove(this.fruit.mesh);
      this.fruit.mesh.geometry.dispose();
      (this.fruit.mesh.material as MeshStandardMaterial).dispose();
      this.fruit.active = false;
      this.fruit = null;
    }
  }

  private checkFruitCollection(): void {
    if (!this.fruit?.active) return;
    if (this.pacCol === this.fruit.col && this.pacRow === this.fruit.row) {
      const fruitScore = FRUIT_SCORES[this.fruit.type];
      this.score += fruitScore;
      if (this.score > this.highScore) {
        this.highScore = this.score;
        try { localStorage.setItem('neon-pac-highscore', String(this.highScore)); } catch { /* ignore */ }
      }

      this.statsManager.recordFruitEaten(this.fruit.type);
      this.checkFruitAchievements(this.fruit.type);

      this.audio.playPowerPellet();
      this.onFruitEaten?.(this.fruit.type, fruitScore);
      this.onScoreChange?.(this.score, this.highScore);
      this.removeFruit();
    }
  }

  private checkDotCollection(): void {
    if (this.dotGrid.hasDot(this.pacCol, this.pacRow)) {
      const isPower = this.dotGrid.isPowerPellet(this.pacCol, this.pacRow);
      this.dotGrid.eatDot(this.pacCol, this.pacRow);

      const key = `${this.pacCol},${this.pacRow}`;
      const mesh = this.dotMeshes.get(key);
      if (mesh) mesh.visible = false;

      if (isPower) {
        this.score += POWER_PELLET_SCORE;
        this.startFrightened();
        this.audio.playPowerPellet();
        this.statsManager.recordPowerPellet();
      } else {
        this.score += DOT_SCORE;
        this.statsManager.recordDotEaten();
        this.wakaTimer += 0.15;
        if (this.wakaTimer >= 0.15) {
          this.audio.playWaka();
          this.wakaTimer = 0;
        }
      }

      if (this.score > this.highScore) {
        this.highScore = this.score;
        try { localStorage.setItem('neon-pac-highscore', String(this.highScore)); } catch { /* ignore */ }
      }
      this.onScoreChange?.(this.score, this.highScore);

      if (this.dotGrid.allEaten()) {
        this.state = GameState.LEVEL_COMPLETE;
        this.stateTimer = LEVEL_COMPLETE_DURATION;
        this.audio.playLevelComplete();
        this.onStateChange?.(this.state);
      }
    }
  }

  private checkGhostCollisions(): void {
    for (const ghost of this.ghosts) {
      if (ghost.mode === GhostMode.HOUSE || ghost.mode === GhostMode.EATEN) continue;

      const dx = Math.abs(ghost.col - this.pacCol);
      const dy = Math.abs(ghost.row - this.pacRow);
      if (dx > 1 || dy > 1) continue;

      if (dx === 0 && dy === 0) {
        if (ghost.mode === GhostMode.FRIGHTENED) {
          ghost.mode = GhostMode.EATEN;
          this.ghostsEatenThisPower++;
          const eatScore = GHOST_EAT_SCORES[Math.min(this.ghostsEatenThisPower - 1, 3)];
          this.score += eatScore;
          this.setGhostColor(ghost, EATEN_COLOR);
          this.audio.playGhostEat();
          this.onScoreChange?.(this.score, this.highScore);
          this.onComboDisplay?.(`${eatScore}`);

          this.statsManager.recordGhostEaten(ghost.name, this.ghostsEatenThisPower);
          this.checkGhostAchievements(ghost.name);

          if (this.frightTimer < 1.5 && this.frightTimer > 0) {
            this.achievements.unlock('close_call');
          }
        } else {
          this.lives--;
          this.statsManager.recordDeath();
          this.levelsWithoutDeath = 0;
          this.onLivesChange?.(this.lives);
          this.state = GameState.DYING;
          this.stateTimer = DYING_DURATION;
          this.audio.playDeath();
          this.onStateChange?.(this.state);
          this.onCameraShake?.(0.8);
          return;
        }
      }
    }
  }

  private startFrightened(): void {
    const diffMod = DIFFICULTY_MODS[this.difficulty];
    this.frightTimer = diffMod.frightDuration;
    this.ghostsEatenThisPower = 0;
    this.frightenedSoundTimer = 0;
    for (const g of this.ghosts) {
      if (g.mode === GhostMode.CHASE || g.mode === GhostMode.SCATTER) {
        g.mode = GhostMode.FRIGHTENED;
        g.dir = OPPOSITE_DIR[g.dir] ?? g.dir;
        this.setGhostColor(g, FRIGHTENED_COLOR);
      }
    }
  }

  private endFrightened(): void {
    this.frightTimer = 0;
    for (const g of this.ghosts) {
      if (g.mode === GhostMode.FRIGHTENED) {
        g.mode = this.isScatterPhase ? GhostMode.SCATTER : GhostMode.CHASE;
        this.setGhostColor(g, g.originalColor);
      }
    }
  }

  private setGhostColor(ghost: Ghost, color: number): void {
    const mat = ghost.mesh.material as MeshStandardMaterial;
    mat.color.setHex(color);
    mat.emissive.setHex(color);
  }

  private updateMeshPositions(): void {
    const pacWorld = gridToWorld(this.pacCol, this.pacRow);
    if (this.pacDir !== Direction.NONE && this.pacMoveProgress > 0) {
      const dv = DIR_VECTORS[this.pacDir];
      const cs = CELL_SIZE;
      pacWorld.x += dv.col * this.pacMoveProgress * cs;
      pacWorld.z += dv.row * this.pacMoveProgress * cs;
    }
    this.pacMesh.position.set(pacWorld.x, pacWorld.y + 0.03, pacWorld.z);

    if (this.pacDir !== Direction.NONE) {
      const angles = [Math.PI, -Math.PI / 2, 0, Math.PI / 2];
      this.pacMesh.rotation.y = angles[this.pacDir] ?? 0;
    }

    for (const ghost of this.ghosts) {
      const gWorld = gridToWorld(ghost.col, ghost.row);
      if (ghost.dir !== Direction.NONE && ghost.moveProgress > 0 && ghost.mode !== GhostMode.HOUSE) {
        const dv = DIR_VECTORS[ghost.dir];
        const cs = CELL_SIZE;
        gWorld.x += dv.col * ghost.moveProgress * cs;
        gWorld.z += dv.row * ghost.moveProgress * cs;
      }
      ghost.mesh.position.set(gWorld.x, gWorld.y + 0.03, gWorld.z);
    }
  }

  private powerPelletTime = 0;
  private animatePowerPellets(delta: number): void {
    this.powerPelletTime += delta * 3;
    const scale = 0.8 + Math.sin(this.powerPelletTime) * 0.3;
    for (const [key, mesh] of this.dotMeshes) {
      if (!mesh.visible) continue;
      const [cs, rs] = key.split(',');
      const c = parseInt(cs, 10);
      const r = parseInt(rs, 10);
      if (this.dotGrid.isPowerPellet(c, r)) {
        mesh.scale.setScalar(scale);
      }
    }
  }

  // ---- Achievement checks ----
  private checkScoreAchievements(): void {
    if (this.score >= 1000) this.achievements.unlock('score_1k');
    if (this.score >= 5000) this.achievements.unlock('score_5k');
    if (this.score >= 10000) this.achievements.unlock('score_10k');
    if (this.score >= 25000) this.achievements.unlock('score_25k');
    if (this.score >= 50000) this.achievements.unlock('score_50k');
    if (this.score >= 100000) this.achievements.unlock('score_100k');
    if (this.score >= 200000) this.achievements.unlock('score_200k');
    if (this.score >= 500000) this.achievements.unlock('score_500k');

    if (this.score - this.gameStartScore >= 10000 && this.statsManager.currentLevelDeaths === 0 && this.levelsWithoutDeath >= 0) {
      this.achievements.unlock('ten_k_no_death');
    }

    if (this.statsManager.currentLevelTime >= 30) this.achievements.unlock('survive_30s');
    if (this.statsManager.currentLevelTime >= 60) this.achievements.unlock('survive_60s');
    if (this.statsManager.currentLevelTime >= 120) this.achievements.unlock('survive_120s');
    if (this.statsManager.currentLevelTime >= 180) this.achievements.unlock('survive_180s');
    if (this.statsManager.currentLevelTime >= 300) this.achievements.unlock('survive_300s');

    const gp = this.statsManager.stats.totalGamesPlayed;
    if (gp >= 5) this.achievements.unlock('games_5');
    if (gp >= 10) this.achievements.unlock('games_10');
    if (gp >= 25) this.achievements.unlock('games_25');
    if (gp >= 50) this.achievements.unlock('games_50');
    if (gp >= 100) this.achievements.unlock('games_100');

    const td = this.statsManager.stats.totalDotsEaten;
    if (td >= 1000) this.achievements.unlock('dots_1000');
    if (td >= 5000) this.achievements.unlock('dots_5000');
    if (td >= 10000) this.achievements.unlock('dots_10000');
    if (td >= 25000) this.achievements.unlock('dots_25000');

    const tp = this.statsManager.stats.totalPowerPelletsUsed;
    if (tp >= 10) this.achievements.unlock('power_10');
    if (tp >= 50) this.achievements.unlock('power_50');
    if (tp >= 100) this.achievements.unlock('power_100');

    if (this.tunnelUsesThisGame >= 10) this.achievements.unlock('tunnel_master');
    if (this.tunnelUsesThisGame >= 25) this.achievements.unlock('tunnel_25');

    // Time achievements
    const totalTime = this.statsManager.stats.totalTimePlayed + this.statsManager.currentGameTime;
    if (totalTime >= 3600) this.achievements.unlock('total_time_1h');
    if (totalTime >= 18000) this.achievements.unlock('total_time_5h');
  }

  private checkGhostAchievements(ghostName: string): void {
    this.achievements.unlock('ghost_first');

    if (this.ghostsEatenThisPower >= 2) this.achievements.unlock('ghost_2chain');
    if (this.ghostsEatenThisPower >= 3) this.achievements.unlock('ghost_3chain');
    if (this.ghostsEatenThisPower >= 4) {
      this.achievements.unlock('ghost_4chain');
      this.quadKillsThisGame++;
      if (this.quadKillsThisGame >= 2) this.achievements.unlock('quad_kill_twice');
      if (this.quadKillsThisGame >= 3) this.achievements.unlock('triple_quad');
    }

    const tg = this.statsManager.stats.totalGhostsEaten;
    if (tg >= 10) this.achievements.unlock('ghost_10total');
    if (tg >= 25) this.achievements.unlock('ghost_25total');
    if (tg >= 50) this.achievements.unlock('ghost_50total');
    if (tg >= 100) this.achievements.unlock('ghost_100total');
    if (tg >= 200) this.achievements.unlock('ghost_200total');
    if (tg >= 500) this.achievements.unlock('ghost_500total');

    if (ghostName === GhostName.BLINKY) this.achievements.unlock('ghost_blinky');
    if (ghostName === GhostName.PINKY) this.achievements.unlock('ghost_pinky');
    if (ghostName === GhostName.INKY) this.achievements.unlock('ghost_inky');
    if (ghostName === GhostName.CLYDE) this.achievements.unlock('ghost_clyde');

    if (this.statsManager.currentGameGhostNames.size >= 4) {
      this.achievements.unlock('all_ghosts_one_game');
    }
  }

  private checkFruitAchievements(fruitType: string): void {
    this.achievements.unlock('fruit_first');
    const tf = this.statsManager.stats.totalFruitsEaten;
    if (tf >= 5) this.achievements.unlock('fruit_5');
    if (tf >= 15) this.achievements.unlock('fruit_15');
    if (tf >= 30) this.achievements.unlock('fruit_30');

    if (fruitType === FruitType.CHERRY) this.achievements.unlock('fruit_cherry');
    if (fruitType === FruitType.STRAWBERRY) this.achievements.unlock('fruit_strawberry');
    if (fruitType === FruitType.ORANGE) this.achievements.unlock('fruit_orange');
    if (fruitType === FruitType.APPLE) this.achievements.unlock('fruit_apple');
    if (fruitType === FruitType.MELON) this.achievements.unlock('fruit_melon');
    if (fruitType === FruitType.KEY) this.achievements.unlock('fruit_key');
    if (fruitType === FruitType.GALAXIAN) this.achievements.unlock('fruit_galaxian');
    if (fruitType === FruitType.BELL) this.achievements.unlock('fruit_bell');

    const allTypes = [FruitType.CHERRY, FruitType.STRAWBERRY, FruitType.ORANGE, FruitType.APPLE, FruitType.MELON, FruitType.KEY];
    if (allTypes.every((t) => (this.statsManager.stats.fruitsEatenByType[t] ?? 0) > 0)) {
      this.achievements.unlock('eat_all_fruit');
    }
  }

  private checkLevelAchievements(): void {
    if (this.level >= 2) this.achievements.unlock('level_2');
    if (this.level >= 5) this.achievements.unlock('level_5');
    if (this.level >= 10) this.achievements.unlock('level_10');
    if (this.level >= 15) this.achievements.unlock('level_15');
    if (this.level >= 20) this.achievements.unlock('level_20');
    if (this.level >= 25) this.achievements.unlock('level_25');
    if (this.level >= 30) this.achievements.unlock('level_30');
    if (this.level >= 50) this.achievements.unlock('level_50');

    if (this.gameMode === GameMode.SPEED) this.achievements.unlock('mode_speed');
    if (this.gameMode === GameMode.DARK) this.achievements.unlock('mode_dark');
    if (this.gameMode === GameMode.SURVIVAL && this.level >= 5) this.achievements.unlock('mode_survival');
    if (this.gameMode === GameMode.MARATHON && this.level >= 10) this.achievements.unlock('marathon_l10');
    if (this.gameMode === GameMode.DAILY) {
      this.dailyChallengesCompleted++;
      try { localStorage.setItem('neon-pac-daily-count', String(this.dailyChallengesCompleted)); } catch { /* ignore */ }
      this.achievements.unlock('daily_complete');
      if (this.dailyChallengesCompleted >= 3) this.achievements.unlock('daily_3');
      if (this.dailyChallengesCompleted >= 7) this.achievements.unlock('daily_7');
    }
    if (this.statsManager.stats.modesPlayed.size >= 4) this.achievements.unlock('mode_all');

    // Maze-specific achievements
    if (this.currentMazeName === 'Corridors') this.achievements.unlock('maze_corridors');
    if (this.currentMazeName === 'Arena') this.achievements.unlock('maze_arena');
    if (this.currentMazeName === 'Spiral') this.achievements.unlock('maze_spiral');
  }

  private checkLevelClearAchievements(): void {
    const lt = this.statsManager.currentLevelTime;

    if (this.levelStartLives === this.lives) {
      this.achievements.unlock('perfect_level');
      this.levelsWithoutDeath++;
      if (this.levelsWithoutDeath >= 3) {
        this.achievements.unlock('survivor_no_death');
        this.achievements.unlock('flawless_3');
      }
      if (this.levelsWithoutDeath >= 5) this.achievements.unlock('flawless_5');
      if (this.levelsWithoutDeath >= 10) this.achievements.unlock('flawless_10');
    } else {
      this.levelsWithoutDeath = 0;
    }

    if (!this.statsManager.currentLevelPowerUsed) {
      this.achievements.unlock('no_power');
    }

    if (!this.usedTunnelThisLevel) {
      this.achievements.unlock('no_tunnel');
    }

    if (lt < 60) this.achievements.unlock('speed_clear');
    if (lt < 30) this.achievements.unlock('speed_clear_30');
    if (this.level === 1 && lt < 90) this.achievements.unlock('speed_l1_90');
    if (this.level === 1 && lt < 60) this.achievements.unlock('speed_l1_60');
    if (this.level === 1 && lt < 45) this.achievements.unlock('speed_l1_45');
    if (this.level === 2 && lt < 90) this.achievements.unlock('speed_l2_90');

    if (this.level >= 3 && this.statsManager.currentGameTime < 300) {
      this.achievements.unlock('speed_3levels_5min');
    }
    if (this.level >= 5 && this.statsManager.currentGameTime < 600) {
      this.achievements.unlock('speed_5levels_10min');
    }

    if (this.lives === 1) this.achievements.unlock('comeback');
  }

  private endGame(): void {
    this.state = GameState.GAME_OVER;
    this.statsManager.recordGameEnd(this.score, this.level);

    // Record in leaderboard
    this.leaderboard.addEntry(this.score, this.level, this.gameMode, this.difficulty);

    this.removeFruit();
    this.onStateChange?.(this.state);

    if (this.darkLight) {
      this.darkLight.visible = false;
    }
  }

  togglePause(): void {
    if (this.state === GameState.PLAYING) {
      this.state = GameState.PAUSED;
      this.onStateChange?.(this.state);
    } else if (this.state === GameState.PAUSED) {
      this.state = GameState.PLAYING;
      this.onStateChange?.(this.state);
    }
  }

  returnToMenu(): void {
    this.state = GameState.MENU;
    this.removeFruit();
    if (this.darkLight) this.darkLight.visible = false;

    // Reset to classic maze for menu view
    const classicMaze = getMazeForLevel(1);
    setMazeLayout(classicMaze);

    this.onStateChange?.(this.state);
  }

  goToModeSelect(): void {
    this.state = GameState.MODE_SELECT;
    this.onStateChange?.(this.state);
  }

  setDifficulty(diff: Difficulty): void {
    this.difficulty = diff;
    try { localStorage.setItem('neon-pac-difficulty', diff); } catch { /* ignore */ }
  }

  getDifficulty(): Difficulty {
    return this.difficulty;
  }
}
