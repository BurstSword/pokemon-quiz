import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import type { GameModeId, ModeStats } from '../../../core/models/game-stats.model';
import { GameStatsService } from '../../../core/services/game-stats.service';

@Component({
  selector: 'app-game-score-bar',
  standalone: true,
  templateUrl: './game-score-bar.component.html',
  styleUrl: './game-score-bar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GameScoreBarComponent {
  @Input({ required: true }) mode!: GameModeId;

  constructor(private readonly gameStatsService: GameStatsService) {}

  get modeStats(): ModeStats {
    this.gameStatsService.stats();
    return this.gameStatsService.getModeStats(this.mode);
  }
}
