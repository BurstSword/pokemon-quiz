import { Routes } from '@angular/router';

export const appRoutes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'lobby',
  },
  {
    path: 'lobby',
    loadComponent: () => import('./features/lobby/lobby.component').then((m) => m.LobbyComponent),
  },
  {
    path: 'tab1',
    pathMatch: 'full',
    redirectTo: 'lobby',
  },
  {
    path: 'tab2',
    pathMatch: 'full',
    redirectTo: 'shadow-quiz',
  },
  {
    path: 'tab3',
    pathMatch: 'full',
    redirectTo: 'blur-quiz',
  },
  {
    path: 'shadow-quiz',
    loadComponent: () =>
      import('./features/shadow-quiz/shadow-quiz.component').then((m) => m.ShadowQuizComponent),
  },
  {
    path: 'blur-quiz',
    loadComponent: () =>
      import('./features/blur-quiz/blur-quiz.component').then((m) => m.BlurQuizComponent),
  },
  {
    path: 'tab4',
    pathMatch: 'full',
    redirectTo: 'lobby',
  },
  {
    path: 'clues',
    loadComponent: () => import('./features/clues/clues.component').then((m) => m.CluesComponent),
  },
  {
    path: 'colors',
    loadComponent: () => import('./features/colors/colors.component').then((m) => m.ColorsComponent),
  },
  {
    path: 'connections',
    loadComponent: () =>
      import('./features/connections/connections.component').then((m) => m.ConnectionsComponent),
  },
  {
    path: 'pokedex',
    loadComponent: () => import('./features/pokedex/pokedex.component').then((m) => m.PokedexComponent),
  },
  {
    path: 'legacy/clues',
    loadComponent: () =>
      import('./features/legacy-clues/legacy-clues.component').then((m) => m.LegacyCluesComponent),
  },
  {
    path: 'legacy/colors',
    loadComponent: () =>
      import('./features/legacy-colors/legacy-colors.component').then((m) => m.LegacyColorsComponent),
  },
  {
    path: '**',
    redirectTo: 'lobby',
  },
];
