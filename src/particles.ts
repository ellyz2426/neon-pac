// === Neon Pac VR -- Particle Effects System ===

import {
  Group,
  Mesh,
  SphereGeometry,
  MeshBasicMaterial,
  Color,
  Vector3,
} from '@iwsdk/core';

interface Particle {
  mesh: Mesh;
  velocity: Vector3;
  life: number;
  maxLife: number;
}

export class ParticleManager {
  private particles: Particle[] = [];
  private group: Group;
  private geo: SphereGeometry;
  private pool: Mesh[] = [];

  constructor(parent: Group) {
    this.group = new Group();
    parent.add(this.group);
    this.geo = new SphereGeometry(0.008, 4, 3);
  }

  // Burst of particles at position with given color
  burst(position: Vector3, color: number, count = 12, speed = 0.5): void {
    for (let i = 0; i < count; i++) {
      const mesh = this.getMesh(color);
      mesh.position.copy(position);
      mesh.visible = true;

      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
      const elevation = (Math.random() - 0.3) * Math.PI;
      const spd = speed * (0.5 + Math.random() * 0.5);

      const velocity = new Vector3(
        Math.cos(angle) * Math.cos(elevation) * spd,
        Math.sin(elevation) * spd * 0.5 + 0.2,
        Math.sin(angle) * Math.cos(elevation) * spd,
      );

      const life = 0.5 + Math.random() * 0.5;
      this.particles.push({ mesh, velocity, life, maxLife: life });
    }
  }

  // Score popup effect — spray upward
  scorePopup(position: Vector3, color: number): void {
    this.burst(position, color, 8, 0.3);
  }

  // Ghost eat effect — big burst
  ghostEatEffect(position: Vector3, ghostColor: number): void {
    this.burst(position, ghostColor, 20, 0.8);
    this.burst(position, 0xffffff, 6, 0.4);
  }

  // Death effect
  deathEffect(position: Vector3): void {
    this.burst(position, 0xffff00, 24, 0.6);
    this.burst(position, 0xff4400, 12, 0.4);
  }

  // Level complete celebration
  levelCompleteEffect(position: Vector3): void {
    const colors = [0xff0000, 0x00ff00, 0x0066ff, 0xffff00, 0xff00ff, 0x00ffff];
    for (const c of colors) {
      this.burst(position, c, 6, 0.7);
    }
  }

  // Fruit eat effect
  fruitEffect(position: Vector3, fruitColor: number): void {
    this.burst(position, fruitColor, 16, 0.6);
    this.burst(position, 0xffffff, 4, 0.3);
  }

  update(delta: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= delta;

      if (p.life <= 0) {
        p.mesh.visible = false;
        this.pool.push(p.mesh);
        this.particles.splice(i, 1);
        continue;
      }

      // Move
      p.mesh.position.x += p.velocity.x * delta;
      p.mesh.position.y += p.velocity.y * delta;
      p.mesh.position.z += p.velocity.z * delta;

      // Gravity
      p.velocity.y -= 1.5 * delta;

      // Fade out
      const t = p.life / p.maxLife;
      const scale = t * 1.5;
      p.mesh.scale.setScalar(scale);
      const mat = p.mesh.material as MeshBasicMaterial;
      mat.opacity = t;
    }
  }

  private getMesh(color: number): Mesh {
    if (this.pool.length > 0) {
      const mesh = this.pool.pop()!;
      (mesh.material as MeshBasicMaterial).color.setHex(color);
      (mesh.material as MeshBasicMaterial).opacity = 1;
      mesh.scale.setScalar(1);
      return mesh;
    }

    const mat = new MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 1,
    });
    const mesh = new Mesh(this.geo, mat);
    this.group.add(mesh);
    return mesh;
  }
}
