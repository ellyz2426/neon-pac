// === Neon Pac VR -- Entry Point (v3: multi-layout, skins, leaderboard) ===

import {
  World,
  PanelUI,
  Follower,
  FogExp2,
  Color,
  MeshStandardMaterial,
  InstancedMesh,
  LineBasicMaterial,
  PointLight,
  Group,
  Vector3,
} from '@iwsdk/core';
import { buildMazeGroup, DotGrid, setMazeLayout, PacSkin } from './maze';
import { getMazeForLevel } from './maze-layouts';
import { GameManager } from './game';
import { GameSystem } from './game-system';
import { UISystem } from './ui-system';
import { ParticleSystem } from './particle-system';
import { ParticleManager } from './particles';
import { MAZE_OFFSET_Y, MazeTheme, THEME_COLORS } from './types';

async function main(): Promise<void> {
  const container = document.getElementById('app') as HTMLDivElement;

  const world = await World.create(container, {
    xr: { offer: 'once' },
    render: {
      near: 0.01,
      far: 50,
    },
    features: {
      locomotion: true,
      physics: false,
    },
  });

  // Camera position for browser mode
  world.camera.position.set(0, 2.4, 1.2);
  world.camera.lookAt(0, MAZE_OFFSET_Y, -0.2);

  // Fog for atmosphere
  world.scene.fog = new FogExp2(0x000811, 0.15);
  world.scene.background = new Color(0x000811);

  // Build maze
  const dotGrid = new DotGrid();
  const { mazeGroup, dotMeshes, pacmanMesh, ghostMeshes, ghostEyes } = buildMazeGroup();
  world.scene.add(mazeGroup);

  // Create game manager with ghost eyes
  const game = new GameManager(pacmanMesh, ghostMeshes, dotGrid, dotMeshes, mazeGroup, ghostEyes);

  // ---- PanelUI setup ----
  // HUD -- world-anchored above maze
  const hudEntity = world.createTransformEntity();
  hudEntity.object3D!.position.set(0, MAZE_OFFSET_Y + 1.0, -1.4);
  hudEntity.object3D!.rotation.x = -0.2;
  hudEntity.addComponent(PanelUI, { config: './ui/hud.json' });

  // Menu panel
  const menuEntity = world.createTransformEntity();
  menuEntity.object3D!.position.set(0, MAZE_OFFSET_Y + 0.5, -0.3);
  menuEntity.object3D!.rotation.x = -0.3;
  menuEntity.addComponent(PanelUI, { config: './ui/menu.json' });

  // Game over panel
  const gameoverEntity = world.createTransformEntity();
  gameoverEntity.object3D!.position.set(0, MAZE_OFFSET_Y + 0.5, -0.3);
  gameoverEntity.object3D!.rotation.x = -0.3;
  gameoverEntity.object3D!.visible = false;
  gameoverEntity.addComponent(PanelUI, { config: './ui/gameover.json' });

  // Pause panel
  const pauseEntity = world.createTransformEntity();
  pauseEntity.object3D!.position.set(0, MAZE_OFFSET_Y + 0.5, -0.3);
  pauseEntity.object3D!.rotation.x = -0.3;
  pauseEntity.object3D!.visible = false;
  pauseEntity.addComponent(PanelUI, { config: './ui/pause.json' });

  // Mode select panel
  const modeselectEntity = world.createTransformEntity();
  modeselectEntity.object3D!.position.set(0, MAZE_OFFSET_Y + 0.5, -0.3);
  modeselectEntity.object3D!.rotation.x = -0.3;
  modeselectEntity.object3D!.visible = false;
  modeselectEntity.addComponent(PanelUI, { config: './ui/modeselect.json' });

  // Achievements panel
  const achievementsEntity = world.createTransformEntity();
  achievementsEntity.object3D!.position.set(0, MAZE_OFFSET_Y + 0.5, -0.3);
  achievementsEntity.object3D!.rotation.x = -0.3;
  achievementsEntity.object3D!.visible = false;
  achievementsEntity.addComponent(PanelUI, { config: './ui/achievements.json' });

  // Settings panel
  const settingsEntity = world.createTransformEntity();
  settingsEntity.object3D!.position.set(0, MAZE_OFFSET_Y + 0.5, -0.3);
  settingsEntity.object3D!.rotation.x = -0.3;
  settingsEntity.object3D!.visible = false;
  settingsEntity.addComponent(PanelUI, { config: './ui/settings.json' });

  // Stats panel
  const statsEntity = world.createTransformEntity();
  statsEntity.object3D!.position.set(0, MAZE_OFFSET_Y + 0.5, -0.3);
  statsEntity.object3D!.rotation.x = -0.3;
  statsEntity.object3D!.visible = false;
  statsEntity.addComponent(PanelUI, { config: './ui/stats.json' });

  // Toast (achievement notification) -- positioned above HUD
  const toastEntity = world.createTransformEntity();
  toastEntity.object3D!.position.set(0, MAZE_OFFSET_Y + 1.35, -1.4);
  toastEntity.object3D!.rotation.x = -0.2;
  toastEntity.object3D!.visible = false;
  toastEntity.addComponent(PanelUI, { config: './ui/toast.json' });

  // Leaderboard panel
  const leaderboardEntity = world.createTransformEntity();
  leaderboardEntity.object3D!.position.set(0, MAZE_OFFSET_Y + 0.5, -0.3);
  leaderboardEntity.object3D!.rotation.x = -0.3;
  leaderboardEntity.object3D!.visible = false;
  leaderboardEntity.addComponent(PanelUI, { config: './ui/leaderboard.json' });

  // Help panel
  const helpEntity = world.createTransformEntity();
  helpEntity.object3D!.position.set(0, MAZE_OFFSET_Y + 0.5, -0.3);
  helpEntity.object3D!.rotation.x = -0.3;
  helpEntity.object3D!.visible = false;
  helpEntity.addComponent(PanelUI, { config: './ui/help.json' });

  // ---- Register systems ----
  world.registerSystem(GameSystem);
  world.registerSystem(UISystem);
  world.registerSystem(ParticleSystem);

  // Particle manager
  const particles = new ParticleManager(mazeGroup);

  const gameSystem = world.getSystem(GameSystem)!;
  gameSystem.setRefs({ game });

  const particleSystem = world.getSystem(ParticleSystem)!;
  particleSystem.setRefs({ particles, game });

  const uiSystem = world.getSystem(UISystem)!;
  uiSystem.setRefs({
    game,
    hudEntity,
    menuEntity,
    gameoverEntity,
    pauseEntity,
    modeselectEntity,
    achievementsEntity,
    settingsEntity,
    statsEntity,
    toastEntity,
    leaderboardEntity,
    helpEntity,
  });

  // Theme change handler
  uiSystem.onThemeChange = (theme: MazeTheme) => {
    const colors = THEME_COLORS[theme];

    // Track theme for achievements
    game.trackThemeUsed(theme);

    // Update fog and background
    (world.scene.fog as FogExp2).color.setHex(colors.fog);
    (world.scene.background as Color).setHex(colors.fog);

    // Update wall materials (traverse instanced meshes and lines)
    mazeGroup.traverse((obj) => {
      if (obj instanceof InstancedMesh) {
        const mat = obj.material as MeshStandardMaterial;
        mat.color.setHex(colors.wall);
        mat.emissive.setHex(colors.wallEmissive);
      }
      if ('isLineSegments' in obj && obj.isLineSegments) {
        const lineMat = (obj as any).material as LineBasicMaterial;
        lineMat.color.setHex(colors.edge);
      }
    });

    // Update dot materials
    for (const [, mesh] of dotMeshes) {
      const mat = mesh.material as MeshStandardMaterial;
      mat.color.setHex(colors.dot);
      mat.emissive.setHex(colors.dot);
    }
  };

  // ---- Level flash effect ----
  let levelFlashTimer = 0;
  const savedWallEmissive = new Color(0x0044cc);

  game.onLevelFlash = () => {
    levelFlashTimer = 0.6;
    game.audio.playLevelFlash();
    // Bright flash on walls
    mazeGroup.traverse((obj) => {
      if (obj instanceof InstancedMesh) {
        const mat = obj.material as MeshStandardMaterial;
        savedWallEmissive.copy(mat.emissive);
        mat.emissiveIntensity = 2.0;
      }
    });
  };

  // ---- Camera shake effect ----
  const baseCamPos = world.camera.position.clone();
  let shakeTimer = 0;
  let shakeIntensity = 0;

  game.onCameraShake = (intensity: number) => {
    shakeTimer = 0.4;
    shakeIntensity = intensity;
    baseCamPos.copy(world.camera.position);
  };

  // ---- Ambient music on state change ----
  const origOnStateChange = game.onStateChange;
  game.onStateChange = (state) => {
    origOnStateChange?.(state);
    if (state === 'playing' || state === 'ready') {
      game.audio.startAmbient();
      game.audio.startSiren(0);
    } else if (state === 'menu' || state === 'gameover') {
      game.audio.stopAmbient();
      game.audio.stopSiren();
    }
  };

  // ---- Siren level change ----
  game.onSirenChange = (level) => {
    game.audio.updateSirenLevel(level);
  };

  // ---- Streak change ----
  game.onStreakChange = (multiplier, _count) => {
    if (multiplier > 1) {
      game.audio.playStreakUp(multiplier);
    }
  };

  // Per-frame effects hook via a simple rAF-backed ticker
  // (IWSDK systems handle the main game loop; this is for camera/visual FX only)
  let lastFxTime = performance.now();
  function fxTick(): void {
    const now = performance.now();
    const dt = Math.min((now - lastFxTime) / 1000, 0.1);
    lastFxTime = now;

    // Level flash fade
    if (levelFlashTimer > 0) {
      levelFlashTimer -= dt;
      if (levelFlashTimer <= 0) {
        mazeGroup.traverse((obj) => {
          if (obj instanceof InstancedMesh) {
            const mat = obj.material as MeshStandardMaterial;
            mat.emissiveIntensity = 0.4;
          }
        });
      }
    }

    // Camera shake
    if (shakeTimer > 0) {
      shakeTimer -= dt;
      const t = shakeTimer / 0.4;
      const amp = shakeIntensity * t * 0.02;
      world.camera.position.set(
        baseCamPos.x + (Math.random() - 0.5) * amp,
        baseCamPos.y + (Math.random() - 0.5) * amp * 0.5,
        baseCamPos.z + (Math.random() - 0.5) * amp,
      );
      if (shakeTimer <= 0) {
        world.camera.position.copy(baseCamPos);
      }
    }

    requestAnimationFrame(fxTick);
  }
  requestAnimationFrame(fxTick);
}

main().catch(console.error);
