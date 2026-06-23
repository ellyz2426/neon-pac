// === Neon Pac VR -- Power-Up Manager ===

import {
  Mesh,
  SphereGeometry,
  MeshStandardMaterial,
  Color,
  Group,
  OctahedronGeometry,
} from '@iwsdk/core';
import {
  PowerUpType,
  POWERUP_COLORS,
  POWERUP_DURATIONS,
  CELL_SIZE,
} from './types';
import { gridToWorld, isWalkable, MAZE_COLS, MAZE_ROWS, PACMAN_START } from './maze';

interface PowerUpEntity {
  type: PowerUpType;
  col: number;
  row: number;
  mesh: Mesh;
  spawnTimer: number; // time left on field before despawn
  active: boolean;
}

interface ActiveEffect {
  type: PowerUpType;
  remaining: number;
}

const ALL_POWERUP_TYPES = [
  PowerUpType.SPEED_BOOST,
  PowerUpType.GHOST_FREEZE,
  PowerUpType.SCORE_DOUBLER,
  PowerUpType.SHIELD,
];

export class PowerUpManager {
  private mazeGroup: Group;
  private currentPowerUp: PowerUpEntity | null = null;
  private activeEffects: ActiveEffect[] = [];
  private spawnCooldown = 0;
  private totalCollected = 0;
  private collectedByType: Map<string, number> = new Map();
  private shieldActive = false;

  // Callbacks
  onPowerUpCollected?: (type: PowerUpType) => void;
  onEffectExpired?: (type: PowerUpType) => void;
  onShieldUsed?: () => void;

  constructor(mazeGroup: Group) {
    this.mazeGroup = mazeGroup;
    // Load stats
    try {
      const saved = localStorage.getItem('neon-pac-powerup-stats');
      if (saved) {
        const data = JSON.parse(saved);
        this.totalCollected = data.total ?? 0;
        if (data.byType) {
          for (const [k, v] of Object.entries(data.byType)) {
            this.collectedByType.set(k, v as number);
          }
        }
      }
    } catch { /* ignore */ }
  }

  reset(): void {
    this.removePowerUp();
    this.activeEffects = [];
    this.spawnCooldown = 15 + Math.random() * 10; // first spawn after 15-25s
    this.shieldActive = false;
  }

  update(delta: number, level: number, isPlaying: boolean): void {
    if (!isPlaying) return;

    // Spawn cooldown
    if (!this.currentPowerUp) {
      this.spawnCooldown -= delta;
      if (this.spawnCooldown <= 0) {
        this.spawnPowerUp(level);
        this.spawnCooldown = 20 + Math.random() * 15; // next spawn 20-35s
      }
    }

    // Animate existing power-up
    if (this.currentPowerUp?.active) {
      this.currentPowerUp.spawnTimer -= delta;
      // Floating bob + rotation
      const bob = Math.sin(this.currentPowerUp.spawnTimer * 3) * 0.015;
      this.currentPowerUp.mesh.position.y += bob * delta * 2;
      this.currentPowerUp.mesh.rotation.y += delta * 2;

      // Flash when about to despawn
      if (this.currentPowerUp.spawnTimer < 3) {
        const flash = Math.sin(this.currentPowerUp.spawnTimer * 10) > 0;
        this.currentPowerUp.mesh.visible = flash;
      }

      if (this.currentPowerUp.spawnTimer <= 0) {
        this.removePowerUp();
      }
    }

    // Update active effects
    for (let i = this.activeEffects.length - 1; i >= 0; i--) {
      const eff = this.activeEffects[i];
      if (eff.remaining > 0) {
        eff.remaining -= delta;
        if (eff.remaining <= 0) {
          this.onEffectExpired?.(eff.type);
          this.activeEffects.splice(i, 1);
        }
      }
    }
  }

  private spawnPowerUp(level: number): void {
    if (this.currentPowerUp?.active) return;

    // Pick random type; higher levels = better power-ups more likely
    const weights = [1, 1, 1, 0.5 + level * 0.1];
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * totalWeight;
    let typeIdx = 0;
    for (let i = 0; i < weights.length; i++) {
      r -= weights[i];
      if (r <= 0) { typeIdx = i; break; }
    }
    const type = ALL_POWERUP_TYPES[typeIdx];

    // Find a random walkable position away from pac-man start
    let col = 0, row = 0;
    let attempts = 0;
    do {
      col = Math.floor(Math.random() * (MAZE_COLS - 4)) + 2;
      row = Math.floor(Math.random() * (MAZE_ROWS - 4)) + 2;
      attempts++;
    } while (
      attempts < 50 &&
      (!isWalkable(col, row) ||
        (Math.abs(col - PACMAN_START.col) < 3 && Math.abs(row - PACMAN_START.row) < 3))
    );

    if (!isWalkable(col, row)) return; // couldn't find spot

    const pos = gridToWorld(col, row);
    const color = POWERUP_COLORS[type];

    // Octahedron shape for power-ups (distinct from dots and fruit)
    const geo = new OctahedronGeometry(CELL_SIZE * 0.3, 0);
    const mat = new MeshStandardMaterial({
      color,
      emissive: new Color(color),
      emissiveIntensity: 1.2,
      metalness: 0.6,
      roughness: 0.3,
    });
    const mesh = new Mesh(geo, mat);
    mesh.position.set(pos.x, pos.y + 0.06, pos.z);
    this.mazeGroup.add(mesh);

    this.currentPowerUp = {
      type,
      col,
      row,
      mesh,
      spawnTimer: 12, // visible for 12 seconds
      active: true,
    };
  }

  removePowerUp(): void {
    if (this.currentPowerUp) {
      this.mazeGroup.remove(this.currentPowerUp.mesh);
      this.currentPowerUp.mesh.geometry.dispose();
      (this.currentPowerUp.mesh.material as MeshStandardMaterial).dispose();
      this.currentPowerUp.active = false;
      this.currentPowerUp = null;
    }
  }

  checkCollection(pacCol: number, pacRow: number): PowerUpType | null {
    if (!this.currentPowerUp?.active) return null;
    if (pacCol === this.currentPowerUp.col && pacRow === this.currentPowerUp.row) {
      const type = this.currentPowerUp.type;
      this.removePowerUp();
      this.activateEffect(type);
      this.totalCollected++;
      const prev = this.collectedByType.get(type) ?? 0;
      this.collectedByType.set(type, prev + 1);
      this.saveStats();
      this.onPowerUpCollected?.(type);
      return type;
    }
    return null;
  }

  private activateEffect(type: PowerUpType): void {
    const duration = POWERUP_DURATIONS[type];

    if (type === PowerUpType.SHIELD) {
      this.shieldActive = true;
      // Shield has no timer — it's a one-use absorb
      return;
    }

    // If same type is already active, refresh duration
    const existing = this.activeEffects.find((e) => e.type === type);
    if (existing) {
      existing.remaining = duration;
    } else {
      this.activeEffects.push({ type, remaining: duration });
    }
  }

  // Query active effects
  hasSpeedBoost(): boolean {
    return this.activeEffects.some((e) => e.type === PowerUpType.SPEED_BOOST && e.remaining > 0);
  }

  hasGhostFreeze(): boolean {
    return this.activeEffects.some((e) => e.type === PowerUpType.GHOST_FREEZE && e.remaining > 0);
  }

  hasScoreDoubler(): boolean {
    return this.activeEffects.some((e) => e.type === PowerUpType.SCORE_DOUBLER && e.remaining > 0);
  }

  hasShield(): boolean {
    return this.shieldActive;
  }

  consumeShield(): boolean {
    if (this.shieldActive) {
      this.shieldActive = false;
      this.onShieldUsed?.();
      return true;
    }
    return false;
  }

  getActiveEffectInfo(): Array<{ type: PowerUpType; remaining: number }> {
    const result: Array<{ type: PowerUpType; remaining: number }> = [];
    for (const eff of this.activeEffects) {
      if (eff.remaining > 0) {
        result.push({ type: eff.type, remaining: eff.remaining });
      }
    }
    if (this.shieldActive) {
      result.push({ type: PowerUpType.SHIELD, remaining: -1 });
    }
    return result;
  }

  getTotalCollected(): number { return this.totalCollected; }
  getCollectedByType(type: PowerUpType): number { return this.collectedByType.get(type) ?? 0; }

  private saveStats(): void {
    try {
      const byType: Record<string, number> = {};
      for (const [k, v] of this.collectedByType) { byType[k] = v; }
      localStorage.setItem('neon-pac-powerup-stats', JSON.stringify({
        total: this.totalCollected,
        byType,
      }));
    } catch { /* ignore */ }
  }
}
