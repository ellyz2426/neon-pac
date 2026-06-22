// === Neon Pac VR -- UI System (PanelUI / ECS, v3: leaderboard, skins) ===

import {
  createSystem,
  PanelUI,
  PanelDocument,
  UIKitDocument,
  UIKit,
  eq,
} from '@iwsdk/core';
import { GameManager } from './game';
import { GameState, GameMode, Difficulty, MazeTheme } from './types';
import { PacSkin, PAC_SKIN_NAMES } from './maze';
import type { Achievement } from './achievements';

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
  modeselect: {
    required: [PanelUI, PanelDocument],
    where: [eq(PanelUI, 'config', './ui/modeselect.json')],
  },
  achievements: {
    required: [PanelUI, PanelDocument],
    where: [eq(PanelUI, 'config', './ui/achievements.json')],
  },
  settings: {
    required: [PanelUI, PanelDocument],
    where: [eq(PanelUI, 'config', './ui/settings.json')],
  },
  stats: {
    required: [PanelUI, PanelDocument],
    where: [eq(PanelUI, 'config', './ui/stats.json')],
  },
  toast: {
    required: [PanelUI, PanelDocument],
    where: [eq(PanelUI, 'config', './ui/toast.json')],
  },
  leaderboard: {
    required: [PanelUI, PanelDocument],
    where: [eq(PanelUI, 'config', './ui/leaderboard.json')],
  },
}) {
  private game!: GameManager;

  // Panel entity refs
  private hudEntity: any = null;
  private menuEntity: any = null;
  private gameoverEntity: any = null;
  private pauseEntity: any = null;
  private modeselectEntity: any = null;
  private achievementsEntity: any = null;
  private settingsEntity: any = null;
  private statsEntity: any = null;
  private toastEntity: any = null;
  private leaderboardEntity: any = null;

  // Doc refs
  private hudDoc: UIKitDocument | null = null;
  private menuDoc: UIKitDocument | null = null;
  private gameoverDoc: UIKitDocument | null = null;
  private pauseDoc: UIKitDocument | null = null;
  private modeselectDoc: UIKitDocument | null = null;
  private achievementsDoc: UIKitDocument | null = null;
  private settingsDoc: UIKitDocument | null = null;
  private statsDoc: UIKitDocument | null = null;
  private toastDoc: UIKitDocument | null = null;
  private leaderboardDoc: UIKitDocument | null = null;

  // Achievement page state
  private achPage = 0;

  // Toast display
  private toastTimer = 0;
  private toastQueue: Achievement[] = [];

  // Leaderboard filter
  private lbFilter = 'all';

  // Currently showing overlay
  private overlayShowing: string | null = null;

  // Theme change callback
  onThemeChange?: (theme: MazeTheme) => void;

  // Wall glow animation state
  private wallGlowTime = 0;

  setRefs(refs: {
    game: GameManager;
    hudEntity: any;
    menuEntity: any;
    gameoverEntity: any;
    pauseEntity: any;
    modeselectEntity: any;
    achievementsEntity: any;
    settingsEntity: any;
    statsEntity: any;
    toastEntity: any;
    leaderboardEntity: any;
  }): void {
    this.game = refs.game;
    this.hudEntity = refs.hudEntity;
    this.menuEntity = refs.menuEntity;
    this.gameoverEntity = refs.gameoverEntity;
    this.pauseEntity = refs.pauseEntity;
    this.modeselectEntity = refs.modeselectEntity;
    this.achievementsEntity = refs.achievementsEntity;
    this.settingsEntity = refs.settingsEntity;
    this.statsEntity = refs.statsEntity;
    this.toastEntity = refs.toastEntity;
    this.leaderboardEntity = refs.leaderboardEntity;

    // Register game callbacks
    this.game.onScoreChange = (score, highScore) => this.updateScore(score, highScore);
    this.game.onLivesChange = (lives) => this.updateLives(lives);
    this.game.onLevelChange = (level) => this.updateLevel(level);
    this.game.onStateChange = (state) => this.updateState(state);
    this.game.onComboDisplay = (text) => this.showCombo(text);
    this.game.onFruitEaten = (_type, score) => this.showCombo(`+${score}`);
    this.game.onMazeChange = (name) => this.updateMazeLabel(name);

    // Achievement notifications
    this.game.achievements.onUnlock = (ach) => this.queueToast(ach);
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
      this.updateMenuLabels();

      const startBtn = doc.getElementById('btn-start') as UIKit.Text | undefined;
      startBtn?.addEventListener('click', () => {
        this.game.audio.playMenuSelect();
        this.game.startGame();
      });

      const modesBtn = doc.getElementById('btn-modes') as UIKit.Text | undefined;
      modesBtn?.addEventListener('click', () => {
        this.game.audio.playMenuSelect();
        this.game.goToModeSelect();
      });

      const achBtn = doc.getElementById('btn-achievements') as UIKit.Text | undefined;
      achBtn?.addEventListener('click', () => {
        this.game.audio.playMenuSelect();
        this.showOverlay('achievements');
      });

      const statsBtn = doc.getElementById('btn-stats') as UIKit.Text | undefined;
      statsBtn?.addEventListener('click', () => {
        this.game.audio.playMenuSelect();
        this.showOverlay('stats');
      });

      const settingsBtn = doc.getElementById('btn-settings') as UIKit.Text | undefined;
      settingsBtn?.addEventListener('click', () => {
        this.game.audio.playMenuSelect();
        this.showOverlay('settings');
      });

      // Leaderboard button
      const lbBtn = doc.getElementById('btn-leaderboard') as UIKit.Text | undefined;
      lbBtn?.addEventListener('click', () => {
        this.game.audio.playMenuSelect();
        this.showOverlay('leaderboard');
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

    // Mode select panel ready
    this.queries.modeselect.subscribe('qualify', (entity) => {
      const doc = entity.getValue(PanelDocument, 'document') as UIKitDocument | undefined;
      if (!doc) return;
      this.modeselectDoc = doc;

      const modes: Array<{ btn: string; mode: GameMode }> = [
        { btn: 'btn-classic', mode: GameMode.CLASSIC },
        { btn: 'btn-speed', mode: GameMode.SPEED },
        { btn: 'btn-dark', mode: GameMode.DARK },
        { btn: 'btn-survival', mode: GameMode.SURVIVAL },
        { btn: 'btn-marathon', mode: GameMode.MARATHON },
        { btn: 'btn-zen', mode: GameMode.ZEN },
      ];

      for (const { btn, mode } of modes) {
        const el = doc.getElementById(btn) as UIKit.Text | undefined;
        el?.addEventListener('click', () => {
          this.game.audio.playMenuSelect();
          this.game.gameMode = mode;
          this.updateMenuLabels();
          this.game.returnToMenu();
        });
      }

      const backBtn = doc.getElementById('btn-back-mode') as UIKit.Text | undefined;
      backBtn?.addEventListener('click', () => {
        this.game.audio.playMenuSelect();
        this.game.returnToMenu();
      });
    });

    // Achievements panel ready
    this.queries.achievements.subscribe('qualify', (entity) => {
      const doc = entity.getValue(PanelDocument, 'document') as UIKitDocument | undefined;
      if (!doc) return;
      this.achievementsDoc = doc;

      const prevBtn = doc.getElementById('btn-ach-prev') as UIKit.Text | undefined;
      prevBtn?.addEventListener('click', () => {
        this.game.audio.playMenuSelect();
        if (this.achPage > 0) {
          this.achPage--;
          this.renderAchievementsPage();
        }
      });

      const nextBtn = doc.getElementById('btn-ach-next') as UIKit.Text | undefined;
      nextBtn?.addEventListener('click', () => {
        this.game.audio.playMenuSelect();
        const totalPages = Math.ceil(this.game.achievements.getTotalCount() / 8);
        if (this.achPage < totalPages - 1) {
          this.achPage++;
          this.renderAchievementsPage();
        }
      });

      const closeBtn = doc.getElementById('btn-ach-close') as UIKit.Text | undefined;
      closeBtn?.addEventListener('click', () => {
        this.game.audio.playMenuSelect();
        this.hideOverlay();
      });
    });

    // Settings panel ready
    this.queries.settings.subscribe('qualify', (entity) => {
      const doc = entity.getValue(PanelDocument, 'document') as UIKitDocument | undefined;
      if (!doc) return;
      this.settingsDoc = doc;

      const soundBtn = doc.getElementById('btn-sound') as UIKit.Text | undefined;
      soundBtn?.addEventListener('click', () => {
        const muted = this.game.audio.toggleMute();
        const lbl = doc.getElementById('sound-label') as UIKit.Text | undefined;
        lbl?.setProperties({ text: muted ? 'OFF' : 'ON' });
        this.game.audio.playMenuSelect();
      });

      // Difficulty buttons
      const diffs: Array<{ btn: string; diff: Difficulty }> = [
        { btn: 'btn-easy', diff: Difficulty.EASY },
        { btn: 'btn-normal', diff: Difficulty.NORMAL },
        { btn: 'btn-hard', diff: Difficulty.HARD },
      ];
      for (const { btn, diff } of diffs) {
        const el = doc.getElementById(btn) as UIKit.Text | undefined;
        el?.addEventListener('click', () => {
          this.game.audio.playMenuSelect();
          this.game.setDifficulty(diff);
          this.updateMenuLabels();
        });
      }

      // Theme buttons
      const themes: Array<{ btn: string; theme: MazeTheme }> = [
        { btn: 'btn-theme-blue', theme: MazeTheme.NEON_BLUE },
        { btn: 'btn-theme-red', theme: MazeTheme.CYBER_RED },
        { btn: 'btn-theme-green', theme: MazeTheme.MATRIX_GREEN },
        { btn: 'btn-theme-purple', theme: MazeTheme.VAPOR_PURPLE },
        { btn: 'btn-theme-orange', theme: MazeTheme.SUNSET_ORANGE },
      ];
      for (const { btn, theme } of themes) {
        const el = doc.getElementById(btn) as UIKit.Text | undefined;
        el?.addEventListener('click', () => {
          this.game.audio.playMenuSelect();
          this.onThemeChange?.(theme);
        });
      }

      // Skin buttons
      const skins: Array<{ btn: string; skin: PacSkin }> = [
        { btn: 'btn-skin-classic', skin: PacSkin.CLASSIC },
        { btn: 'btn-skin-neon', skin: PacSkin.NEON },
        { btn: 'btn-skin-ice', skin: PacSkin.ICE },
        { btn: 'btn-skin-fire', skin: PacSkin.FIRE },
        { btn: 'btn-skin-ghost', skin: PacSkin.GHOST_WHITE },
      ];
      for (const { btn, skin } of skins) {
        const el = doc.getElementById(btn) as UIKit.Text | undefined;
        el?.addEventListener('click', () => {
          this.game.audio.playMenuSelect();
          this.game.setPacSkin(skin);
          this.game.achievements.unlock('skin_change');
          const skinLabel = doc.getElementById('current-skin') as UIKit.Text | undefined;
          skinLabel?.setProperties({ text: `Skin: ${PAC_SKIN_NAMES[skin]}` });
        });
      }

      const closeBtn = doc.getElementById('btn-settings-close') as UIKit.Text | undefined;
      closeBtn?.addEventListener('click', () => {
        this.game.audio.playMenuSelect();
        this.hideOverlay();
      });
    });

    // Stats panel ready
    this.queries.stats.subscribe('qualify', (entity) => {
      const doc = entity.getValue(PanelDocument, 'document') as UIKitDocument | undefined;
      if (!doc) return;
      this.statsDoc = doc;

      const closeBtn = doc.getElementById('btn-stats-close') as UIKit.Text | undefined;
      closeBtn?.addEventListener('click', () => {
        this.game.audio.playMenuSelect();
        this.hideOverlay();
      });
    });

    // Toast panel ready
    this.queries.toast.subscribe('qualify', (entity) => {
      const doc = entity.getValue(PanelDocument, 'document') as UIKitDocument | undefined;
      if (!doc) return;
      this.toastDoc = doc;
    });

    // Leaderboard panel ready
    this.queries.leaderboard.subscribe('qualify', (entity) => {
      const doc = entity.getValue(PanelDocument, 'document') as UIKitDocument | undefined;
      if (!doc) return;
      this.leaderboardDoc = doc;

      // Filter buttons
      const filters: Array<{ btn: string; filter: string }> = [
        { btn: 'lb-all', filter: 'all' },
        { btn: 'lb-classic', filter: 'classic' },
        { btn: 'lb-speed', filter: 'speed' },
        { btn: 'lb-dark', filter: 'dark' },
        { btn: 'lb-survival', filter: 'survival' },
      ];
      for (const { btn, filter } of filters) {
        const el = doc.getElementById(btn) as UIKit.Text | undefined;
        el?.addEventListener('click', () => {
          this.game.audio.playMenuSelect();
          this.lbFilter = filter;
          this.renderLeaderboard();
        });
      }

      const closeBtn = doc.getElementById('btn-lb-close') as UIKit.Text | undefined;
      closeBtn?.addEventListener('click', () => {
        this.game.audio.playMenuSelect();
        this.hideOverlay();
      });
    });
  }

  // ---- Overlays ----
  private showOverlay(name: string): void {
    this.overlayShowing = name;
    if (this.menuEntity?.object3D) this.menuEntity.object3D.visible = false;

    if (name === 'achievements' && this.achievementsEntity?.object3D) {
      this.achievementsEntity.object3D.visible = true;
      this.achPage = 0;
      this.renderAchievementsPage();
    }
    if (name === 'settings' && this.settingsEntity?.object3D) {
      this.settingsEntity.object3D.visible = true;
    }
    if (name === 'stats' && this.statsEntity?.object3D) {
      this.statsEntity.object3D.visible = true;
      this.renderStats();
    }
    if (name === 'leaderboard' && this.leaderboardEntity?.object3D) {
      this.leaderboardEntity.object3D.visible = true;
      this.lbFilter = 'all';
      this.renderLeaderboard();
    }
  }

  private hideOverlay(): void {
    this.overlayShowing = null;
    if (this.achievementsEntity?.object3D) this.achievementsEntity.object3D.visible = false;
    if (this.settingsEntity?.object3D) this.settingsEntity.object3D.visible = false;
    if (this.statsEntity?.object3D) this.statsEntity.object3D.visible = false;
    if (this.leaderboardEntity?.object3D) this.leaderboardEntity.object3D.visible = false;

    if (this.game.state === GameState.MENU && this.menuEntity?.object3D) {
      this.menuEntity.object3D.visible = true;
    }
  }

  // ---- Leaderboard rendering ----
  private renderLeaderboard(): void {
    if (!this.leaderboardDoc) return;

    const modeFilter = this.lbFilter === 'all' ? undefined : this.lbFilter;
    const entries = this.game.leaderboard.getTopScores(8, modeFilter);

    const emptyEl = this.leaderboardDoc.getElementById('lb-empty') as UIKit.Text | undefined;
    if (entries.length === 0) {
      emptyEl?.setProperties({ text: 'No scores yet. Play to earn your spot!' });
    } else {
      emptyEl?.setProperties({ text: ' ' });
    }

    for (let i = 0; i < 8; i++) {
      const entry = entries[i];
      const rankEl = this.leaderboardDoc.getElementById(`lb-rank-${i}`) as UIKit.Text | undefined;
      const scoreEl = this.leaderboardDoc.getElementById(`lb-score-${i}`) as UIKit.Text | undefined;
      const levelEl = this.leaderboardDoc.getElementById(`lb-level-${i}`) as UIKit.Text | undefined;
      const modeEl = this.leaderboardDoc.getElementById(`lb-mode-${i}`) as UIKit.Text | undefined;
      const dateEl = this.leaderboardDoc.getElementById(`lb-date-${i}`) as UIKit.Text | undefined;

      if (entry) {
        rankEl?.setProperties({ text: `${i + 1}` });
        scoreEl?.setProperties({ text: String(entry.score) });
        levelEl?.setProperties({ text: `L${entry.level}` });
        const modeNames: Record<string, string> = {
          classic: 'Classic', speed: 'Speed', dark: 'Dark',
          survival: 'Survival', marathon: 'Marathon', zen: 'Zen',
        };
        modeEl?.setProperties({ text: modeNames[entry.mode] ?? entry.mode });
        const d = new Date(entry.date);
        dateEl?.setProperties({ text: `${d.getMonth() + 1}/${d.getDate()}` });
      } else {
        rankEl?.setProperties({ text: `${i + 1}` });
        scoreEl?.setProperties({ text: '-' });
        levelEl?.setProperties({ text: '-' });
        modeEl?.setProperties({ text: '-' });
        dateEl?.setProperties({ text: '-' });
      }
    }
  }

  // ---- Achievement rendering ----
  private renderAchievementsPage(): void {
    if (!this.achievementsDoc) return;
    const { items, totalPages } = this.game.achievements.getPage(this.achPage, 8);

    const counterEl = this.achievementsDoc.getElementById('ach-counter') as UIKit.Text | undefined;
    counterEl?.setProperties({
      text: `${this.game.achievements.getUnlockedCount()} / ${this.game.achievements.getTotalCount()}`,
    });

    const pageEl = this.achievementsDoc.getElementById('ach-page') as UIKit.Text | undefined;
    pageEl?.setProperties({ text: `${this.achPage + 1} / ${totalPages}` });

    for (let i = 0; i < 8; i++) {
      const a = items[i];
      const iconEl = this.achievementsDoc.getElementById(`ach-icon-${i}`) as UIKit.Text | undefined;
      const nameEl = this.achievementsDoc.getElementById(`ach-name-${i}`) as UIKit.Text | undefined;
      const descEl = this.achievementsDoc.getElementById(`ach-desc-${i}`) as UIKit.Text | undefined;

      if (a) {
        iconEl?.setProperties({ text: a.unlocked ? a.icon : '[ ]' });
        nameEl?.setProperties({ text: a.unlocked ? a.title : '???' });
        descEl?.setProperties({ text: a.unlocked ? a.description : a.description });
      } else {
        iconEl?.setProperties({ text: '' });
        nameEl?.setProperties({ text: '' });
        descEl?.setProperties({ text: '' });
      }
    }
  }

  // ---- Stats rendering ----
  private renderStats(): void {
    if (!this.statsDoc) return;
    const s = this.game.statsManager.stats;
    const sm = this.game.statsManager;

    const set = (id: string, text: string) => {
      const el = this.statsDoc!.getElementById(id) as UIKit.Text | undefined;
      el?.setProperties({ text });
    };

    set('stat-highscore', String(s.highScore));
    set('stat-totalscore', String(s.totalScore));
    set('stat-highlevel', String(s.highestLevel));
    set('stat-games', String(s.totalGamesPlayed));
    set('stat-time', sm.getFormattedTime(s.totalTimePlayed));
    set('stat-dots', String(s.totalDotsEaten));
    set('stat-powers', String(s.totalPowerPelletsUsed));
    set('stat-ghosts', String(s.totalGhostsEaten));
    set('stat-quads', String(s.quadKills));
    set('stat-fruits', String(s.totalFruitsEaten));
    set('stat-deaths', String(s.totalDeaths));
    set('stat-streak', String(s.bestConsecutiveLevelsNoDeath));
  }

  // ---- Toast ----
  private queueToast(ach: Achievement): void {
    this.toastQueue.push(ach);
    this.game.audio.playAchievement();
  }

  private showToast(ach: Achievement): void {
    if (!this.toastDoc || !this.toastEntity?.object3D) return;
    const iconEl = this.toastDoc.getElementById('toast-icon') as UIKit.Text | undefined;
    iconEl?.setProperties({ text: ach.icon });
    const titleEl = this.toastDoc.getElementById('toast-title') as UIKit.Text | undefined;
    titleEl?.setProperties({ text: ach.title });
    const descEl = this.toastDoc.getElementById('toast-desc') as UIKit.Text | undefined;
    descEl?.setProperties({ text: ach.description });
    this.toastEntity.object3D.visible = true;
    this.toastTimer = 3.0;
  }

  // Combo display
  private comboTimer = 0;

  private showCombo(text: string): void {
    if (!this.hudDoc) return;
    const comboEl = this.hudDoc.getElementById('combo-text') as UIKit.Text | undefined;
    comboEl?.setProperties({ text });
    this.comboTimer = 1.5;
  }

  // Maze label
  private updateMazeLabel(name: string): void {
    if (!this.hudDoc) return;
    const mazeEl = this.hudDoc.getElementById('maze-label') as UIKit.Text | undefined;
    mazeEl?.setProperties({ text: name });
  }

  // ---- HUD updates ----
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
    const livesStr = Array(Math.max(0, lives)).fill('O').join(' ');
    livesEl?.setProperties({ text: livesStr });
  }

  private updateLevel(level: number): void {
    if (!this.hudDoc) return;
    const levelEl = this.hudDoc.getElementById('level') as UIKit.Text | undefined;
    levelEl?.setProperties({ text: `LVL ${level}` });
    const modeLabels: Record<GameMode, string> = {
      [GameMode.CLASSIC]: 'Classic',
      [GameMode.SPEED]: 'Speed',
      [GameMode.DARK]: 'Dark',
      [GameMode.SURVIVAL]: 'Survival',
      [GameMode.MARATHON]: 'Marathon',
      [GameMode.ZEN]: 'Zen',
    };
    const modeEl = this.hudDoc.getElementById('mode-indicator') as UIKit.Text | undefined;
    modeEl?.setProperties({ text: modeLabels[this.game.gameMode] ?? 'Classic' });
  }

  private updateMenuLabels(): void {
    if (!this.menuDoc) return;
    const modeEl = this.menuDoc.getElementById('current-mode') as UIKit.Text | undefined;
    const modeLabels: Record<GameMode, string> = {
      [GameMode.CLASSIC]: 'Classic',
      [GameMode.SPEED]: 'Speed Run',
      [GameMode.DARK]: 'Dark Mode',
      [GameMode.SURVIVAL]: 'Survival',
      [GameMode.MARATHON]: 'Marathon',
      [GameMode.ZEN]: 'Zen',
    };
    modeEl?.setProperties({ text: `Mode: ${modeLabels[this.game.gameMode]}` });

    const diffEl = this.menuDoc.getElementById('current-diff') as UIKit.Text | undefined;
    const diffLabels: Record<Difficulty, string> = {
      [Difficulty.EASY]: 'Easy',
      [Difficulty.NORMAL]: 'Normal',
      [Difficulty.HARD]: 'Hard',
    };
    diffEl?.setProperties({ text: `Difficulty: ${diffLabels[this.game.difficulty]}` });
  }

  private updateState(state: GameState): void {
    const showMenu = state === GameState.MENU;
    const showModeSelect = state === GameState.MODE_SELECT;
    const showHud = state === GameState.PLAYING || state === GameState.READY || state === GameState.DYING || state === GameState.LEVEL_COMPLETE;
    const showGameOver = state === GameState.GAME_OVER;
    const showPause = state === GameState.PAUSED;

    if (this.menuEntity?.object3D) this.menuEntity.object3D.visible = showMenu && !this.overlayShowing;
    if (this.modeselectEntity?.object3D) this.modeselectEntity.object3D.visible = showModeSelect;
    if (this.hudEntity?.object3D) this.hudEntity.object3D.visible = showHud;
    if (this.gameoverEntity?.object3D) this.gameoverEntity.object3D.visible = showGameOver;
    if (this.pauseEntity?.object3D) this.pauseEntity.object3D.visible = showPause;

    if (showMenu) {
      this.updateMenuLabels();
    }

    if (showGameOver && this.gameoverDoc) {
      const finalScore = this.gameoverDoc.getElementById('final-score') as UIKit.Text | undefined;
      finalScore?.setProperties({ text: String(this.game.score) });
      const finalLevel = this.gameoverDoc.getElementById('final-level') as UIKit.Text | undefined;
      finalLevel?.setProperties({ text: String(this.game.level) });
      const finalGhosts = this.gameoverDoc.getElementById('final-ghosts') as UIKit.Text | undefined;
      finalGhosts?.setProperties({ text: String(this.game.statsManager.currentGameGhostsEaten) });
      const finalDots = this.gameoverDoc.getElementById('final-dots') as UIKit.Text | undefined;
      finalDots?.setProperties({ text: String(this.game.dotGrid.dotsEaten) });
      const finalFruits = this.gameoverDoc.getElementById('final-fruits') as UIKit.Text | undefined;
      finalFruits?.setProperties({ text: String(this.game.statsManager.currentGameFruitsEaten) });
      const finalTime = this.gameoverDoc.getElementById('final-time') as UIKit.Text | undefined;
      finalTime?.setProperties({ text: this.game.statsManager.getFormattedTime(this.game.statsManager.currentGameTime) });
      const newHigh = this.gameoverDoc.getElementById('new-high') as UIKit.Text | undefined;
      if (this.game.score >= this.game.highScore && this.game.score > 0) {
        newHigh?.setProperties({ text: 'NEW HIGH SCORE!' });
      } else {
        newHigh?.setProperties({ text: '' });
      }

      // Show rank
      const rank = this.game.leaderboard.getRank(this.game.score);
      const rankEl = this.gameoverDoc.getElementById('final-rank') as UIKit.Text | undefined;
      rankEl?.setProperties({ text: `Rank: #${rank}` });
    }
  }

  update(delta: number, _time: number): void {
    // Toast management
    if (this.toastTimer > 0) {
      this.toastTimer -= delta;
      if (this.toastTimer <= 0) {
        if (this.toastEntity?.object3D) this.toastEntity.object3D.visible = false;
      }
    } else if (this.toastQueue.length > 0) {
      const ach = this.toastQueue.shift()!;
      this.showToast(ach);
    }

    // Combo text fade
    if (this.comboTimer > 0) {
      this.comboTimer -= delta;
      if (this.comboTimer <= 0 && this.hudDoc) {
        const comboEl = this.hudDoc.getElementById('combo-text') as UIKit.Text | undefined;
        comboEl?.setProperties({ text: ' ' });
      }
    }
  }
}
