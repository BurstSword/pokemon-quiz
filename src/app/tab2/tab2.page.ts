import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-tab2',
  templateUrl: './tab2.page.html',
  styleUrls: ['./tab2.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Tab2Page implements OnInit {
  constructor(private router: Router) {}

  ngOnInit(): void {
    void this.router.navigateByUrl('/shadow-quiz');
  }
}
