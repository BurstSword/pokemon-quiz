import { Component, Input, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';


@Component({
  selector: 'app-pokemon-modal',
  templateUrl: './pokemon-modal.component.html',
  styleUrls: ['./pokemon-modal.component.scss'],
})
export class PokemonModalComponent  implements OnInit {
  @Input() pokemon: any;
  pokemonTypesArray = [
    { type: 'Normal', image: '../../assets/pokemontypes/normal.webp', color: '#A8A77A' },
    { type: 'Fire', image: '../../assets/pokemontypes/fire.webp', color: '#EE8130' },
    { type: 'Water', image: '../../assets/pokemontypes/water.webp', color: '#6390F0' },
    { type: 'Electric', image: '../../assets/pokemontypes/electric.webp', color: '#F7D02C' },
    { type: 'Grass', image: '../../assets/pokemontypes/grass.webp', color: '#7AC74C' },
    { type: 'Ice', image: '../../assets/pokemontypes/ice.webp', color: '#96D9D6' },
    { type: 'Fighting', image: '../../assets/pokemontypes/fighting.webp', color: '#C22E28' },
    { type: 'Poison', image: '../../assets/pokemontypes/poison.webp', color: '#A33EA1' },
    { type: 'Ground', image: '../../assets/pokemontypes/ground.webp', color: '#E2BF65' },
    { type: 'Flying', image: '../../assets/pokemontypes/flying.webp', color: '#A98FF3' },
    { type: 'Psychic', image: '../../assets/pokemontypes/psychic.webp', color: '#F95587' },
    { type: 'Bug', image: '../../assets/pokemontypes/bug.webp', color: '#A6B91A' },
    { type: 'Rock', image: '../../assets/pokemontypes/rock.webp', color: '#B6A136' },
    { type: 'Ghost', image: '../../assets/pokemontypes/ghost.webp', color: '#735797' },
    { type: 'Dragon', image: '../../assets/pokemontypes/dragon.webp', color: '#6F35FC' },
    { type: 'Dark', image: '../../assets/pokemontypes/dark.webp', color: '#705746' },
    { type: 'Steel', image: '../../assets/pokemontypes/steel.webp', color: '#B7B7CE' },
    { type: 'Fairy', image: '../../assets/pokemontypes/fairy.webp', color: '#D685AD' },
  ];
  constructor(private modalController: ModalController) { }

  ngOnInit() {}

  closeModal() {
    this.modalController.dismiss();
  }
  getImageUrl(type: string) {
    const pokemonType = this.pokemonTypesArray.find(pokemonType => pokemonType.type === type);
    return pokemonType ? pokemonType.image : '';
  }
}
