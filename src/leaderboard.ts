// === Neon Pac VR -- Leaderboard Manager ===

export interface LeaderboardEntry {
  score: number;
  level: number;
  mode: string;
  difficulty: string;
  date: number; // timestamp
}

const STORAGE_KEY = 'neon-pac-leaderboard';
const MAX_ENTRIES = 50;

export class LeaderboardManager {
  entries: LeaderboardEntry[] = [];

  constructor() {
    this.load();
  }

  private load(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        this.entries = JSON.parse(raw) as LeaderboardEntry[];
      }
    } catch { /* ignore */ }
  }

  private save(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.entries));
    } catch { /* ignore */ }
  }

  addEntry(score: number, level: number, mode: string, difficulty: string): void {
    if (score <= 0) return;
    this.entries.push({
      score,
      level,
      mode,
      difficulty,
      date: Date.now(),
    });
    // Sort by score descending
    this.entries.sort((a, b) => b.score - a.score);
    // Keep only top entries
    if (this.entries.length > MAX_ENTRIES) {
      this.entries = this.entries.slice(0, MAX_ENTRIES);
    }
    this.save();
  }

  getTopScores(count = 10, modeFilter?: string): LeaderboardEntry[] {
    let filtered = this.entries;
    if (modeFilter && modeFilter !== 'all') {
      filtered = filtered.filter((e) => e.mode === modeFilter);
    }
    return filtered.slice(0, count);
  }

  getRank(score: number, modeFilter?: string): number {
    let filtered = this.entries;
    if (modeFilter && modeFilter !== 'all') {
      filtered = filtered.filter((e) => e.mode === modeFilter);
    }
    const rank = filtered.filter((e) => e.score > score).length + 1;
    return rank;
  }

  getPersonalBest(mode?: string): number {
    let filtered = this.entries;
    if (mode) {
      filtered = filtered.filter((e) => e.mode === mode);
    }
    if (filtered.length === 0) return 0;
    return filtered[0].score;
  }

  reset(): void {
    this.entries = [];
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
  }
}
