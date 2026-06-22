// === Neon Pac VR -- Achievements System ===

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string; // emoji-like label
  category: AchievementCategory;
  unlocked: boolean;
  unlockedAt?: number; // timestamp
}

export enum AchievementCategory {
  SCORE = 'score',
  GHOST = 'ghost',
  LEVEL = 'level',
  SKILL = 'skill',
  FRUIT = 'fruit',
  SURVIVAL = 'survival',
  SPEED = 'speed',
  MASTERY = 'mastery',
}

const ACHIEVEMENT_DEFS: Omit<Achievement, 'unlocked' | 'unlockedAt'>[] = [
  // Score achievements
  { id: 'score_1k', title: 'Point Collector', description: 'Score 1,000 points', icon: '[1K]', category: AchievementCategory.SCORE },
  { id: 'score_5k', title: 'Score Hunter', description: 'Score 5,000 points', icon: '[5K]', category: AchievementCategory.SCORE },
  { id: 'score_10k', title: 'Point Master', description: 'Score 10,000 points', icon: '[10K]', category: AchievementCategory.SCORE },
  { id: 'score_25k', title: 'Score Legend', description: 'Score 25,000 points', icon: '[25K]', category: AchievementCategory.SCORE },
  { id: 'score_50k', title: 'Neon Champion', description: 'Score 50,000 points', icon: '[50K]', category: AchievementCategory.SCORE },
  { id: 'score_100k', title: 'Arcade Deity', description: 'Score 100,000 points', icon: '[100K]', category: AchievementCategory.SCORE },

  // Ghost achievements
  { id: 'ghost_first', title: 'Ghost Buster', description: 'Eat your first ghost', icon: '[GB]', category: AchievementCategory.GHOST },
  { id: 'ghost_2chain', title: 'Double Trouble', description: 'Eat 2 ghosts in one power pellet', icon: '[x2]', category: AchievementCategory.GHOST },
  { id: 'ghost_3chain', title: 'Triple Threat', description: 'Eat 3 ghosts in one power pellet', icon: '[x3]', category: AchievementCategory.GHOST },
  { id: 'ghost_4chain', title: 'Quad Kill', description: 'Eat all 4 ghosts in one power pellet', icon: '[x4]', category: AchievementCategory.GHOST },
  { id: 'ghost_10total', title: 'Ghost Hunter', description: 'Eat 10 ghosts total', icon: '[10G]', category: AchievementCategory.GHOST },
  { id: 'ghost_25total', title: 'Phantom Slayer', description: 'Eat 25 ghosts total', icon: '[25G]', category: AchievementCategory.GHOST },
  { id: 'ghost_50total', title: 'Spirit Crusher', description: 'Eat 50 ghosts total', icon: '[50G]', category: AchievementCategory.GHOST },
  { id: 'ghost_100total', title: 'Ghost Overlord', description: 'Eat 100 ghosts total', icon: '[100]', category: AchievementCategory.GHOST },
  { id: 'ghost_blinky', title: 'Red Alert', description: 'Eat Blinky', icon: '[BL]', category: AchievementCategory.GHOST },
  { id: 'ghost_pinky', title: 'Pretty in Pink', description: 'Eat Pinky', icon: '[PK]', category: AchievementCategory.GHOST },
  { id: 'ghost_inky', title: 'Feeling Blue', description: 'Eat Inky', icon: '[IK]', category: AchievementCategory.GHOST },
  { id: 'ghost_clyde', title: 'Orange Crush', description: 'Eat Clyde', icon: '[CL]', category: AchievementCategory.GHOST },

  // Level achievements
  { id: 'level_2', title: 'Moving Up', description: 'Reach level 2', icon: '[L2]', category: AchievementCategory.LEVEL },
  { id: 'level_5', title: 'Seasoned Player', description: 'Reach level 5', icon: '[L5]', category: AchievementCategory.LEVEL },
  { id: 'level_10', title: 'Maze Master', description: 'Reach level 10', icon: '[L10]', category: AchievementCategory.LEVEL },
  { id: 'level_15', title: 'Pac Veteran', description: 'Reach level 15', icon: '[L15]', category: AchievementCategory.LEVEL },
  { id: 'level_20', title: 'Unstoppable', description: 'Reach level 20', icon: '[L20]', category: AchievementCategory.LEVEL },
  { id: 'level_25', title: 'Neon Immortal', description: 'Reach level 25', icon: '[L25]', category: AchievementCategory.LEVEL },

  // Skill achievements
  { id: 'perfect_level', title: 'Perfect Clear', description: 'Clear a level without dying', icon: '[PC]', category: AchievementCategory.SKILL },
  { id: 'no_power', title: 'Raw Skill', description: 'Clear a level without using power pellets', icon: '[RS]', category: AchievementCategory.SKILL },
  { id: 'speed_clear', title: 'Speed Demon', description: 'Clear a level in under 60 seconds', icon: '[SD]', category: AchievementCategory.SKILL },
  { id: 'close_call', title: 'Close Call', description: 'Eat a ghost in the last second of fright', icon: '[CC]', category: AchievementCategory.SKILL },
  { id: 'tunnel_master', title: 'Tunnel Runner', description: 'Use the tunnel 10 times in one game', icon: '[TR]', category: AchievementCategory.SKILL },
  { id: 'survivor_no_death', title: 'Iron Pac', description: 'Complete 3 levels without losing a life', icon: '[IP]', category: AchievementCategory.SKILL },

  // Fruit achievements
  { id: 'fruit_first', title: 'Fruity', description: 'Eat your first fruit', icon: '[FR]', category: AchievementCategory.FRUIT },
  { id: 'fruit_5', title: 'Fruit Salad', description: 'Eat 5 fruits total', icon: '[F5]', category: AchievementCategory.FRUIT },
  { id: 'fruit_15', title: 'Fruit Fanatic', description: 'Eat 15 fruits total', icon: '[F15]', category: AchievementCategory.FRUIT },
  { id: 'fruit_cherry', title: 'Cherry Picker', description: 'Eat a cherry', icon: '[CH]', category: AchievementCategory.FRUIT },
  { id: 'fruit_strawberry', title: 'Berry Nice', description: 'Eat a strawberry', icon: '[SB]', category: AchievementCategory.FRUIT },
  { id: 'fruit_orange', title: 'Citrus Burst', description: 'Eat an orange', icon: '[OR]', category: AchievementCategory.FRUIT },
  { id: 'fruit_apple', title: 'Apple a Day', description: 'Eat an apple', icon: '[AP]', category: AchievementCategory.FRUIT },
  { id: 'fruit_melon', title: 'Melon Baller', description: 'Eat a melon', icon: '[ML]', category: AchievementCategory.FRUIT },
  { id: 'fruit_key', title: 'Key Master', description: 'Eat a key (level 13+)', icon: '[KY]', category: AchievementCategory.FRUIT },

  // Survival achievements
  { id: 'survive_30s', title: 'Still Here', description: 'Survive 30 seconds on a level', icon: '[30]', category: AchievementCategory.SURVIVAL },
  { id: 'survive_60s', title: 'Minute Man', description: 'Survive 60 seconds on a level', icon: '[60]', category: AchievementCategory.SURVIVAL },
  { id: 'survive_120s', title: 'Marathon Pac', description: 'Survive 120 seconds on a level', icon: '[2M]', category: AchievementCategory.SURVIVAL },
  { id: 'games_5', title: 'Getting Started', description: 'Play 5 games', icon: '[G5]', category: AchievementCategory.SURVIVAL },
  { id: 'games_10', title: 'Regular', description: 'Play 10 games', icon: '[G10]', category: AchievementCategory.SURVIVAL },
  { id: 'games_25', title: 'Dedicated', description: 'Play 25 games', icon: '[G25]', category: AchievementCategory.SURVIVAL },
  { id: 'games_50', title: 'Arcade Addict', description: 'Play 50 games', icon: '[G50]', category: AchievementCategory.SURVIVAL },

  // Speed run achievements
  { id: 'speed_l1_90', title: 'Quick Start', description: 'Clear level 1 in under 90 seconds', icon: '[Q1]', category: AchievementCategory.SPEED },
  { id: 'speed_l1_60', title: 'Blitz', description: 'Clear level 1 in under 60 seconds', icon: '[BZ]', category: AchievementCategory.SPEED },
  { id: 'speed_l1_45', title: 'Lightning', description: 'Clear level 1 in under 45 seconds', icon: '[LT]', category: AchievementCategory.SPEED },
  { id: 'speed_3levels_5min', title: 'Speed Run', description: 'Clear 3 levels in under 5 minutes', icon: '[SR]', category: AchievementCategory.SPEED },

  // Mastery achievements
  { id: 'all_ghosts_one_game', title: 'Ghost Collector', description: 'Eat all 4 ghost types in one game', icon: '[GC]', category: AchievementCategory.MASTERY },
  { id: 'dots_1000', title: 'Dot Hoarder', description: 'Eat 1,000 dots total', icon: '[1KD]', category: AchievementCategory.MASTERY },
  { id: 'dots_5000', title: 'Dot Devourer', description: 'Eat 5,000 dots total', icon: '[5KD]', category: AchievementCategory.MASTERY },
  { id: 'dots_10000', title: 'Dot Dynasty', description: 'Eat 10,000 dots total', icon: '[10K]', category: AchievementCategory.MASTERY },
  { id: 'power_10', title: 'Power Trip', description: 'Use 10 power pellets total', icon: '[P10]', category: AchievementCategory.MASTERY },
  { id: 'power_50', title: 'Power Surge', description: 'Use 50 power pellets total', icon: '[P50]', category: AchievementCategory.MASTERY },
  { id: 'flawless_3', title: 'Flawless Streak', description: 'Clear 3 consecutive levels without dying', icon: '[F3]', category: AchievementCategory.MASTERY },
  { id: 'comeback', title: 'Comeback King', description: 'Win a level with 1 life remaining', icon: '[CK]', category: AchievementCategory.MASTERY },

  // Mode-specific
  { id: 'mode_speed', title: 'Speed Freak', description: 'Complete a game in Speed mode', icon: '[SF]', category: AchievementCategory.SPEED },
  { id: 'mode_dark', title: 'Night Vision', description: 'Complete a game in Dark mode', icon: '[NV]', category: AchievementCategory.MASTERY },
  { id: 'mode_survival', title: 'Survivor', description: 'Reach level 5 in Survival mode', icon: '[SV]', category: AchievementCategory.SURVIVAL },
  { id: 'mode_all', title: 'Versatile', description: 'Play all game modes', icon: '[VA]', category: AchievementCategory.MASTERY },

  // Secret / rare
  { id: 'eat_all_fruit', title: 'Fruit Completionist', description: 'Eat every type of fruit', icon: '[FC]', category: AchievementCategory.MASTERY },
  { id: 'quad_kill_twice', title: 'Double Quad', description: 'Get two quad kills in one game', icon: '[DQ]', category: AchievementCategory.GHOST },
  { id: 'no_tunnel', title: 'Straight Path', description: 'Clear a level without using tunnels', icon: '[SP]', category: AchievementCategory.SKILL },
  { id: 'ten_k_no_death', title: 'Perfection', description: 'Score 10K without dying', icon: '[PF]', category: AchievementCategory.MASTERY },
  { id: 'extra_life', title: '1-UP!', description: 'Earn an extra life', icon: '[1U]', category: AchievementCategory.SCORE },

  // Maze achievements
  { id: 'maze_corridors', title: 'Corridor Runner', description: 'Play the Corridors maze', icon: '[CR]', category: AchievementCategory.LEVEL },
  { id: 'maze_arena', title: 'Arena Champion', description: 'Play the Arena maze', icon: '[AR]', category: AchievementCategory.LEVEL },
  { id: 'maze_spiral', title: 'Spiral Master', description: 'Play the Spiral maze', icon: '[SM]', category: AchievementCategory.LEVEL },

  // Skin achievements
  { id: 'skin_change', title: 'Fashion Forward', description: 'Change your Pac-Man skin', icon: '[SK]', category: AchievementCategory.MASTERY },
];

const STORAGE_KEY = 'neon-pac-achievements';

export class AchievementManager {
  achievements: Achievement[] = [];
  private newUnlocks: Achievement[] = [];

  // Callback for UI notification
  onUnlock?: (achievement: Achievement) => void;

  constructor() {
    this.loadAchievements();
  }

  private loadAchievements(): void {
    const saved = this.loadFromStorage();
    this.achievements = ACHIEVEMENT_DEFS.map((def) => ({
      ...def,
      unlocked: saved.has(def.id),
      unlockedAt: saved.get(def.id),
    }));
  }

  private loadFromStorage(): Map<string, number> {
    const map = new Map<string, number>();
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw) as Record<string, number>;
        for (const [k, v] of Object.entries(data)) {
          map.set(k, v);
        }
      }
    } catch { /* ignore */ }
    return map;
  }

  private saveToStorage(): void {
    try {
      const data: Record<string, number> = {};
      for (const a of this.achievements) {
        if (a.unlocked && a.unlockedAt) {
          data[a.id] = a.unlockedAt;
        }
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch { /* ignore */ }
  }

  unlock(id: string): boolean {
    const a = this.achievements.find((x) => x.id === id);
    if (!a || a.unlocked) return false;
    a.unlocked = true;
    a.unlockedAt = Date.now();
    this.newUnlocks.push(a);
    this.saveToStorage();
    this.onUnlock?.(a);
    return true;
  }

  popNewUnlock(): Achievement | undefined {
    return this.newUnlocks.shift();
  }

  hasNewUnlocks(): boolean {
    return this.newUnlocks.length > 0;
  }

  getUnlockedCount(): number {
    return this.achievements.filter((a) => a.unlocked).length;
  }

  getTotalCount(): number {
    return this.achievements.length;
  }

  getByCategory(cat: AchievementCategory): Achievement[] {
    return this.achievements.filter((a) => a.category === cat);
  }

  isUnlocked(id: string): boolean {
    return this.achievements.find((a) => a.id === id)?.unlocked ?? false;
  }

  // Get achievements as paginated list (8 per page)
  getPage(page: number, perPage = 8): { items: Achievement[]; totalPages: number } {
    const total = this.achievements.length;
    const totalPages = Math.ceil(total / perPage);
    const start = page * perPage;
    const items = this.achievements.slice(start, start + perPage);
    return { items, totalPages };
  }

  // Get unlocked achievements for display
  getUnlocked(): Achievement[] {
    return this.achievements.filter((a) => a.unlocked);
  }

  resetAll(): void {
    for (const a of this.achievements) {
      a.unlocked = false;
      a.unlockedAt = undefined;
    }
    this.newUnlocks = [];
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
  }
}
