// === Neon Pac VR -- Game State Manager ===

import { type Mesh, MeshStandardMaterial } from '@iwsdk/core';
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
  GHOST_COLORS,
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
} from './maze';
import { AudioManager } from './audio-manager';

// ---- Ghost AI ----
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

export class GameManager {
  // State
  state: GameState = GameState.MENU;
  score = 0;
  highScore = 0;
  lives = INITIAL_LIVES;
  level = 1;

  // Pac-Man
  pacCol: number;
  pacRow: number;
  pacDir = Direction.NONE;
  pacNextDir = Direction.NONE;
  pacMoveProgress = 0;
  pacMesh: Mesh;

  // Ghosts
  ghosts: Ghost[] = [];

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

  // Audio
  audio: AudioManager;

  // Callbacks for UI updates
  onScoreChange?: (score: number, highScore: number) => void;
  onLivesChange?: (lives: number) => void;
  onLevelChange?: (level: number) => void;
  onStateChange?: (state: GameState) => void;

  constructor(
    pacMesh: Mesh,
    ghostMeshes: Mesh[],
    dotGrid: DotGrid,
    dotMeshes: Map<string, Mesh>,
  ) {
    this.pacMesh = pacMesh;
    this.dotGrid = dotGrid;
    this.dotMeshes = dotMeshes;
    this.pacCol = PACMAN_START.col;
    this.pacRow = PACMAN_START.row;
    this.audio = new AudioManager();

    // Load high score
    try {
      const saved = localStorage.getItem('neon-pac-highscore');
      if (saved) this.highScore = parseInt(saved, 10);
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

  startGame(): void {
    this.score = 0;
    this.lives = INITIAL_LIVES;
    this.level = 1;
    this.dotGrid.reset();
    this.resetPositions();
    this.showAllDots();
    this.state = GameState.READY;
    this.stateTimer = READY_DURATION;
    this.audio.playGameStart();
    this.notifyAll();
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
    const delays = [0, 3, 6, 9];

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
        this.updatePlaying(delta);
        break;

      case GameState.DYING:
        this.stateTimer -= delta;
        if (this.stateTimer <= 0) {
          if (this.lives <= 0) {
            this.state = GameState.GAME_OVER;
            this.onStateChange?.(this.state);
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
          this.level++;
          this.dotGrid.reset();
          this.showAllDots();
          this.resetPositions();
          this.state = GameState.READY;
          this.stateTimer = READY_DURATION;
          this.onLevelChange?.(this.level);
          this.onStateChange?.(this.state);
        }
        break;
    }

    // Animate power pellets (pulse)
    this.animatePowerPellets(delta);
  }

  private updatePlaying(delta: number): void {
    // Scatter/chase cycle
    this.updateScatterChase(delta);

    // Frightened timer
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

    // Move Pac-Man
    this.updatePacMan(delta);

    // Move ghosts
    for (const ghost of this.ghosts) {
      this.updateGhost(ghost, delta);
    }

    // Update 3D positions
    this.updateMeshPositions();

    // Check dot collection
    this.checkDotCollection();

    // Check ghost collisions
    this.checkGhostCollisions();
  }

  private updateScatterChase(delta: number): void {
    if (this.frightTimer > 0) return;

    this.scatterChaseTimer += delta;
    // Classic timing: scatter 7s, chase 20s, scatter 7s, chase 20s, ...
    const durations = this.isScatterPhase
      ? [7, 7, 5, 5][Math.min(this.scatterChaseCycle, 3)]
      : [20, 20, 20, Infinity][Math.min(this.scatterChaseCycle, 3)];

    if (this.scatterChaseTimer >= durations) {
      this.scatterChaseTimer = 0;
      if (!this.isScatterPhase) this.scatterChaseCycle++;
      this.isScatterPhase = !this.isScatterPhase;

      // Reverse ghost directions
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

    // Try to change direction
    if (this.pacNextDir !== Direction.NONE && this.pacMoveProgress <= 0.1) {
      if (canMove(this.pacCol, this.pacRow, this.pacNextDir)) {
        this.pacDir = this.pacNextDir;
        this.pacNextDir = Direction.NONE;
      }
    }

    if (this.pacDir === Direction.NONE) return;

    // Check if we can move in current direction
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

      // Tunnel wrap
      if (this.pacCol < 0) this.pacCol = MAZE_COLS - 1;
      if (this.pacCol >= MAZE_COLS) this.pacCol = 0;

      // Can we keep going?
      if (!canMove(this.pacCol, this.pacRow, this.pacDir)) {
        this.pacDir = Direction.NONE;
      }
    }
  }

  private updateGhost(ghost: Ghost, delta: number): void {
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

    let speed = GHOST_SPEED_BASE + (this.level - 1) * 0.1;
    if (ghost.mode === GhostMode.FRIGHTENED) speed = GHOST_FRIGHTENED_SPEED;
    if (ghost.mode === GhostMode.EATEN) speed = GHOST_RETURNING_SPEED;

    ghost.moveProgress += speed * delta;

    if (ghost.moveProgress >= 1) {
      ghost.moveProgress = 0;
      const dv = DIR_VECTORS[ghost.dir];
      ghost.col += dv.col;
      ghost.row += dv.row;

      // Tunnel wrap
      if (ghost.col < 0) ghost.col = MAZE_COLS - 1;
      if (ghost.col >= MAZE_COLS) ghost.col = 0;

      // Check if eaten ghost reached home
      if (ghost.mode === GhostMode.EATEN) {
        if (ghost.col === GHOST_HOUSE_EXIT.col && ghost.row === GHOST_HOUSE_EXIT.row) {
          ghost.mode = this.isScatterPhase ? GhostMode.SCATTER : GhostMode.CHASE;
          this.setGhostColor(ghost, ghost.originalColor);
        }
      }

      // Choose next direction
      ghost.dir = this.chooseGhostDirection(ghost);
    }
  }

  private chooseGhostDirection(ghost: Ghost): Direction {
    const allowGH = ghost.mode === GhostMode.EATEN;
    const available = getAvailableDirections(ghost.col, ghost.row, allowGH);

    // Remove reverse direction (ghosts can't reverse except on mode change)
    const noReverse = available.filter((d) => d !== OPPOSITE_DIR[ghost.dir]);
    const choices = noReverse.length > 0 ? noReverse : available;

    if (choices.length === 0) return ghost.dir;
    if (choices.length === 1) return choices[0];

    // Calculate target based on mode
    this.updateGhostTarget(ghost);

    if (ghost.mode === GhostMode.FRIGHTENED) {
      // Random direction
      return choices[Math.floor(Math.random() * choices.length)];
    }

    // Pick direction that minimizes distance to target
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
      // Scatter corners
      switch (ghost.name) {
        case GhostName.BLINKY: ghost.targetCol = MAZE_COLS - 2; ghost.targetRow = 0; break;
        case GhostName.PINKY: ghost.targetCol = 1; ghost.targetRow = 0; break;
        case GhostName.INKY: ghost.targetCol = MAZE_COLS - 2; ghost.targetRow = MAZE_ROWS - 1; break;
        case GhostName.CLYDE: ghost.targetCol = 1; ghost.targetRow = MAZE_ROWS - 1; break;
      }
      return;
    }

    // Chase mode -- each ghost has unique targeting
    switch (ghost.name) {
      case GhostName.BLINKY:
        // Direct chase
        ghost.targetCol = this.pacCol;
        ghost.targetRow = this.pacRow;
        break;

      case GhostName.PINKY: {
        // 4 tiles ahead of pac-man
        const dv = this.pacDir !== Direction.NONE ? DIR_VECTORS[this.pacDir] : { col: 0, row: -1 };
        ghost.targetCol = this.pacCol + dv.col * 4;
        ghost.targetRow = this.pacRow + dv.row * 4;
        break;
      }

      case GhostName.INKY: {
        // Double vector from Blinky to 2 ahead of pac
        const blinky = this.ghosts[0];
        const dv2 = this.pacDir !== Direction.NONE ? DIR_VECTORS[this.pacDir] : { col: 0, row: -1 };
        const pivotCol = this.pacCol + dv2.col * 2;
        const pivotRow = this.pacRow + dv2.row * 2;
        ghost.targetCol = pivotCol + (pivotCol - blinky.col);
        ghost.targetRow = pivotRow + (pivotRow - blinky.row);
        break;
      }

      case GhostName.CLYDE: {
        // Chase if far, scatter if close
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

  private checkDotCollection(): void {
    if (this.dotGrid.hasDot(this.pacCol, this.pacRow)) {
      const isPower = this.dotGrid.isPowerPellet(this.pacCol, this.pacRow);
      this.dotGrid.eatDot(this.pacCol, this.pacRow);

      // Hide dot mesh
      const key = `${this.pacCol},${this.pacRow}`;
      const mesh = this.dotMeshes.get(key);
      if (mesh) mesh.visible = false;

      if (isPower) {
        this.score += POWER_PELLET_SCORE;
        this.startFrightened();
        this.audio.playPowerPellet();
      } else {
        this.score += DOT_SCORE;
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

      // Check level complete
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

      // Check with interpolated positions for smoother collision
      if (dx === 0 && dy === 0) {
        if (ghost.mode === GhostMode.FRIGHTENED) {
          // Eat ghost
          ghost.mode = GhostMode.EATEN;
          const eatScore = GHOST_EAT_SCORES[Math.min(this.ghostsEatenThisPower, 3)];
          this.score += eatScore;
          this.ghostsEatenThisPower++;
          this.setGhostColor(ghost, EATEN_COLOR);
          this.audio.playGhostEat();
          this.onScoreChange?.(this.score, this.highScore);
        } else {
          // Pac-Man dies
          this.lives--;
          this.onLivesChange?.(this.lives);
          this.state = GameState.DYING;
          this.stateTimer = DYING_DURATION;
          this.audio.playDeath();
          this.onStateChange?.(this.state);
          return;
        }
      }
    }
  }

  private startFrightened(): void {
    this.frightTimer = POWER_PELLET_DURATION;
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
    // Pac-Man
    const pacWorld = gridToWorld(this.pacCol, this.pacRow);
    if (this.pacDir !== Direction.NONE && this.pacMoveProgress > 0) {
      const dv = DIR_VECTORS[this.pacDir];
      const cs = 0.12; // CELL_SIZE
      pacWorld.x += dv.col * this.pacMoveProgress * cs;
      pacWorld.z += dv.row * this.pacMoveProgress * cs;
    }
    this.pacMesh.position.set(pacWorld.x, pacWorld.y + 0.03, pacWorld.z);

    // Ghosts
    for (const ghost of this.ghosts) {
      const gWorld = gridToWorld(ghost.col, ghost.row);
      if (ghost.dir !== Direction.NONE && ghost.moveProgress > 0 && ghost.mode !== GhostMode.HOUSE) {
        const dv = DIR_VECTORS[ghost.dir];
        const cs = 0.12;
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
    // Pulse power pellet meshes that are still visible
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
    this.onStateChange?.(this.state);
  }
}
