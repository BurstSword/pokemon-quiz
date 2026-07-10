import type { Pokemon } from './pokemon.model';

export type ConnectionCategoryKind = 'type1' | 'anyType' | 'type2' | 'generation' | 'legendary' | 'tag';

export interface ConnectionGroup {
  id: string;
  title: string;
  kind: ConnectionCategoryKind;
  pokemon: Pokemon[];
  solved: boolean;
}

export interface ConnectionTile {
  pokemon: Pokemon;
  solvedGroupId?: string;
  isShiny?: boolean;
  displaySprite?: string;
}

export interface ConnectionRound {
  groups: ConnectionGroup[];
  tiles: ConnectionTile[];
  attemptsLeft: number;
}
