import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { CluesPageRoutingModule } from './clues-routing.module';

import { CluesPage } from './clues.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    CluesPageRoutingModule
  ],
  declarations: [CluesPage]
})
export class CluesPageModule {}
