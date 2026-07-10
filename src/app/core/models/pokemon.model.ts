export interface PokemonStats {
  HP: number | null;
  Attack: number | null;
  Defense: number | null;
  SpecialAttack: number | null;
  SpecialDefense: number | null;
  Speed: number | null;
  Total: number | null;
}

export interface PokemonTag {
  key: string;
  label: string;
}

export interface Pokemon {
  Number: number;
  Name: string;
  Generation: number;
  Legendary: boolean | string;
  Image: string;
  Type1: string;
  Type2?: string;
  Description?: string;

  Slug?: string;
  SpeciesName?: string;
  DisplayName?: string;
  EnglishName?: string;
  SpanishName?: string;
  JapaneseName?: string | null;

  DescriptionEn?: string | null;
  DescriptionEs?: string | null;
  Genus?: string | null;

  Color?: string | null;
  Shape?: string | null;
  Habitat?: string | null;
  GrowthRate?: string | null;
  EggGroups?: string[];

  IsBaby?: boolean;
  IsLegendary?: boolean;
  IsMythical?: boolean;

  Height?: number | null;
  Weight?: number | null;
  HeightMeters?: number | null;
  WeightKg?: number | null;

  CaptureRate?: number | null;
  BaseHappiness?: number | null;
  HatchCounter?: number | null;
  GenderRate?: number | null;

  BaseExperience?: number | null;
  Abilities?: string[];
  HiddenAbility?: string | null;
  Stats?: PokemonStats | null;

  EvolutionChainId?: number | null;
  EvolutionFamily?: number[];
  EvolvesFrom?: number | null;
  EvolutionStage?: number | null;
  IsFinalEvolution?: boolean;
  EvolutionLineNames?: string[];

  OfficialArtwork?: string | null;
  FrontDefault?: string | null;
  FrontShiny?: string | null;
  Sprite?: string | null;
  SerebiiImage?: string | null;

  Tags?: string[];
  ConnectionTags?: PokemonTag[];
  ClueTags?: PokemonTag[];

  EnrichmentError?: string;
}

export type OptionState = 'normal' | 'correct' | 'incorrect' | 'disabled';

export interface OptionViewModel {
  Name: string;
  Label?: string;
  Number?: number;
  Correct: boolean;
  state: OptionState;
}

export type CellState = 'empty' | 'ok' | 'bad';
