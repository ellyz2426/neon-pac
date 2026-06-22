// === Neon Pac VR -- Entry Point ===

import {
  World,
  PanelUI,
  FogExp2,
  Color,
} from '@iwsdk/core';
import { buildMazeGroup, DotGrid } from './maze';
import { GameManager } from './game';
import { GameSystem } from './game-system';
import { UISystem } from './ui-system';
import { MAZE_OFFSET_Y } from './types';

async function main(): Promise<void> {
  const container = document.getElementById('app') as HTMLDivElement;

  // Create world -- VR with browser fallback
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

  // Set camera position for browser mode (above the maze, looking down)
  world.camera.position.set(0, 2.4, 1.2);
  world.camera.lookAt(0, MAZE_OFFSET_Y, -0.2);

  // Fog for atmosphere
  world.scene.fog = new FogExp2(0x000811, 0.15);
  world.scene.background = new Color(0x000811);

  // Build maze
  const dotGrid = new DotGrid();
  const { mazeGroup, dotMeshes, pacmanMesh, ghostMeshes } = buildMazeGroup();
  world.scene.add(mazeGroup);

  // Create game manager
  const game = new GameManager(pacmanMesh, ghostMeshes, dotGrid, dotMeshes);

  // ---- PanelUI setup ----
  // HUD -- world-anchored above maze
  const hudEntity = world.createTransformEntity();
  hudEntity.object3D!.position.set(0, MAZE_OFFSET_Y + 1.0, -1.4);
  hudEntity.object3D!.rotation.x = -0.2;
  hudEntity.addComponent(PanelUI, { config: './ui/hud.json' });

  // Menu panel -- centered above maze
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

  // ---- Register systems ----
  world.registerSystem(GameSystem);
  world.registerSystem(UISystem);

  const gameSystem = world.getSystem(GameSystem)!;
  gameSystem.setRefs({ game });

  const uiSystem = world.getSystem(UISystem)!;
  uiSystem.setRefs({
    game,
    hudEntity,
    menuEntity,
    gameoverEntity,
    pauseEntity,
  });
}

main().catch(console.error);
