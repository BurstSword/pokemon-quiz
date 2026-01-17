import { ChangeDetectionStrategy, Component } from '@angular/core';

type RoutePath =
  | 'tab1'
  | 'shadow-quiz'
  | 'blur-quiz'
  | 'tab4'
  | 'clues'
  | 'colors';

export interface LobbyRoute {
  path: RoutePath;
  name: string;
  icon?: string; // optional custom icon per mode
}

@Component({
  selector: 'app-lobby',
  templateUrl: './lobby.page.html',
  styleUrls: ['./lobby.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LobbyPage {
  // NOTE: prefer absolute asset path for Angular templates
  readonly routes: ReadonlyArray<LobbyRoute> = [
    { path: 'tab1',  name: 'Juego 1', icon: 'assets/icons/pokeball-1.svg' },
    { path: 'shadow-quiz',  name: 'Juego Sombra', icon: 'assets/icons/pokeball-1.svg' },
    { path: 'blur-quiz',  name: 'Juego Borroso', icon: 'assets/icons/pokeball-1.svg' },
    { path: 'tab4',  name: 'Juego 4', icon: 'assets/icons/pokeball-1.svg' },
    { path: 'clues', name: 'Juego 5', icon: 'assets/icons/pokeball-1.svg' }
  ];

  // Improve ngFor perf & avoid re-rendering
  trackByPath = (_: number, r: LobbyRoute) => r.path;
}
