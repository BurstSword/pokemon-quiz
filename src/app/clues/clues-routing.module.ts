import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { CluesPage } from './clues.page';

const routes: Routes = [
  {
    path: '',
    component: CluesPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CluesPageRoutingModule {}
