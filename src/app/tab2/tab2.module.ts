import { IonicModule } from '@ionic/angular';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Tab2PageRoutingModule } from './tab2-routing.module';
import { Tab2Page } from './tab2.page';

@NgModule({
  imports: [IonicModule, CommonModule, Tab2PageRoutingModule],
  declarations: [Tab2Page],
})
export class Tab2PageModule {}
