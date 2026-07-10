import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'app-skeleton-block',
  standalone: true,
  template: '<span class="skeleton" [style.border-radius.px]="radius"></span>',
  styleUrl: './skeleton-block.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SkeletonBlockComponent {
  @Input() radius = 22;
}
