// === Neon Pac VR -- Particle ECS System ===

import { createSystem, Vector3 } from '@iwsdk/core';
import { ParticleManager } from './particles';
import { GameManager } from './game';
import { GameState, FRUIT_COLORS, FruitType, GHOST_COLORS, GhostName, CELL_SIZE } from './types';

export class ParticleSystem extends createSystem({}) {
  private particles!: ParticleManager;
  private game!: GameManager;
  private lastState: GameState = GameState.MENU;
  private lastScore = 0;
  private lastGhostsEaten = 0;
  private lastFruitsEaten = 0;
  private ghostTrailTimer = 0;

  setRefs(refs: { particles: ParticleManager; game: GameManager }): void {
    this.particles = refs.particles;
    this.game = refs.game;
  }

  update(delta: number, _time: number): void {
    if (!this.particles || !this.game) return;

    this.particles.update(delta);

    const state = this.game.state;

    // Detect ghost eaten
    const totalGhosts = this.game.statsManager.stats.totalGhostsEaten;
    if (totalGhosts > this.lastGhostsEaten) {
      this.lastGhostsEaten = totalGhosts;
      // Find the ghost that was just eaten
      for (const ghost of this.game.ghosts) {
        if (ghost.mode === 'eaten' as any) {
          const pos = ghost.mesh.position.clone();
          pos.y += 0.03;
          const color = ghost.originalColor;
          this.particles.ghostEatEffect(pos, color);
          break;
        }
      }
    }

    // Detect fruit eaten
    const totalFruits = this.game.statsManager.stats.totalFruitsEaten;
    if (totalFruits > this.lastFruitsEaten) {
      this.lastFruitsEaten = totalFruits;
      const pos = this.game.pacMesh.position.clone();
      pos.y += 0.03;
      this.particles.fruitEffect(pos, 0x44ff44);
    }

    // Detect state changes
    if (state !== this.lastState) {
      if (state === GameState.DYING) {
        const pos = this.game.pacMesh.position.clone();
        this.particles.deathEffect(pos);
      }
      if (state === GameState.LEVEL_COMPLETE) {
        const pos = this.game.pacMesh.position.clone();
        pos.y += 0.1;
        this.particles.levelCompleteEffect(pos);
      }
      this.lastState = state;
    }

    this.lastScore = this.game.score;

    // Ghost trail effects during play
    if (state === GameState.PLAYING) {
      this.ghostTrailTimer += delta;
      if (this.ghostTrailTimer >= 0.12) {
        this.ghostTrailTimer = 0;
        for (const ghost of this.game.ghosts) {
          if (ghost.mode === ('house' as any) || ghost.mode === ('eaten' as any)) continue;
          if (!ghost.mesh.visible) continue;
          const pos = ghost.mesh.position.clone();
          this.particles.ghostTrail(pos, ghost.originalColor);
        }
      }
    }
  }
}
