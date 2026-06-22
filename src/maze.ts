// === Neon Pac VR -- Maze Definition & 3D Construction ===

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

// ---- Maze layout ----
// # = wall, . = dot, o = power pellet, ' ' = empty/tunnel, G = ghost house
const MAZE_RAW = [
  '#####################',
  '#.........#.........#',
  '#.##.###..#..###.##.#',
  '#o##.###..#..###.##o#',
  '#...................#',
  '#.##.#.#######.#.##.#',
  '#....#....#....#....#',
  '####.###..#..###.####',
  '   #.#.........#.#   ',
  '####.#.##GGG##.#.####',
  '    ...#GGGGG#...    ',
  '####.#.##GGG##.#.####',
  '   #.#.........#.#   ',
  '####.#.#######.#.####',
  '#...................#',
  '#.##.###..#..###.##.#',
  '#o.#..............#o#',
  '##.#.#.#######.#.#.##',
  '#....#....#....#....#',
  '#.#######.#.#######.#',
  '#...................#',
  '#####################',
];

export const MAZE_ROWS = MAZE_RAW.length;
export const MAZE_COLS = MAZE_RAW[0].length;

export const PACMAN_START: GridPos = { col: 10, row: 16 };
export const GHOST_HOUSE_EXIT: GridPos = { col: 10, row: 9 };
export const GHOST_STARTS: GridPos[] = [
  { col: 10, row: 10 }, // Blinky starts outside
  { col: 9, row: 10 },
  { col: 10, row: 10 },
  { col: 11, row: 10 },
];
export const BLINKY_START: GridPos = { col: 10, row: 8 };

// ---- Grid helpers ----
export function getCell(col: number, row: number): CellType {
  if (row < 0 || row >= MAZE_ROWS) return CellType.WALL;
  // Wrap tunnels horizontally
  const c = ((col % MAZE_COLS) + MAZE_COLS) % MAZE_COLS;
  const ch = MAZE_RAW[row][c];
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
  // Tunnel wrap
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
    this.powerPellets.clear();
    for (let r = 0; r < MAZE_ROWS; r++) {
      for (let c = 0; c < MAZE_COLS; c++) {
        const cell = getCell(c, r);
        if (cell === CellType.DOT || cell === CellType.POWER) {
          this.dots[r][c] = true;
          if (cell === CellType.POWER) {
            this.powerPellets.add(`${c},${r}`);
          }
        }
      }
    }
  }
}

// ---- 3D Mesh Generation ----
const NEON_BLUE = 0x0066ff;
const NEON_GLOW = 0x0044cc;
const FLOOR_COLOR = 0x050510;
const DOT_COLOR = 0xffff88;
const POWER_COLOR = 0xffaa00;
const PACMAN_COLOR = 0xffff00;

export function buildMazeGroup(): {
  mazeGroup: Group;
  dotMeshes: Map<string, Mesh>;
  pacmanMesh: Mesh;
  ghostMeshes: Mesh[];
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

  // Walls -- use instanced mesh for performance
  const wallGeo = new BoxGeometry(CELL_SIZE * 0.95, WALL_HEIGHT, CELL_SIZE * 0.95);
  const wallMat = new MeshStandardMaterial({
    color: NEON_BLUE,
    emissive: new Color(NEON_GLOW),
    emissiveIntensity: 0.4,
    roughness: 0.3,
    metalness: 0.7,
  });

  // Count walls
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
        // Only add edges to border walls for performance
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

  // Ghost house walls -- slightly different color
  const ghostHouseMat = new MeshStandardMaterial({
    color: 0x440088,
    emissive: new Color(0x330066),
    emissiveIntensity: 0.3,
    roughness: 0.4,
    metalness: 0.6,
  });

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

  // Pac-Man mesh
  const pacGeo = new SphereGeometry(CELL_SIZE * 0.4, 16, 12);
  const pacMat = new MeshStandardMaterial({
    color: PACMAN_COLOR,
    emissive: new Color(PACMAN_COLOR),
    emissiveIntensity: 0.6,
  });
  const pacmanMesh = new Mesh(pacGeo, pacMat);
  const pacStart = gridToWorld(PACMAN_START.col, PACMAN_START.row);
  pacmanMesh.position.set(pacStart.x, pacStart.y + WALL_HEIGHT * 0.5, pacStart.z);
  mazeGroup.add(pacmanMesh);

  // Ghost meshes
  const ghostGeo = new SphereGeometry(CELL_SIZE * 0.38, 16, 12);
  const ghostNames = ['blinky', 'pinky', 'inky', 'clyde'] as const;
  const ghostColors = [0xff0000, 0xff69b4, 0x00ffff, 0xffa500];
  const ghostMeshes: Mesh[] = [];

  // Blinky starts outside, others in house
  const ghostStartPositions = [
    gridToWorld(BLINKY_START.col, BLINKY_START.row),
    gridToWorld(9, 10),
    gridToWorld(10, 10),
    gridToWorld(11, 10),
  ];

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
  }

  // Lighting
  const ambient = new AmbientLight(0x111122, 0.5);
  mazeGroup.add(ambient);

  const topLight = new PointLight(0x4466ff, 2, 8);
  topLight.position.set(0, MAZE_OFFSET_Y + 2, 0);
  mazeGroup.add(topLight);

  // Corner lights for power pellets
  const corners = [
    gridToWorld(1, 3),
    gridToWorld(19, 3),
    gridToWorld(1, 16),
    gridToWorld(19, 16),
  ];
  for (const corner of corners) {
    const light = new PointLight(POWER_COLOR, 0.5, 2);
    light.position.set(corner.x, corner.y + 0.3, corner.z);
    mazeGroup.add(light);
  }

  return { mazeGroup, dotMeshes, pacmanMesh, ghostMeshes };
}
