import { Component, Input } from '@angular/core';
import { ModalController } from '@ionic/angular';
import type { Pokemon } from 'interfaces';
import { PokemonTypeService } from '../services/pokemon-type.service';

@Component({
  selector: 'app-pokemon-modal',
  templateUrl: './pokemon-modal.component.html',
  styleUrls: ['./pokemon-modal.component.scss'],
})
export class PokemonModalComponent {
  @Input() pokemon!: Pokemon;

  constructor(
    private modalController: ModalController,
    private pokemonTypeService: PokemonTypeService,
  ) {}

  closeModal() {
    this.modalController.dismiss();
  }

  getImageUrl(type: string) {
    return this.pokemonTypeService.getTypeImage(type);
  }
}
