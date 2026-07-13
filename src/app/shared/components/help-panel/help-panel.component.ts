import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-help-panel',
  standalone: true,
  templateUrl: './help-panel.component.html',
  styleUrl: './help-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HelpPanelComponent {
  @Input() open = false;
  @Input() title = 'Como se juega';
  @Input() description = '';
  @Input() eyebrow = 'Como se juega';

  @Output() closed = new EventEmitter<void>();
}
