import { IonicModule } from '@ionic/angular';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Tab3PageRoutingModule } from './tab3-routing.module';
import { Tab3Page } from './tab3.page';

@NgModule({
  imports: [IonicModule, CommonModule, Tab3PageRoutingModule],
  declarations: [Tab3Page],
})
export class Tab3PageModule {}
