// === Neon Pac VR -- Stats Manager ===

export interface GameStats {
  totalGamesPlayed: number;
  totalScore: number;
  highScore: number;
  totalDotsEaten: number;
  totalPowerPelletsUsed: number;
  totalGhostsEaten: number;
  totalFruitsEaten: number;
  totalDeaths: number;
  totalLevelsCleared: number;
  highestLevel: number;
  totalTimePlayed: number; // seconds
  longestGameTime: number;
  bestLevelTime: number; // fastest level clear
  quadKills: number;
  tunnelUses: number;
  fruitsEatenByType: Record<string, number>;
  ghostsEatenByName: Record<string, number>;
  modesPlayed: Set<string>;
  consecutiveLevelsNoDeath: number;
  bestConsecutiveLevelsNoDeath: number;
}

const STORAGE_KEY = 'neon-pac-stats';

export class StatsManager {
  stats: GameStats;

  // Per-game tracking (reset each game)
  currentGameTime = 0;
  currentLevelTime = 0;
  currentLevelDeaths = 0;
  currentGameGhostsEaten = 0;
  currentGameFruitsEaten = 0;
  currentGameTunnelUses = 0;
  currentGameQuadKills = 0;
  currentGamePowerPelletsUsed = 0;
  currentGameGhostNames = new Set<string>();
  currentGameScore = 0;
  currentLevelPowerUsed = false;
  currentConsecutiveNoDeath = 0;
  currentFruitTypes = new Set<string>();

  constructor() {
    this.stats = this.load();
  }

  private load(): GameStats {
    const defaults: GameStats = {
      totalGamesPlayed: 0,
      totalScore: 0,
      highScore: 0,
      totalDotsEaten: 0,
      totalPowerPelletsUsed: 0,
      totalGhostsEaten: 0,
      totalFruitsEaten: 0,
      totalDeaths: 0,
      totalLevelsCleared: 0,
      highestLevel: 1,
      totalTimePlayed: 0,
      longestGameTime: 0,
      bestLevelTime: Infinity,
      quadKills: 0,
      tunnelUses: 0,
      fruitsEatenByType: {},
      ghostsEatenByName: {},
      modesPlayed: new Set<string>(),
      consecutiveLevelsNoDeath: 0,
      bestConsecutiveLevelsNoDeath: 0,
    };

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        return {
          ...defaults,
          ...data,
          modesPlayed: new Set(data.modesPlayed ?? []),
        };
      }
    } catch { /* ignore */ }
    return defaults;
  }

  save(): void {
    try {
      const data = {
        ...this.stats,
        modesPlayed: Array.from(this.stats.modesPlayed),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch { /* ignore */ }
  }

  startGame(mode: string): void {
    this.stats.totalGamesPlayed++;
    this.stats.modesPlayed.add(mode);
    this.currentGameTime = 0;
    this.currentLevelTime = 0;
    this.currentLevelDeaths = 0;
    this.currentGameGhostsEaten = 0;
    this.currentGameFruitsEaten = 0;
    this.currentGameTunnelUses = 0;
    this.currentGameQuadKills = 0;
    this.currentGamePowerPelletsUsed = 0;
    this.currentGameGhostNames.clear();
    this.currentGameScore = 0;
    this.currentLevelPowerUsed = false;
    this.currentConsecutiveNoDeath = 0;
    this.currentFruitTypes.clear();
    this.save();
  }

  recordDotEaten(): void {
    this.stats.totalDotsEaten++;
  }

  recordPowerPellet(): void {
    this.stats.totalPowerPelletsUsed++;
    this.currentGamePowerPelletsUsed++;
    this.currentLevelPowerUsed = true;
  }

  recordGhostEaten(ghostName: string, chainCount: number): void {
    this.stats.totalGhostsEaten++;
    this.currentGameGhostsEaten++;
    this.currentGameGhostNames.add(ghostName);
    this.stats.ghostsEatenByName[ghostName] = (this.stats.ghostsEatenByName[ghostName] ?? 0) + 1;
    if (chainCount >= 4) {
      this.stats.quadKills++;
      this.currentGameQuadKills++;
    }
  }

  recordFruitEaten(fruitType: string): void {
    this.stats.totalFruitsEaten++;
    this.currentGameFruitsEaten++;
    this.currentFruitTypes.add(fruitType);
    this.stats.fruitsEatenByType[fruitType] = (this.stats.fruitsEatenByType[fruitType] ?? 0) + 1;
  }

  recordDeath(): void {
    this.stats.totalDeaths++;
    this.currentLevelDeaths++;
    this.currentConsecutiveNoDeath = 0;
  }

  recordTunnelUse(): void {
    this.stats.tunnelUses++;
    this.currentGameTunnelUses++;
  }

  recordLevelClear(levelTime: number): void {
    this.stats.totalLevelsCleared++;
    if (levelTime < this.stats.bestLevelTime) {
      this.stats.bestLevelTime = levelTime;
    }
    if (this.currentLevelDeaths === 0) {
      this.currentConsecutiveNoDeath++;
      if (this.currentConsecutiveNoDeath > this.stats.bestConsecutiveLevelsNoDeath) {
        this.stats.bestConsecutiveLevelsNoDeath = this.currentConsecutiveNoDeath;
      }
    }
    this.currentLevelTime = 0;
    this.currentLevelDeaths = 0;
    this.currentLevelPowerUsed = false;
    this.save();
  }

  recordGameEnd(score: number, level: number): void {
    this.currentGameScore = score;
    this.stats.totalScore += score;
    if (score > this.stats.highScore) {
      this.stats.highScore = score;
    }
    if (level > this.stats.highestLevel) {
      this.stats.highestLevel = level;
    }
    if (this.currentGameTime > this.stats.longestGameTime) {
      this.stats.longestGameTime = this.currentGameTime;
    }
    this.stats.totalTimePlayed += this.currentGameTime;
    this.save();
  }

  updateTime(delta: number): void {
    this.currentGameTime += delta;
    this.currentLevelTime += delta;
  }

  getFormattedTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  reset(): void {
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
    this.stats = this.load();
  }
}
