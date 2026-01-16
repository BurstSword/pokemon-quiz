import { IonicModule } from '@ionic/angular';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ShadowQuizPage } from './shadow-quiz.page';
import { ShadowQuizPageRoutingModule } from './shadow-quiz-routing.module';

@NgModule({
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    ShadowQuizPageRoutingModule
  ],
  declarations: [ShadowQuizPage]
})
export class ShadowQuizPageModule {}
