import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

export type ResultStatus = 'correct' | 'incorrect' | null;

@Component({
  selector: 'app-result-banner',
  standalone: true,
  templateUrl: './result-banner.component.html',
  styleUrl: './result-banner.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResultBannerComponent {
  @Input() status: ResultStatus = null;
  @Input() title = '';
  @Input() message = '';
  @Input() answer = '';
  @Input() summaryText = '';
  @Input() streakText = '';
  @Input() recordText = '';
  @Input() nextLabel = 'Siguiente';

  @Output() next = new EventEmitter<void>();
}
