import { Injectable } from '@angular/core';

export interface PokemonTypeMeta {
  type: string;
  image: string;
  color?: string;
}

@Injectable({ providedIn: 'root' })
export class PokemonTypeService {
  private readonly typeMeta: Record<string, PokemonTypeMeta> = {
    Normal: { type: 'Normal', image: 'assets/pokemontypes/normal.webp', color: '#A8A77A' },
    Fire: { type: 'Fire', image: 'assets/pokemontypes/fire.webp', color: '#EE8130' },
    Water: { type: 'Water', image: 'assets/pokemontypes/water.webp', color: '#6390F0' },
    Electric: { type: 'Electric', image: 'assets/pokemontypes/electric.webp', color: '#F7D02C' },
    Grass: { type: 'Grass', image: 'assets/pokemontypes/grass.webp', color: '#7AC74C' },
    Ice: { type: 'Ice', image: 'assets/pokemontypes/ice.webp', color: '#96D9D6' },
    Fighting: { type: 'Fighting', image: 'assets/pokemontypes/fighting.webp', color: '#C22E28' },
    Poison: { type: 'Poison', image: 'assets/pokemontypes/poison.webp', color: '#A33EA1' },
    Ground: { type: 'Ground', image: 'assets/pokemontypes/ground.webp', color: '#E2BF65' },
    Flying: { type: 'Flying', image: 'assets/pokemontypes/flying.webp', color: '#A98FF3' },
    Psychic: { type: 'Psychic', image: 'assets/pokemontypes/psychic.webp', color: '#F95587' },
    Bug: { type: 'Bug', image: 'assets/pokemontypes/bug.webp', color: '#A6B91A' },
    Rock: { type: 'Rock', image: 'assets/pokemontypes/rock.webp', color: '#B6A136' },
    Ghost: { type: 'Ghost', image: 'assets/pokemontypes/ghost.webp', color: '#735797' },
    Dragon: { type: 'Dragon', image: 'assets/pokemontypes/dragon.webp', color: '#6F35FC' },
    Dark: { type: 'Dark', image: 'assets/pokemontypes/dark.webp', color: '#705746' },
    Steel: { type: 'Steel', image: 'assets/pokemontypes/steel.webp', color: '#B7B7CE' },
    Fairy: { type: 'Fairy', image: 'assets/pokemontypes/fairy.webp', color: '#D685AD' },
  };

  getTypeImage(type: string): string {
    return this.typeMeta[type]?.image ?? '';
  }

  getTypeColor(type: string, opacity = 0.5): string {
    const hex = this.typeMeta[type]?.color;
    if (!hex) return 'rgba(255, 255, 255, 1)';

    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
}
