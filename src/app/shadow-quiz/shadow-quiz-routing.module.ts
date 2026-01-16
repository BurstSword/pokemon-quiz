import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ShadowQuizPage } from './shadow-quiz.page';

const routes: Routes = [
  {
    path: '',
    component: ShadowQuizPage,
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ShadowQuizPageRoutingModule {}
