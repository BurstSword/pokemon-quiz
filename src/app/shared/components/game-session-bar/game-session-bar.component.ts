import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'app-game-session-bar',
  standalone: true,
  templateUrl: './game-session-bar.component.html',
  styleUrl: './game-session-bar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GameSessionBarComponent {
  @Input() intro = '';
  @Input() hintNote = '';
  @Input() lastScore = 0;
  @Input() currentStreak = 0;
  @Input() bestValue = 0;
  @Input() bestLabel = 'Record';
}
