export type GameModeId = 'shadow' | 'blur' | 'colors' | 'clues' | 'connections';

export interface ModeStats {
  played: number;
  wins: number;
  losses: number;
  correct: number;
  wrong: number;
  currentStreak: number;
  bestStreak: number;
  bestScore: number;
  totalScore: number;
  averageScore: number;
  lastScore: number;
  lastPlayedAt: string | null;
  perfectRounds: number;
  hintsUsed: number;
  fastestWinMs: number | null;
  bestConnectionsRemainingMistakes: number | null;
  bestCluesWithFewestHints: number | null;
}

export interface GameStats {
  version: 1;
  totalGamesPlayed: number;
  totalCorrect: number;
  totalWrong: number;
  currentStreak: number;
  bestStreak: number;
  lastPlayedAt: string | null;
  modes: Record<GameModeId, ModeStats>;
}

export interface GameResult {
  mode: GameModeId;
  won: boolean;
  correct?: number;
  wrong?: number;
  hintsUsed?: number;
  durationMs?: number;
  cluesUsed?: number;
  remainingMistakes?: number;
  perfectRound?: boolean;
}

export interface ScoreEvent {
  mode: GameModeId;
  won: boolean;
  hintsUsed: number;
  currentStreak: number;
  durationMs?: number;
  cluesUsed?: number;
  remainingMistakes?: number;
}

export interface ScoreBreakdown {
  points: number;
  reason: string;
}

export interface ScoreFeedback {
  points: number;
  reason: string;
  currentModeStreak: number;
  bestModeStreak: number;
  currentGlobalStreak: number;
  bestGlobalStreak: number;
  lostStreak: boolean;
  isNewRecord: boolean;
  isNewBestStreak: boolean;
  modeStats: ModeStats;
  globalStats: GameStats;
}

export interface GameHelpContent {
  intro: string;
  howTo: string;
  hintSummary: string;
  hintPenalty: string;
}
