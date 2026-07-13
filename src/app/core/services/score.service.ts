import { Injectable } from '@angular/core';
import type { ScoreBreakdown, ScoreEvent } from '../models/game-stats.model';

@Injectable({ providedIn: 'root' })
export class ScoreService {
  calculate(event: ScoreEvent): ScoreBreakdown {
    if (!event.won) {
      return {
        points: 0,
        reason: 'Sin puntos esta ronda.',
      };
    }

    switch (event.mode) {
      case 'shadow':
      case 'blur':
      case 'colors':
        return this.calculateSingleAnswerScore(event);
      case 'clues':
        return this.calculateCluesScore(event);
      case 'connections':
        return this.calculateConnectionsScore(event);
      default:
        return {
          points: 0,
          reason: 'Sin puntuacion.',
        };
    }
  }

  private calculateSingleAnswerScore(event: ScoreEvent): ScoreBreakdown {
    let points = 100;
    const parts = ['+100 base'];

    if (event.hintsUsed === 0) {
      points += 25;
      parts.push('+25 sin ayuda');
    }

    const streakBonus = this.getStreakBonus(event.currentStreak);
    if (streakBonus > 0) {
      points += streakBonus;
      parts.push(`+${streakBonus} racha`);
    }

    const speedBonus = this.getSpeedBonus(event.durationMs);
    if (speedBonus > 0) {
      points += speedBonus;
      parts.push(`+${speedBonus} rapidez`);
    }

    return {
      points,
      reason: parts.join(' · '),
    };
  }

  private calculateCluesScore(event: ScoreEvent): ScoreBreakdown {
    const cluesUsed = Math.max(1, event.cluesUsed ?? 1);
    let points = 60;

    if (cluesUsed <= 1) {
      points = 150;
    } else if (cluesUsed === 2) {
      points = 120;
    } else if (cluesUsed === 3) {
      points = 90;
    }

    const parts = [`+${points} por acertar con ${cluesUsed} pista${cluesUsed === 1 ? '' : 's'}`];
    return {
      points,
      reason: parts.join(' · '),
    };
  }

  private calculateConnectionsScore(event: ScoreEvent): ScoreBreakdown {
    const remainingMistakes = Math.max(0, Math.min(4, event.remainingMistakes ?? 0));
    let bonus = 0;

    if (remainingMistakes >= 4) {
      bonus = 100;
    } else if (remainingMistakes === 3) {
      bonus = 75;
    } else if (remainingMistakes === 2) {
      bonus = 50;
    } else if (remainingMistakes === 1) {
      bonus = 25;
    }

    return {
      points: 400 + bonus,
      reason: bonus > 0 ? `+400 base · +${bonus} por intentos sobrantes` : '+400 base',
    };
  }

  private getStreakBonus(streak: number): number {
    if (streak >= 10) {
      return 50;
    }

    if (streak >= 5) {
      return 25;
    }

    if (streak >= 3) {
      return 10;
    }

    return 0;
  }

  private getSpeedBonus(durationMs?: number): number {
    if (!durationMs || durationMs <= 0) {
      return 0;
    }

    if (durationMs < 5000) {
      return 25;
    }

    if (durationMs < 10000) {
      return 10;
    }

    return 0;
  }
}
