import { Injectable, signal } from '@angular/core';
import type {
  GameModeId,
  GameResult,
  GameStats,
  LastResult,
  ModeStats,
  StatsFeedback,
} from '../models/game-stats.model';

const STORAGE_KEY = 'pokequiz.stats.v1';
const MODE_IDS: GameModeId[] = ['shadow', 'blur', 'colors', 'clues', 'connections'];

@Injectable({ providedIn: 'root' })
export class GameStatsService {
  readonly stats = signal<GameStats>(this.readStats());

  getStats(): GameStats {
    return this.stats();
  }

  getModeStats(mode: GameModeId): ModeStats {
    return this.stats().modes[mode];
  }

  getCurrentStreak(): number {
    return this.stats().currentStreak;
  }

  getGlobalBestStreak(): number {
    return this.stats().bestStreak;
  }

  resetStats(): void {
    const next = this.createDefaultStats();
    this.stats.set(next);
    this.persist(next);
  }

  exportStats(): string {
    return JSON.stringify(this.stats(), null, 2);
  }

  importStats(raw: string): void {
    try {
      const parsed = JSON.parse(raw);
      const next = this.normalizeStats(parsed);
      this.stats.set(next);
      this.persist(next);
    } catch {
      this.resetStats();
    }
  }

  recordHintUsed(mode: GameModeId, amount = 1): void {
    if (amount <= 0) {
      return;
    }

    const current = this.stats();
    const modeStats = current.modes[mode];
    const nextModeStats: ModeStats = {
      ...modeStats,
      hintsUsed: modeStats.hintsUsed + amount,
    };
    const next: GameStats = {
      ...current,
      modes: {
        ...current.modes,
        [mode]: nextModeStats,
      },
    };

    this.stats.set(next);
    this.persist(next);
  }

  recordGameResult(result: GameResult): StatsFeedback {
    const current = this.stats();
    const modeStatsBefore = current.modes[result.mode];
    const nextModeStreak = result.won ? modeStatsBefore.currentStreak + 1 : 0;
    const nextGlobalStreak = result.won ? current.currentStreak + 1 : 0;
    const correct = result.correct ?? (result.won ? 1 : 0);
    const wrong = result.wrong ?? (result.won ? 0 : 1);
    const hintsUsed = Math.max(0, result.hintsUsed ?? 0);
    const wrongAttempts = Math.max(0, result.wrongAttempts ?? 0);
    const timestamp = new Date().toISOString();
    const lastResult = this.resolveLastResult(result.mode, result.won);

    const nextModeStats: ModeStats = {
      ...modeStatsBefore,
      played: modeStatsBefore.played + 1,
      correct: modeStatsBefore.correct + correct,
      wrong: modeStatsBefore.wrong + wrong,
      wins: modeStatsBefore.wins + (result.mode === 'connections' && result.won ? 1 : 0),
      losses: modeStatsBefore.losses + (result.mode === 'connections' && !result.won ? 1 : 0),
      currentStreak: nextModeStreak,
      bestStreak: Math.max(modeStatsBefore.bestStreak, nextModeStreak),
      hintsUsed: modeStatsBefore.hintsUsed + hintsUsed,
      lastResult,
      lastPlayedAt: timestamp,
      completedBoards: modeStatsBefore.completedBoards + (result.mode === 'connections' && result.won ? 1 : 0),
      failedBoards: modeStatsBefore.failedBoards + (result.mode === 'connections' && !result.won ? 1 : 0),
      bestRemainingMistakes: this.resolveBestRemainingMistakes(modeStatsBefore.bestRemainingMistakes, result),
      wrongAttempts: modeStatsBefore.wrongAttempts + wrongAttempts,
      solvedRounds: modeStatsBefore.solvedRounds + (result.mode === 'clues' && result.won ? 1 : 0),
      failedRounds: modeStatsBefore.failedRounds + (result.mode === 'clues' && !result.won ? 1 : 0),
      bestFewestHints: this.resolveBestFewestHints(modeStatsBefore.bestFewestHints, result),
      bestScore: 0,
      totalScore: 0,
      averageScore: 0,
      lastScore: 0,
      perfectRounds: modeStatsBefore.perfectRounds ?? 0,
      fastestWinMs: modeStatsBefore.fastestWinMs ?? null,
      bestConnectionsRemainingMistakes: this.resolveBestRemainingMistakes(modeStatsBefore.bestConnectionsRemainingMistakes ?? null, result),
      bestCluesWithFewestHints: this.resolveBestFewestHints(modeStatsBefore.bestCluesWithFewestHints ?? null, result),
    };

    const nextStats: GameStats = {
      ...current,
      totalPlayed: current.totalPlayed + 1,
      totalCorrect: current.totalCorrect + correct,
      totalWrong: current.totalWrong + wrong,
      currentStreak: nextGlobalStreak,
      bestStreak: Math.max(current.bestStreak, nextGlobalStreak),
      lastPlayedAt: timestamp,
      totalGamesPlayed: current.totalPlayed + 1,
      modes: {
        ...current.modes,
        [result.mode]: nextModeStats,
      },
    };

    this.stats.set(nextStats);
    this.persist(nextStats);

    return {
      currentModeStreak: nextModeStats.currentStreak,
      bestModeStreak: nextModeStats.bestStreak,
      currentGlobalStreak: nextStats.currentStreak,
      bestGlobalStreak: nextStats.bestStreak,
      lostStreak: !result.won && modeStatsBefore.currentStreak > 0,
      isNewBestStreak: nextModeStats.bestStreak > modeStatsBefore.bestStreak,
      lastResult,
      modeStats: nextModeStats,
      globalStats: nextStats,
    };
  }

  private resolveLastResult(mode: GameModeId, won: boolean): LastResult {
    if (mode === 'connections') {
      return won ? 'win' : 'loss';
    }

    return won ? 'correct' : 'wrong';
  }

  private resolveBestRemainingMistakes(currentValue: number | null, result: GameResult): number | null {
    if (result.mode !== 'connections' || !result.won || result.remainingMistakes === undefined) {
      return currentValue;
    }

    if (currentValue === null) {
      return result.remainingMistakes;
    }

    return Math.max(currentValue, result.remainingMistakes);
  }

  private resolveBestFewestHints(currentValue: number | null, result: GameResult): number | null {
    if (result.mode !== 'clues' || !result.won || result.cluesUsed === undefined) {
      return currentValue;
    }

    if (currentValue === null) {
      return result.cluesUsed;
    }

    return Math.min(currentValue, result.cluesUsed);
  }

  private readStats(): GameStats {
    if (typeof localStorage === 'undefined') {
      return this.createDefaultStats();
    }

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return this.createDefaultStats();
      }

      return this.normalizeStats(JSON.parse(raw));
    } catch {
      return this.createDefaultStats();
    }
  }

  private persist(stats: GameStats): void {
    if (typeof localStorage === 'undefined') {
      return;
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
    } catch {
      // Keep runtime state even if storage fails.
    }
  }

  private normalizeStats(value: unknown): GameStats {
    const base = this.createDefaultStats();
    if (!value || typeof value !== 'object') {
      return base;
    }

    const source = value as Partial<GameStats> & { modes?: Partial<Record<GameModeId, Partial<ModeStats>>> };
    const modes = MODE_IDS.reduce<Record<GameModeId, ModeStats>>((accumulator, mode) => {
      accumulator[mode] = this.normalizeModeStats(source.modes?.[mode], mode);
      return accumulator;
    }, {} as Record<GameModeId, ModeStats>);

    return {
      version: 1,
      totalPlayed: this.readNumber(source.totalPlayed ?? source.totalGamesPlayed),
      totalCorrect: this.readNumber(source.totalCorrect),
      totalWrong: this.readNumber(source.totalWrong),
      currentStreak: this.readNumber(source.currentStreak),
      bestStreak: this.readNumber(source.bestStreak),
      lastPlayedAt: typeof source.lastPlayedAt === 'string' ? source.lastPlayedAt : null,
      totalGamesPlayed: this.readNumber(source.totalPlayed ?? source.totalGamesPlayed),
      modes,
    };
  }

  private normalizeModeStats(value: unknown, mode: GameModeId): ModeStats {
    const source = (value && typeof value === 'object' ? value : {}) as Partial<ModeStats>;
    const wins = this.readNumber(source.wins);
    const losses = this.readNumber(source.losses);
    const completedBoards = this.readNumber(source.completedBoards ?? (mode === 'connections' ? wins : 0));
    const failedBoards = this.readNumber(source.failedBoards ?? (mode === 'connections' ? losses : 0));
    const solvedRounds = this.readNumber(source.solvedRounds ?? (mode === 'clues' ? source.correct : 0));
    const failedRounds = this.readNumber(source.failedRounds ?? (mode === 'clues' ? source.wrong : 0));

    return {
      played: this.readNumber(source.played),
      correct: this.readNumber(source.correct),
      wrong: this.readNumber(source.wrong),
      wins,
      losses,
      currentStreak: this.readNumber(source.currentStreak),
      bestStreak: this.readNumber(source.bestStreak),
      hintsUsed: this.readNumber(source.hintsUsed),
      lastResult: this.readLastResult(source.lastResult),
      lastPlayedAt: typeof source.lastPlayedAt === 'string' ? source.lastPlayedAt : null,
      completedBoards,
      failedBoards,
      bestRemainingMistakes:
        typeof source.bestRemainingMistakes === 'number'
          ? source.bestRemainingMistakes
          : typeof source.bestConnectionsRemainingMistakes === 'number'
            ? source.bestConnectionsRemainingMistakes
            : null,
      wrongAttempts: this.readNumber(source.wrongAttempts),
      solvedRounds,
      failedRounds,
      bestFewestHints:
        typeof source.bestFewestHints === 'number'
          ? source.bestFewestHints
          : typeof source.bestCluesWithFewestHints === 'number'
            ? source.bestCluesWithFewestHints
            : null,
      bestScore: 0,
      totalScore: 0,
      averageScore: 0,
      lastScore: 0,
      perfectRounds: this.readNumber(source.perfectRounds),
      fastestWinMs: typeof source.fastestWinMs === 'number' && source.fastestWinMs > 0 ? source.fastestWinMs : null,
      bestConnectionsRemainingMistakes:
        typeof source.bestConnectionsRemainingMistakes === 'number' ? source.bestConnectionsRemainingMistakes : null,
      bestCluesWithFewestHints:
        typeof source.bestCluesWithFewestHints === 'number' ? source.bestCluesWithFewestHints : null,
    };
  }

  private createDefaultStats(): GameStats {
    return {
      version: 1,
      totalPlayed: 0,
      totalCorrect: 0,
      totalWrong: 0,
      currentStreak: 0,
      bestStreak: 0,
      lastPlayedAt: null,
      totalGamesPlayed: 0,
      modes: {
        shadow: this.createDefaultModeStats(),
        blur: this.createDefaultModeStats(),
        colors: this.createDefaultModeStats(),
        clues: this.createDefaultModeStats(),
        connections: this.createDefaultModeStats(),
      },
    };
  }

  private createDefaultModeStats(): ModeStats {
    return {
      played: 0,
      correct: 0,
      wrong: 0,
      wins: 0,
      losses: 0,
      currentStreak: 0,
      bestStreak: 0,
      hintsUsed: 0,
      lastResult: null,
      lastPlayedAt: null,
      completedBoards: 0,
      failedBoards: 0,
      bestRemainingMistakes: null,
      wrongAttempts: 0,
      solvedRounds: 0,
      failedRounds: 0,
      bestFewestHints: null,
      bestScore: 0,
      totalScore: 0,
      averageScore: 0,
      lastScore: 0,
      perfectRounds: 0,
      fastestWinMs: null,
      bestConnectionsRemainingMistakes: null,
      bestCluesWithFewestHints: null,
    };
  }

  private readNumber(value: unknown): number {
    return typeof value === 'number' && Number.isFinite(value) ? value : 0;
  }

  private readLastResult(value: unknown): LastResult {
    return value === 'correct' || value === 'wrong' || value === 'win' || value === 'loss' ? value : null;
  }
}
