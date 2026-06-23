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

  // ---- Round 4 additions ----

  // Score milestones
  { id: 'score_200k', title: 'Score Titan', description: 'Score 200,000 points', icon: '[200K]', category: AchievementCategory.SCORE },
  { id: 'score_500k', title: 'Score Demigod', description: 'Score 500,000 points', icon: '[500K]', category: AchievementCategory.SCORE },

  // Ghost milestones
  { id: 'ghost_200total', title: 'Ghost Annihilator', description: 'Eat 200 ghosts total', icon: '[200]', category: AchievementCategory.GHOST },
  { id: 'ghost_500total', title: 'Ghost Apocalypse', description: 'Eat 500 ghosts total', icon: '[500]', category: AchievementCategory.GHOST },
  { id: 'triple_quad', title: 'Triple Quad', description: 'Get 3 quad kills in one game', icon: '[TQ]', category: AchievementCategory.GHOST },

  // Level milestones
  { id: 'level_30', title: 'Endless Runner', description: 'Reach level 30', icon: '[L30]', category: AchievementCategory.LEVEL },
  { id: 'level_50', title: 'Neon God', description: 'Reach level 50', icon: '[L50]', category: AchievementCategory.LEVEL },

  // Skill achievements
  { id: 'flawless_5', title: 'Flawless Five', description: 'Clear 5 levels without dying', icon: '[F5]', category: AchievementCategory.SKILL },
  { id: 'flawless_10', title: 'Flawless Ten', description: 'Clear 10 levels without dying', icon: '[FA]', category: AchievementCategory.SKILL },
  { id: 'speed_clear_30', title: 'Turbo Clear', description: 'Clear a level in under 30 seconds', icon: '[TC]', category: AchievementCategory.SPEED },
  { id: 'tunnel_25', title: 'Tunnel Rat', description: 'Use tunnels 25 times in one game', icon: '[T25]', category: AchievementCategory.SKILL },

  // Fruit achievements
  { id: 'fruit_30', title: 'Fruit Baron', description: 'Eat 30 fruits total', icon: '[F30]', category: AchievementCategory.FRUIT },
  { id: 'fruit_galaxian', title: 'Galactic', description: 'Eat a Galaxian', icon: '[GX]', category: AchievementCategory.FRUIT },
  { id: 'fruit_bell', title: 'Bell Ringer', description: 'Eat a bell', icon: '[BL]', category: AchievementCategory.FRUIT },

  // Survival achievements
  { id: 'survive_180s', title: 'Eternal Pac', description: 'Survive 180 seconds on a level', icon: '[3M]', category: AchievementCategory.SURVIVAL },
  { id: 'survive_300s', title: 'Iron Will', description: 'Survive 5 minutes on a level', icon: '[5M]', category: AchievementCategory.SURVIVAL },
  { id: 'games_100', title: 'Century', description: 'Play 100 games', icon: '[100]', category: AchievementCategory.SURVIVAL },

  // Speed achievements
  { id: 'speed_l2_90', title: 'Quick Level 2', description: 'Clear level 2 in under 90 seconds', icon: '[Q2]', category: AchievementCategory.SPEED },
  { id: 'speed_5levels_10min', title: 'Speed Demon 5', description: 'Clear 5 levels in under 10 min', icon: '[S5]', category: AchievementCategory.SPEED },

  // Mastery achievements
  { id: 'dots_25000', title: 'Dot Emperor', description: 'Eat 25,000 dots total', icon: '[25K]', category: AchievementCategory.MASTERY },
  { id: 'power_100', title: 'Power Overload', description: 'Use 100 power pellets total', icon: '[P10]', category: AchievementCategory.MASTERY },
  { id: 'all_mazes', title: 'Maze Explorer', description: 'Play all 4 maze layouts', icon: '[ME]', category: AchievementCategory.MASTERY },
  { id: 'all_skins_used', title: 'Fashionista', description: 'Try all 5 Pac-Man skins', icon: '[FS]', category: AchievementCategory.MASTERY },
  { id: 'all_themes_used', title: 'Color Master', description: 'Try all 5 maze themes', icon: '[CM]', category: AchievementCategory.MASTERY },
  { id: 'all_difficulties', title: 'All Difficulties', description: 'Play on all 3 difficulties', icon: '[AD]', category: AchievementCategory.MASTERY },
  { id: 'daily_complete', title: 'Daily Hero', description: 'Complete a Daily Challenge level', icon: '[DC]', category: AchievementCategory.MASTERY },
  { id: 'daily_3', title: 'Consistent', description: 'Complete 3 Daily Challenges', icon: '[D3]', category: AchievementCategory.MASTERY },
  { id: 'daily_7', title: 'Dedicated Daily', description: 'Complete 7 Daily Challenges', icon: '[D7]', category: AchievementCategory.MASTERY },
  { id: 'marathon_l10', title: 'Marathon Master', description: 'Reach level 10 in Marathon', icon: '[MM]', category: AchievementCategory.MASTERY },
  { id: 'total_time_1h', title: 'Time Investor', description: 'Play for 1 hour total', icon: '[1H]', category: AchievementCategory.MASTERY },
  { id: 'total_time_5h', title: 'Time Lord', description: 'Play for 5 hours total', icon: '[5H]', category: AchievementCategory.MASTERY },
  { id: 'extra_life_3', title: 'Life Collector', description: 'Earn 3 extra lives in one game', icon: '[3U]', category: AchievementCategory.SCORE },

  // ---- Round 5 additions ----

  // Streak achievements
  { id: 'streak_2x', title: 'Streak Starter', description: 'Reach a 2x dot streak', icon: '[S2]', category: AchievementCategory.SKILL },
  { id: 'streak_3x', title: 'Combo King', description: 'Reach a 3x dot streak', icon: '[S3]', category: AchievementCategory.SKILL },
  { id: 'streak_4x', title: 'Streak Master', description: 'Reach a 4x dot streak', icon: '[S4]', category: AchievementCategory.SKILL },
  { id: 'streak_5x', title: 'Unstoppable Streak', description: 'Reach the max 5x dot streak', icon: '[S5]', category: AchievementCategory.SKILL },

  // New maze achievements
  { id: 'maze_labyrinth', title: 'Lost & Found', description: 'Play the Labyrinth maze', icon: '[LB]', category: AchievementCategory.LEVEL },
  { id: 'maze_fortress', title: 'Siege Breaker', description: 'Play the Fortress maze', icon: '[FT]', category: AchievementCategory.LEVEL },
  { id: 'all_6_mazes', title: 'Cartographer', description: 'Play all 6 maze layouts', icon: '[6M]', category: AchievementCategory.MASTERY },

  // Ghost mastery
  { id: 'fright_flash_eat', title: 'Last Second', description: 'Eat a ghost during the fright flash warning', icon: '[LS]', category: AchievementCategory.GHOST },
  { id: 'ghost_1000total', title: 'Ghost Extinction', description: 'Eat 1,000 ghosts total', icon: '[1KG]', category: AchievementCategory.GHOST },

  // Score milestones
  { id: 'score_1m', title: 'Millionaire', description: 'Score 1,000,000 points', icon: '[1M]', category: AchievementCategory.SCORE },

  // Level milestones
  { id: 'level_75', title: 'Pac Legend', description: 'Reach level 75', icon: '[L75]', category: AchievementCategory.LEVEL },
  { id: 'level_100', title: 'Century Runner', description: 'Reach level 100', icon: '[100]', category: AchievementCategory.LEVEL },

  // Mode mastery
  { id: 'zen_l10', title: 'Zen Master', description: 'Reach level 10 in Zen mode', icon: '[ZM]', category: AchievementCategory.MASTERY },
  { id: 'dark_l10', title: 'Night Owl', description: 'Reach level 10 in Dark mode', icon: '[NO]', category: AchievementCategory.MASTERY },
  { id: 'survival_l10', title: 'Iron Survivor', description: 'Reach level 10 in Survival mode', icon: '[IS]', category: AchievementCategory.SURVIVAL },

  // Speed achievements
  { id: 'speed_clear_20', title: 'Sonic Clear', description: 'Clear a level in under 20 seconds', icon: '[S20]', category: AchievementCategory.SPEED },
  { id: 'speed_10levels_20min', title: 'Turbo Marathon', description: 'Clear 10 levels in under 20 min', icon: '[TM]', category: AchievementCategory.SPEED },

  // Endurance
  { id: 'total_time_10h', title: 'Pac Lifer', description: 'Play for 10 hours total', icon: '[10H]', category: AchievementCategory.MASTERY },
  { id: 'games_250', title: 'Veteran', description: 'Play 250 games', icon: '[250]', category: AchievementCategory.SURVIVAL },
  { id: 'dots_50000', title: 'Dot Singularity', description: 'Eat 50,000 dots total', icon: '[50K]', category: AchievementCategory.MASTERY },

  // ---- Round 6 additions: Power-ups ----
  { id: 'powerup_first', title: 'Power Player', description: 'Collect your first power-up', icon: '[PU]', category: AchievementCategory.SKILL },
  { id: 'powerup_10', title: 'Powered Up', description: 'Collect 10 power-ups', icon: '[P10]', category: AchievementCategory.SKILL },
  { id: 'powerup_25', title: 'Power Addict', description: 'Collect 25 power-ups', icon: '[P25]', category: AchievementCategory.SKILL },
  { id: 'powerup_50', title: 'Power Hoarder', description: 'Collect 50 power-ups', icon: '[P50]', category: AchievementCategory.MASTERY },
  { id: 'powerup_100', title: 'Power Overlord', description: 'Collect 100 power-ups', icon: '[POL]', category: AchievementCategory.MASTERY },
  { id: 'powerup_speed_5', title: 'Speed Junkie', description: 'Collect 5 Speed Boosts', icon: '[SJ]', category: AchievementCategory.SKILL },
  { id: 'powerup_freeze_5', title: 'Ice Master', description: 'Collect 5 Ghost Freezes', icon: '[IM]', category: AchievementCategory.SKILL },
  { id: 'powerup_doubler_5', title: 'Double Agent', description: 'Collect 5 Score Doublers', icon: '[DA]', category: AchievementCategory.SKILL },
  { id: 'powerup_shield_5', title: 'Shield Bearer', description: 'Collect 5 Shields', icon: '[SB]', category: AchievementCategory.SKILL },
  { id: 'powerup_all_types', title: 'Power Collector', description: 'Collect all 4 power-up types', icon: '[PC]', category: AchievementCategory.MASTERY },
  { id: 'shield_save', title: 'Close Shave', description: 'Survive a ghost hit with Shield', icon: '[CS]', category: AchievementCategory.SURVIVAL },
  { id: 'freeze_quad', title: 'Frozen Feast', description: 'Eat 4 ghosts while they are frozen', icon: '[FF]', category: AchievementCategory.GHOST },
  { id: 'doubler_10k', title: 'Double or Nothing', description: 'Score 10K in one Score Doubler activation', icon: '[DN]', category: AchievementCategory.SCORE },
  { id: 'speed_l1_30', title: 'Warp Speed', description: 'Clear level 1 in under 30s with Speed Boost', icon: '[WS]', category: AchievementCategory.SPEED },
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
