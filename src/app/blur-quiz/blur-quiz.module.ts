import { IonicModule } from '@ionic/angular';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BlurQuizPage } from './blur-quiz.page';
import { BlurQuizPageRoutingModule } from './blur-quiz-routing.module';

@NgModule({
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    BlurQuizPageRoutingModule
  ],
  declarations: [BlurQuizPage]
})
export class BlurQuizPageModule {}
