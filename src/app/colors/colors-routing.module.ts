import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ColorsPage } from './colors.page';

const routes: Routes = [
  {
    path: '',
    component: ColorsPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ColorsPageRoutingModule {}
