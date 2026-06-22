// === Neon Pac VR -- Maze Definition & 3D Construction (v3: multi-layout) ===

import {
  Group,
  Mesh,
  BoxGeometry,
  SphereGeometry,
  MeshStandardMaterial,
  MeshBasicMaterial,
  PlaneGeometry,
  Vector3,
  Color,
  InstancedMesh,
  Matrix4,
  Object3D,
  PointLight,
  AmbientLight,
  LineSegments,
  EdgesGeometry,
  LineBasicMaterial,
  FogExp2,
  DoubleSide,
} from '@iwsdk/core';
import {
  CellType,
  CELL_SIZE,
  WALL_HEIGHT,
  MAZE_OFFSET_Y,
  Direction,
  DIR_VECTORS,
  type GridPos,
} from './types';
import { MAZE_CLASSIC, getMazeForLevel } from './maze-layouts';

// ---- Dynamic maze state ----
let currentMaze: string[] = MAZE_CLASSIC;

export function setMazeLayout(maze: string[]): void {
  currentMaze = maze;
}

export function getCurrentMaze(): string[] {
  return currentMaze;
}

export const MAZE_ROWS = 22; // All layouts are 22 rows
export const MAZE_COLS = 21; // All layouts are 21 cols

export const PACMAN_START: GridPos = { col: 10, row: 16 };
export const GHOST_HOUSE_EXIT: GridPos = { col: 10, row: 9 };
export const GHOST_STARTS: GridPos[] = [
  { col: 10, row: 10 },
  { col: 9, row: 10 },
  { col: 10, row: 10 },
  { col: 11, row: 10 },
];
export const BLINKY_START: GridPos = { col: 10, row: 8 };

// ---- Grid helpers ----
export function getCell(col: number, row: number): CellType {
  if (row < 0 || row >= MAZE_ROWS) return CellType.WALL;
  const c = ((col % MAZE_COLS) + MAZE_COLS) % MAZE_COLS;
  if (c >= currentMaze[row].length) return CellType.WALL;
  const ch = currentMaze[row][c];
  if (ch === '#') return CellType.WALL;
  if (ch === '.') return CellType.DOT;
  if (ch === 'o') return CellType.POWER;
  if (ch === 'G') return CellType.GHOST_HOUSE;
  return CellType.EMPTY;
}

export function isWalkable(col: number, row: number, allowGhostHouse = false): boolean {
  const cell = getCell(col, row);
  if (cell === CellType.WALL) return false;
  if (cell === CellType.GHOST_HOUSE && !allowGhostHouse) return false;
  return true;
}

export function gridToWorld(col: number, row: number): Vector3 {
  const halfW = (MAZE_COLS * CELL_SIZE) / 2;
  const halfH = (MAZE_ROWS * CELL_SIZE) / 2;
  return new Vector3(
    col * CELL_SIZE - halfW + CELL_SIZE / 2,
    MAZE_OFFSET_Y,
    row * CELL_SIZE - halfH + CELL_SIZE / 2,
  );
}

export function worldToGrid(x: number, z: number): GridPos {
  const halfW = (MAZE_COLS * CELL_SIZE) / 2;
  const halfH = (MAZE_ROWS * CELL_SIZE) / 2;
  return {
    col: Math.round((x + halfW - CELL_SIZE / 2) / CELL_SIZE),
    row: Math.round((z + halfH - CELL_SIZE / 2) / CELL_SIZE),
  };
}

export function canMove(col: number, row: number, dir: Direction, allowGhostHouse = false): boolean {
  const dv = DIR_VECTORS[dir];
  if (!dv) return false;
  let nc = col + dv.col;
  const nr = row + dv.row;
  if (nc < 0) nc = MAZE_COLS - 1;
  if (nc >= MAZE_COLS) nc = 0;
  return isWalkable(nc, nr, allowGhostHouse);
}

export function getAvailableDirections(col: number, row: number, allowGhostHouse = false): Direction[] {
  const dirs: Direction[] = [];
  for (const d of [Direction.UP, Direction.RIGHT, Direction.DOWN, Direction.LEFT]) {
    if (canMove(col, row, d, allowGhostHouse)) dirs.push(d);
  }
  return dirs;
}

// ---- Dot tracking ----
export class DotGrid {
  private dots: boolean[][];
  public totalDots: number;
  public dotsEaten: number;
  private powerPellets: Set<string>;

  constructor() {
    this.dots = [];
    this.totalDots = 0;
    this.dotsEaten = 0;
    this.powerPellets = new Set();
    this.initFromMaze();
  }

  private initFromMaze(): void {
    this.dots = [];
    this.totalDots = 0;
    this.powerPellets.clear();
    for (let r = 0; r < MAZE_ROWS; r++) {
      this.dots[r] = [];
      for (let c = 0; c < MAZE_COLS; c++) {
        const cell = getCell(c, r);
        if (cell === CellType.DOT || cell === CellType.POWER) {
          this.dots[r][c] = true;
          this.totalDots++;
          if (cell === CellType.POWER) {
            this.powerPellets.add(`${c},${r}`);
          }
        } else {
          this.dots[r][c] = false;
        }
      }
    }
  }

  hasDot(col: number, row: number): boolean {
    if (row < 0 || row >= MAZE_ROWS || col < 0 || col >= MAZE_COLS) return false;
    return this.dots[row][col];
  }

  isPowerPellet(col: number, row: number): boolean {
    return this.powerPellets.has(`${col},${row}`);
  }

  eatDot(col: number, row: number): boolean {
    if (!this.hasDot(col, row)) return false;
    this.dots[row][col] = false;
    this.dotsEaten++;
    return true;
  }

  allEaten(): boolean {
    return this.dotsEaten >= this.totalDots;
  }

  reset(): void {
    this.dotsEaten = 0;
    this.initFromMaze();
  }
}

// ---- 3D Mesh Generation ----
const NEON_BLUE = 0x0066ff;
const NEON_GLOW = 0x0044cc;
const FLOOR_COLOR = 0x050510;
const DOT_COLOR = 0xffff88;
const POWER_COLOR = 0xffaa00;
const PACMAN_COLOR = 0xffff00;

// Pac-Man skin colors
export enum PacSkin {
  CLASSIC = 'classic',
  NEON = 'neon',
  ICE = 'ice',
  FIRE = 'fire',
  GHOST_WHITE = 'ghost_white',
}

export const PAC_SKIN_COLORS: Record<PacSkin, { main: number; emissive: number }> = {
  [PacSkin.CLASSIC]: { main: 0xffff00, emissive: 0xffff00 },
  [PacSkin.NEON]: { main: 0x00ff88, emissive: 0x00ff66 },
  [PacSkin.ICE]: { main: 0x88ddff, emissive: 0x66bbff },
  [PacSkin.FIRE]: { main: 0xff4400, emissive: 0xff2200 },
  [PacSkin.GHOST_WHITE]: { main: 0xeeeeff, emissive: 0xccccff },
};

export const PAC_SKIN_NAMES: Record<PacSkin, string> = {
  [PacSkin.CLASSIC]: 'Classic Yellow',
  [PacSkin.NEON]: 'Neon Green',
  [PacSkin.ICE]: 'Ice Blue',
  [PacSkin.FIRE]: 'Fire Red',
  [PacSkin.GHOST_WHITE]: 'Phantom',
};

export function buildMazeGroup(pacSkin: PacSkin = PacSkin.CLASSIC): {
  mazeGroup: Group;
  dotMeshes: Map<string, Mesh>;
  pacmanMesh: Mesh;
  ghostMeshes: Mesh[];
  ghostEyes: Array<{ leftWhite: Mesh; rightWhite: Mesh; leftPupil: Mesh; rightPupil: Mesh }>;
} {
  const mazeGroup = new Group();
  const dotMeshes = new Map<string, Mesh>();

  // Floor
  const floorW = MAZE_COLS * CELL_SIZE + 0.2;
  const floorH = MAZE_ROWS * CELL_SIZE + 0.2;
  const floorGeo = new PlaneGeometry(floorW, floorH);
  const floorMat = new MeshStandardMaterial({
    color: FLOOR_COLOR,
    roughness: 0.9,
    metalness: 0.1,
  });
  const floor = new Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, MAZE_OFFSET_Y - WALL_HEIGHT / 2 - 0.001, 0);
  mazeGroup.add(floor);

  // Walls -- instanced mesh
  const wallGeo = new BoxGeometry(CELL_SIZE * 0.95, WALL_HEIGHT, CELL_SIZE * 0.95);
  const wallMat = new MeshStandardMaterial({
    color: NEON_BLUE,
    emissive: new Color(NEON_GLOW),
    emissiveIntensity: 0.4,
    roughness: 0.3,
    metalness: 0.7,
  });

  let wallCount = 0;
  for (let r = 0; r < MAZE_ROWS; r++) {
    for (let c = 0; c < MAZE_COLS; c++) {
      if (getCell(c, r) === CellType.WALL) wallCount++;
    }
  }

  const wallInstanced = new InstancedMesh(wallGeo, wallMat, wallCount);
  const dummy = new Object3D();
  let wallIdx = 0;
  for (let r = 0; r < MAZE_ROWS; r++) {
    for (let c = 0; c < MAZE_COLS; c++) {
      if (getCell(c, r) === CellType.WALL) {
        const pos = gridToWorld(c, r);
        dummy.position.set(pos.x, pos.y, pos.z);
        dummy.updateMatrix();
        wallInstanced.setMatrixAt(wallIdx++, dummy.matrix);
      }
    }
  }
  wallInstanced.instanceMatrix.needsUpdate = true;
  mazeGroup.add(wallInstanced);

  // Wall edge glow
  const edgeGeo = new EdgesGeometry(wallGeo);
  const edgeMat = new LineBasicMaterial({ color: 0x00aaff, transparent: true, opacity: 0.6 });
  for (let r = 0; r < MAZE_ROWS; r++) {
    for (let c = 0; c < MAZE_COLS; c++) {
      if (getCell(c, r) === CellType.WALL) {
        const neighbors = [
          { dr: -1, dc: 0 }, { dr: 1, dc: 0 },
          { dr: 0, dc: -1 }, { dr: 0, dc: 1 },
        ];
        const isBorder = neighbors.some(
          (n) => getCell(c + n.dc, r + n.dr) !== CellType.WALL,
        );
        if (isBorder) {
          const edge = new LineSegments(edgeGeo, edgeMat);
          const pos = gridToWorld(c, r);
          edge.position.set(pos.x, pos.y, pos.z);
          mazeGroup.add(edge);
        }
      }
    }
  }

  // Ghost door
  const doorPos = gridToWorld(10, 9);
  const doorGeo = new BoxGeometry(CELL_SIZE * 3, WALL_HEIGHT * 0.3, CELL_SIZE * 0.2);
  const doorMat = new MeshStandardMaterial({
    color: 0xff66ff,
    emissive: new Color(0xff44ff),
    emissiveIntensity: 0.6,
  });
  const door = new Mesh(doorGeo, doorMat);
  door.position.set(doorPos.x, doorPos.y + WALL_HEIGHT * 0.3, doorPos.z - CELL_SIZE * 0.45);
  mazeGroup.add(door);

  // Dots
  const dotGeo = new SphereGeometry(CELL_SIZE * 0.12, 8, 6);
  const dotMat = new MeshStandardMaterial({
    color: DOT_COLOR,
    emissive: new Color(DOT_COLOR),
    emissiveIntensity: 0.8,
  });

  const powerGeo = new SphereGeometry(CELL_SIZE * 0.25, 12, 8);
  const powerMat = new MeshStandardMaterial({
    color: POWER_COLOR,
    emissive: new Color(POWER_COLOR),
    emissiveIntensity: 1.0,
  });

  for (let r = 0; r < MAZE_ROWS; r++) {
    for (let c = 0; c < MAZE_COLS; c++) {
      const cell = getCell(c, r);
      if (cell === CellType.DOT) {
        const pos = gridToWorld(c, r);
        const dot = new Mesh(dotGeo, dotMat);
        dot.position.set(pos.x, pos.y + WALL_HEIGHT * 0.5, pos.z);
        mazeGroup.add(dot);
        dotMeshes.set(`${c},${r}`, dot);
      } else if (cell === CellType.POWER) {
        const pos = gridToWorld(c, r);
        const power = new Mesh(powerGeo, powerMat);
        power.position.set(pos.x, pos.y + WALL_HEIGHT * 0.5, pos.z);
        mazeGroup.add(power);
        dotMeshes.set(`${c},${r}`, power);
      }
    }
  }

  // Pac-Man mesh with skin
  const skinColors = PAC_SKIN_COLORS[pacSkin];
  const pacGeo = new SphereGeometry(CELL_SIZE * 0.4, 16, 12);
  const pacMat = new MeshStandardMaterial({
    color: skinColors.main,
    emissive: new Color(skinColors.emissive),
    emissiveIntensity: 0.6,
  });
  const pacmanMesh = new Mesh(pacGeo, pacMat);
  const pacStart = gridToWorld(PACMAN_START.col, PACMAN_START.row);
  pacmanMesh.position.set(pacStart.x, pacStart.y + WALL_HEIGHT * 0.5, pacStart.z);
  mazeGroup.add(pacmanMesh);

  // Ghost meshes with eyes
  const ghostGeo = new SphereGeometry(CELL_SIZE * 0.38, 16, 12);
  const ghostColors = [0xff0000, 0xff69b4, 0x00ffff, 0xffa500];
  const ghostMeshes: Mesh[] = [];
  const ghostEyes: Array<{ leftWhite: Mesh; rightWhite: Mesh; leftPupil: Mesh; rightPupil: Mesh }> = [];

  const ghostStartPositions = [
    gridToWorld(BLINKY_START.col, BLINKY_START.row),
    gridToWorld(9, 10),
    gridToWorld(10, 10),
    gridToWorld(11, 10),
  ];

  // Eye geometry (shared)
  const eyeWhiteGeo = new SphereGeometry(CELL_SIZE * 0.12, 8, 6);
  const eyePupilGeo = new SphereGeometry(CELL_SIZE * 0.06, 6, 4);
  const eyeWhiteMat = new MeshBasicMaterial({ color: 0xffffff });
  const eyePupilMat = new MeshBasicMaterial({ color: 0x000088 });

  for (let i = 0; i < 4; i++) {
    const mat = new MeshStandardMaterial({
      color: ghostColors[i],
      emissive: new Color(ghostColors[i]),
      emissiveIntensity: 0.5,
    });
    const ghost = new Mesh(ghostGeo, mat);
    ghost.position.set(
      ghostStartPositions[i].x,
      ghostStartPositions[i].y + WALL_HEIGHT * 0.5,
      ghostStartPositions[i].z,
    );
    mazeGroup.add(ghost);
    ghostMeshes.push(ghost);

    // Eyes - positioned on front face of ghost
    const eyeY = CELL_SIZE * 0.08;
    const eyeSpacing = CELL_SIZE * 0.12;
    const eyeForward = CELL_SIZE * 0.32;

    const leftWhite = new Mesh(eyeWhiteGeo, eyeWhiteMat);
    leftWhite.position.set(-eyeSpacing, eyeY, -eyeForward);
    ghost.add(leftWhite);

    const rightWhite = new Mesh(eyeWhiteGeo, eyeWhiteMat);
    rightWhite.position.set(eyeSpacing, eyeY, -eyeForward);
    ghost.add(rightWhite);

    const leftPupil = new Mesh(eyePupilGeo, eyePupilMat);
    leftPupil.position.set(0, 0, -CELL_SIZE * 0.06);
    leftWhite.add(leftPupil);

    const rightPupil = new Mesh(eyePupilGeo, eyePupilMat);
    rightPupil.position.set(0, 0, -CELL_SIZE * 0.06);
    rightWhite.add(rightPupil);

    ghostEyes.push({ leftWhite, rightWhite, leftPupil, rightPupil });
  }

  // Lighting
  const ambient = new AmbientLight(0x111122, 0.5);
  mazeGroup.add(ambient);

  const topLight = new PointLight(0x4466ff, 2, 8);
  topLight.position.set(0, MAZE_OFFSET_Y + 2, 0);
  mazeGroup.add(topLight);

  // Corner lights for power pellets — find actual power pellet positions
  for (let r = 0; r < MAZE_ROWS; r++) {
    for (let c = 0; c < MAZE_COLS; c++) {
      if (getCell(c, r) === CellType.POWER) {
        const pos = gridToWorld(c, r);
        const light = new PointLight(POWER_COLOR, 0.5, 2);
        light.position.set(pos.x, pos.y + 0.3, pos.z);
        mazeGroup.add(light);
      }
    }
  }

  return { mazeGroup, dotMeshes, pacmanMesh, ghostMeshes, ghostEyes };
}
