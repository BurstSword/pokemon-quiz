import { Injectable, signal } from '@angular/core';
import type {
  GameModeId,
  GameResult,
  GameStats,
  ModeStats,
  ScoreFeedback,
} from '../models/game-stats.model';
import { ScoreService } from './score.service';

const STORAGE_KEY = 'pokequiz.stats.v1';
const MODE_IDS: GameModeId[] = ['shadow', 'blur', 'colors', 'clues', 'connections'];

@Injectable({ providedIn: 'root' })
export class GameStatsService {
  readonly stats = signal<GameStats>(this.readStats());

  constructor(private readonly scoreService: ScoreService) {}

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

  recordCorrect(mode: GameModeId, scoreDelta?: number): ScoreFeedback {
    return this.recordGameResult({
      mode,
      won: true,
      correct: 1,
      wrong: 0,
      perfectRound: (scoreDelta ?? 0) > 0,
    });
  }

  recordWrong(mode: GameModeId): ScoreFeedback {
    return this.recordGameResult({
      mode,
      won: false,
      correct: 0,
      wrong: 1,
    });
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

  recordGameResult(result: GameResult): ScoreFeedback {
    const current = this.stats();
    const modeStatsBefore = current.modes[result.mode];
    const nextModeStreak = result.won ? modeStatsBefore.currentStreak + 1 : 0;
    const nextGlobalStreak = result.won ? current.currentStreak + 1 : 0;
    const correct = result.correct ?? (result.won ? 1 : 0);
    const wrong = result.wrong ?? (result.won ? 0 : 1);
    const hintsUsed = Math.max(0, result.hintsUsed ?? 0);
    const score = this.scoreService.calculate({
      mode: result.mode,
      won: result.won,
      hintsUsed,
      currentStreak: nextModeStreak,
      durationMs: result.durationMs,
      cluesUsed: result.cluesUsed,
      remainingMistakes: result.remainingMistakes,
    });

    const timestamp = new Date().toISOString();
    const nextModeStats: ModeStats = {
      ...modeStatsBefore,
      played: modeStatsBefore.played + 1,
      wins: modeStatsBefore.wins + (result.won ? 1 : 0),
      losses: modeStatsBefore.losses + (result.won ? 0 : 1),
      correct: modeStatsBefore.correct + correct,
      wrong: modeStatsBefore.wrong + wrong,
      currentStreak: nextModeStreak,
      bestStreak: Math.max(modeStatsBefore.bestStreak, nextModeStreak),
      bestScore: Math.max(modeStatsBefore.bestScore, score.points),
      totalScore: modeStatsBefore.totalScore + score.points,
      averageScore: (modeStatsBefore.totalScore + score.points) / (modeStatsBefore.played + 1),
      lastScore: score.points,
      lastPlayedAt: timestamp,
      perfectRounds: modeStatsBefore.perfectRounds + (result.perfectRound ? 1 : 0),
      hintsUsed: modeStatsBefore.hintsUsed + hintsUsed,
      fastestWinMs: this.resolveFastestWin(modeStatsBefore.fastestWinMs, result),
      bestConnectionsRemainingMistakes: this.resolveConnectionsRecord(modeStatsBefore.bestConnectionsRemainingMistakes, result),
      bestCluesWithFewestHints: this.resolveCluesRecord(modeStatsBefore.bestCluesWithFewestHints, result),
    };

    const nextStats: GameStats = {
      ...current,
      totalGamesPlayed: current.totalGamesPlayed + 1,
      totalCorrect: current.totalCorrect + correct,
      totalWrong: current.totalWrong + wrong,
      currentStreak: nextGlobalStreak,
      bestStreak: Math.max(current.bestStreak, nextGlobalStreak),
      lastPlayedAt: timestamp,
      modes: {
        ...current.modes,
        [result.mode]: nextModeStats,
      },
    };

    this.stats.set(nextStats);
    this.persist(nextStats);

    return {
      points: score.points,
      reason: score.reason,
      currentModeStreak: nextModeStats.currentStreak,
      bestModeStreak: nextModeStats.bestStreak,
      currentGlobalStreak: nextStats.currentStreak,
      bestGlobalStreak: nextStats.bestStreak,
      lostStreak: !result.won && modeStatsBefore.currentStreak > 0,
      isNewRecord: score.points > modeStatsBefore.bestScore,
      isNewBestStreak: nextModeStats.bestStreak > modeStatsBefore.bestStreak,
      modeStats: nextModeStats,
      globalStats: nextStats,
    };
  }

  private resolveFastestWin(currentValue: number | null, result: GameResult): number | null {
    if (!result.won || !result.durationMs || result.durationMs <= 0) {
      return currentValue;
    }

    if (currentValue === null) {
      return result.durationMs;
    }

    return Math.min(currentValue, result.durationMs);
  }

  private resolveConnectionsRecord(currentValue: number | null, result: GameResult): number | null {
    if (result.mode !== 'connections' || !result.won || result.remainingMistakes === undefined) {
      return currentValue;
    }

    if (currentValue === null) {
      return result.remainingMistakes;
    }

    return Math.max(currentValue, result.remainingMistakes);
  }

  private resolveCluesRecord(currentValue: number | null, result: GameResult): number | null {
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

    const source = value as Partial<GameStats>;
    const modes = MODE_IDS.reduce<Record<GameModeId, ModeStats>>((accumulator, mode) => {
      accumulator[mode] = this.normalizeModeStats(source.modes?.[mode]);
      return accumulator;
    }, {} as Record<GameModeId, ModeStats>);

    return {
      version: 1,
      totalGamesPlayed: this.readNumber(source.totalGamesPlayed),
      totalCorrect: this.readNumber(source.totalCorrect),
      totalWrong: this.readNumber(source.totalWrong),
      currentStreak: this.readNumber(source.currentStreak),
      bestStreak: this.readNumber(source.bestStreak),
      lastPlayedAt: typeof source.lastPlayedAt === 'string' ? source.lastPlayedAt : null,
      modes,
    };
  }

  private normalizeModeStats(value: unknown): ModeStats {
    const source = (value && typeof value === 'object' ? value : {}) as Partial<ModeStats>;
    const played = this.readNumber(source.played);
    const totalScore = this.readNumber(source.totalScore);

    return {
      played,
      wins: this.readNumber(source.wins),
      losses: this.readNumber(source.losses),
      correct: this.readNumber(source.correct),
      wrong: this.readNumber(source.wrong),
      currentStreak: this.readNumber(source.currentStreak),
      bestStreak: this.readNumber(source.bestStreak),
      bestScore: this.readNumber(source.bestScore),
      totalScore,
      averageScore: played > 0 ? totalScore / played : 0,
      lastScore: this.readNumber(source.lastScore),
      lastPlayedAt: typeof source.lastPlayedAt === 'string' ? source.lastPlayedAt : null,
      perfectRounds: this.readNumber(source.perfectRounds),
      hintsUsed: this.readNumber(source.hintsUsed),
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
      totalGamesPlayed: 0,
      totalCorrect: 0,
      totalWrong: 0,
      currentStreak: 0,
      bestStreak: 0,
      lastPlayedAt: null,
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
      wins: 0,
      losses: 0,
      correct: 0,
      wrong: 0,
      currentStreak: 0,
      bestStreak: 0,
      bestScore: 0,
      totalScore: 0,
      averageScore: 0,
      lastScore: 0,
      lastPlayedAt: null,
      perfectRounds: 0,
      hintsUsed: 0,
      fastestWinMs: null,
      bestConnectionsRemainingMistakes: null,
      bestCluesWithFewestHints: null,
    };
  }

  private readNumber(value: unknown): number {
    return typeof value === 'number' && Number.isFinite(value) ? value : 0;
  }
}
