export type GameModeId = 'shadow' | 'blur' | 'colors' | 'clues' | 'connections';

export type LastResult = 'correct' | 'wrong' | 'win' | 'loss' | null;

export interface ModeStats {
  played: number;
  correct: number;
  wrong: number;
  wins: number;
  losses: number;
  currentStreak: number;
  bestStreak: number;
  hintsUsed: number;
  lastResult: LastResult;
  lastPlayedAt: string | null;
  completedBoards: number;
  failedBoards: number;
  bestRemainingMistakes: number | null;
  wrongAttempts: number;
  solvedRounds: number;
  failedRounds: number;
  bestFewestHints: number | null;

  // Legacy compatibility fields kept to avoid breaking old localStorage payloads.
  bestScore?: number;
  totalScore?: number;
  averageScore?: number;
  lastScore?: number;
  perfectRounds?: number;
  fastestWinMs?: number | null;
  bestConnectionsRemainingMistakes?: number | null;
  bestCluesWithFewestHints?: number | null;
}

export interface GameStats {
  version: 1;
  totalPlayed: number;
  totalCorrect: number;
  totalWrong: number;
  currentStreak: number;
  bestStreak: number;
  lastPlayedAt: string | null;
  modes: Record<GameModeId, ModeStats>;

  // Legacy alias for old saved payloads.
  totalGamesPlayed?: number;
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
  wrongAttempts?: number;
}

export interface StatsFeedback {
  currentModeStreak: number;
  bestModeStreak: number;
  currentGlobalStreak: number;
  bestGlobalStreak: number;
  lostStreak: boolean;
  isNewBestStreak: boolean;
  lastResult: LastResult;
  modeStats: ModeStats;
  globalStats: GameStats;
}

export interface GameHelpContent {
  intro: string;
  howTo: string;
  hintSummary: string;
  hintPenalty: string;
}
