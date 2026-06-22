// === Neon Pac VR -- UI System (PanelUI / ECS) ===

import {
  createSystem,
  PanelUI,
  PanelDocument,
  UIKitDocument,
  UIKit,
  eq,
} from '@iwsdk/core';
import { GameManager } from './game';
import { GameState } from './types';

export class UISystem extends createSystem({
  hud: {
    required: [PanelUI, PanelDocument],
    where: [eq(PanelUI, 'config', './ui/hud.json')],
  },
  menu: {
    required: [PanelUI, PanelDocument],
    where: [eq(PanelUI, 'config', './ui/menu.json')],
  },
  gameover: {
    required: [PanelUI, PanelDocument],
    where: [eq(PanelUI, 'config', './ui/gameover.json')],
  },
  pause: {
    required: [PanelUI, PanelDocument],
    where: [eq(PanelUI, 'config', './ui/pause.json')],
  },
}) {
  private game!: GameManager;

  // Panel entity refs for visibility toggling
  private hudEntity: any = null;
  private menuEntity: any = null;
  private gameoverEntity: any = null;
  private pauseEntity: any = null;

  // Doc refs
  private hudDoc: UIKitDocument | null = null;
  private menuDoc: UIKitDocument | null = null;
  private gameoverDoc: UIKitDocument | null = null;
  private pauseDoc: UIKitDocument | null = null;

  setRefs(refs: {
    game: GameManager;
    hudEntity: any;
    menuEntity: any;
    gameoverEntity: any;
    pauseEntity: any;
  }): void {
    this.game = refs.game;
    this.hudEntity = refs.hudEntity;
    this.menuEntity = refs.menuEntity;
    this.gameoverEntity = refs.gameoverEntity;
    this.pauseEntity = refs.pauseEntity;

    // Register game callbacks
    this.game.onScoreChange = (score, highScore) => this.updateScore(score, highScore);
    this.game.onLivesChange = (lives) => this.updateLives(lives);
    this.game.onLevelChange = (level) => this.updateLevel(level);
    this.game.onStateChange = (state) => this.updateState(state);
  }

  init(): void {
    // HUD panel ready
    this.queries.hud.subscribe('qualify', (entity) => {
      const doc = entity.getValue(PanelDocument, 'document') as UIKitDocument | undefined;
      if (!doc) return;
      this.hudDoc = doc;
    });

    // Menu panel ready
    this.queries.menu.subscribe('qualify', (entity) => {
      const doc = entity.getValue(PanelDocument, 'document') as UIKitDocument | undefined;
      if (!doc) return;
      this.menuDoc = doc;

      const startBtn = doc.getElementById('btn-start') as UIKit.Text | undefined;
      startBtn?.addEventListener('click', () => {
        this.game.audio.playMenuSelect();
        this.game.startGame();
      });
    });

    // Game over panel ready
    this.queries.gameover.subscribe('qualify', (entity) => {
      const doc = entity.getValue(PanelDocument, 'document') as UIKitDocument | undefined;
      if (!doc) return;
      this.gameoverDoc = doc;

      const retryBtn = doc.getElementById('btn-retry') as UIKit.Text | undefined;
      retryBtn?.addEventListener('click', () => {
        this.game.audio.playMenuSelect();
        this.game.startGame();
      });

      const menuBtn = doc.getElementById('btn-menu') as UIKit.Text | undefined;
      menuBtn?.addEventListener('click', () => {
        this.game.audio.playMenuSelect();
        this.game.returnToMenu();
      });
    });

    // Pause panel ready
    this.queries.pause.subscribe('qualify', (entity) => {
      const doc = entity.getValue(PanelDocument, 'document') as UIKitDocument | undefined;
      if (!doc) return;
      this.pauseDoc = doc;

      const resumeBtn = doc.getElementById('btn-resume') as UIKit.Text | undefined;
      resumeBtn?.addEventListener('click', () => {
        this.game.audio.playMenuSelect();
        this.game.togglePause();
      });

      const quitBtn = doc.getElementById('btn-quit') as UIKit.Text | undefined;
      quitBtn?.addEventListener('click', () => {
        this.game.audio.playMenuSelect();
        this.game.returnToMenu();
      });
    });
  }

  private updateScore(score: number, highScore: number): void {
    if (!this.hudDoc) return;
    const scoreEl = this.hudDoc.getElementById('score') as UIKit.Text | undefined;
    scoreEl?.setProperties({ text: String(score) });
    const highEl = this.hudDoc.getElementById('high-score') as UIKit.Text | undefined;
    highEl?.setProperties({ text: `HI: ${highScore}` });
  }

  private updateLives(lives: number): void {
    if (!this.hudDoc) return;
    const livesEl = this.hudDoc.getElementById('lives') as UIKit.Text | undefined;
    // Use repeated characters for lives
    const livesStr = Array(Math.max(0, lives)).fill('O').join(' ');
    livesEl?.setProperties({ text: livesStr });
  }

  private updateLevel(level: number): void {
    if (!this.hudDoc) return;
    const levelEl = this.hudDoc.getElementById('level') as UIKit.Text | undefined;
    levelEl?.setProperties({ text: `LVL ${level}` });
  }

  private updateState(state: GameState): void {
    // Toggle panel visibility based on state
    const showMenu = state === GameState.MENU;
    const showHud = state !== GameState.MENU;
    const showGameOver = state === GameState.GAME_OVER;
    const showPause = state === GameState.PAUSED;

    if (this.menuEntity?.object3D) this.menuEntity.object3D.visible = showMenu;
    if (this.hudEntity?.object3D) this.hudEntity.object3D.visible = showHud;
    if (this.gameoverEntity?.object3D) this.gameoverEntity.object3D.visible = showGameOver;
    if (this.pauseEntity?.object3D) this.pauseEntity.object3D.visible = showPause;

    // Update game over panel
    if (showGameOver && this.gameoverDoc) {
      const finalScore = this.gameoverDoc.getElementById('final-score') as UIKit.Text | undefined;
      finalScore?.setProperties({ text: `Score: ${this.game.score}` });
      const finalLevel = this.gameoverDoc.getElementById('final-level') as UIKit.Text | undefined;
      finalLevel?.setProperties({ text: `Level: ${this.game.level}` });
    }
  }

  update(_delta: number, _time: number): void {
    // Keep HUD updated every frame for smooth display
  }
}
