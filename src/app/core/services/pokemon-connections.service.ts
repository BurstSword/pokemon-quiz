import { Injectable } from '@angular/core';
import type { ConnectionCategoryKind, ConnectionGroup, ConnectionRound, ConnectionTile } from '../models/connections.model';
import type { Pokemon } from '../models/pokemon.model';
import { sampleUnique, shuffleArray } from '../../shared/utils/pokemon.utils';

const CONNECTIONS_SHINY_RATE = 1 / 64;
const CONNECTIONS_SPRITE_PLACEHOLDER =
  'data:image/svg+xml;charset=UTF-8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">
      <rect width="80" height="80" rx="18" fill="#e2e8f0"/>
      <circle cx="40" cy="28" r="12" fill="#94a3b8"/>
      <rect x="22" y="46" width="36" height="12" rx="6" fill="#94a3b8"/>
    </svg>`,
  );

interface CategoryCandidate {
  id: string;
  title: string;
  familyKey: string;
  kind: ConnectionCategoryKind;
  matcher: (pokemon: Pokemon) => boolean;
  candidates: Pokemon[];
}

@Injectable({ providedIn: 'root' })
export class PokemonConnectionsService {
  private readonly typeLabels: Record<string, string> = {
    bug: 'Bicho',
    dark: 'Siniestro',
    dragon: 'Dragón',
    electric: 'Eléctrico',
    fairy: 'Hada',
    fighting: 'Lucha',
    fire: 'Fuego',
    flying: 'Volador',
    ghost: 'Fantasma',
    grass: 'Planta',
    ground: 'Tierra',
    ice: 'Hielo',
    normal: 'Normal',
    poison: 'Veneno',
    psychic: 'Psíquico',
    rock: 'Roca',
    steel: 'Acero',
    water: 'Agua',
  };

  private catalogCache?: {
    cacheKey: string;
    categories: CategoryCandidate[];
  };

  createRound(pokemons: Pokemon[]): ConnectionRound | null {
    const categories = this.getCategories(pokemons);
    const preferred = categories.filter((category) => category.kind === 'tag');
    const fallback = categories.filter((category) => category.kind !== 'tag');

    for (let attempt = 0; attempt < 120; attempt += 1) {
      const groups = this.tryBuildRound(preferred, fallback);
      if (groups) {
        return {
          groups,
          tiles: this.buildTiles(groups),
          attemptsLeft: 4,
        };
      }
    }

    return this.buildFallbackRound(pokemons);
  }

  private getCategories(pokemons: Pokemon[]): CategoryCandidate[] {
    const cacheKey = pokemons.map((pokemon) => pokemon.Number).join(',');
    if (this.catalogCache?.cacheKey === cacheKey) {
      return this.catalogCache.categories;
    }

    const categories: CategoryCandidate[] = [];
    const normalized = pokemons.map((pokemon) => ({
      ...pokemon,
      Type2: pokemon.Type2?.trim() || '',
    }));

    const type1Groups = this.buildStringGroups(
      normalized,
      'type1',
      (pokemon) => pokemon.Type1,
      (type) => `Tipo principal ${this.getTypeLabel(type)}`,
      (type) => `type:${type}`,
    );

    const anyTypeGroups = this.buildValueGroups(
      normalized,
      'anyType',
      Array.from(
        new Set(
          normalized.reduce<string[]>((types, pokemon) => {
            if (pokemon.Type1) {
              types.push(pokemon.Type1);
            }
            if (pokemon.Type2) {
              types.push(pokemon.Type2);
            }
            return types;
          }, []),
        ),
      ),
      (pokemon, type) => pokemon.Type1 === type || pokemon.Type2 === type,
      (type) => `Tipo ${this.getTypeLabel(type)}`,
      (type) => `type:${type}`,
    );

    const type2Groups = this.buildStringGroups(
      normalized.filter((pokemon) => pokemon.Type2),
      'type2',
      (pokemon) => pokemon.Type2 || '',
      (type) => `Tipo secundario ${this.getTypeLabel(type)}`,
      (type) => `type:${type}`,
    );

    const generationGroups = this.buildValueGroups(
      normalized,
      'generation',
      Array.from(new Set(normalized.map((pokemon) => pokemon.Generation))),
      (pokemon, generation) => pokemon.Generation === generation,
      (generation) => `Generación ${generation}`,
      (generation) => `generation:${generation}`,
    );

    const legendaryCandidates = normalized.filter((pokemon) => this.isLegendary(pokemon));
    if (legendaryCandidates.length >= 4) {
      categories.push({
        id: 'legendary',
        title: 'Legendarios',
        familyKey: 'legendary',
        kind: 'legendary',
        matcher: (pokemon) => this.isLegendary(pokemon),
        candidates: shuffleArray(legendaryCandidates),
      });
    }

    categories.push(
      ...this.buildTagGroups(normalized),
      ...type1Groups,
      ...anyTypeGroups,
      ...type2Groups,
      ...generationGroups,
    );

    this.catalogCache = {
      cacheKey,
      categories: shuffleArray(categories),
    };

    return this.catalogCache.categories;
  }

  private tryBuildRound(preferredCategories: CategoryCandidate[], fallbackCategories: CategoryCandidate[]): ConnectionGroup[] | null {
    const selected: CategoryCandidate[] = [];
    const selectedPokemon = new Map<string, Pokemon[]>();
    const usedPokemonIds = new Set<number>();
    let typeCategoryCount = 0;

    for (const category of [...shuffleArray(preferredCategories), ...shuffleArray(fallbackCategories)]) {
      if (selected.length === 4) {
        break;
      }

      if (selected.some((item) => item.familyKey === category.familyKey)) {
        continue;
      }

      if (this.isTypeCategory(category.kind) && typeCategoryCount >= 2) {
        continue;
      }

      if (selected.some((item) => selectedPokemon.get(item.id)?.some((pokemon) => category.matcher(pokemon)))) {
        continue;
      }

      const available = category.candidates.filter((pokemon) =>
        !usedPokemonIds.has(pokemon.Number)
        && selected.every((item) => !item.matcher(pokemon)),
      );

      if (available.length < 4) {
        continue;
      }

      const picked = sampleUnique(available, 4);
      if (picked.length < 4) {
        continue;
      }

      selected.push(category);
      selectedPokemon.set(category.id, picked);
      picked.forEach((pokemon) => usedPokemonIds.add(pokemon.Number));
      if (this.isTypeCategory(category.kind)) {
        typeCategoryCount += 1;
      }
    }

    if (selected.length !== 4) {
      return null;
    }

    return selected.map((category) => ({
      id: category.id,
      title: category.title,
      kind: category.kind,
      pokemon: selectedPokemon.get(category.id) ?? [],
      solved: false,
    }));
  }

  private buildFallbackRound(pokemons: Pokemon[]): ConnectionRound | null {
    const byType1 = Array.from(
      pokemons.reduce((map, pokemon) => {
        const list = map.get(pokemon.Type1) ?? [];
        list.push(pokemon);
        map.set(pokemon.Type1, list);
        return map;
      }, new Map<string, Pokemon[]>()),
    )
      .filter(([, items]) => items.length >= 4)
      .sort((left, right) => right[1].length - left[1].length)
      .slice(0, 4);

    const groups: ConnectionGroup[] = byType1.map(([type, items]) => ({
      id: `fallback-type1-${type}`,
      title: `Tipo principal ${this.getTypeLabel(type)}`,
      kind: 'type1',
      pokemon: sampleUnique(items, 4),
      solved: false,
    }));

    if (groups.length < 4 || groups.some((group) => group.pokemon.length < 4)) {
      return null;
    }

    return {
      groups,
      tiles: this.buildTiles(groups),
      attemptsLeft: 4,
    };
  }

  private buildStringGroups(
    pokemons: Pokemon[],
    kind: ConnectionCategoryKind,
    getValue: (pokemon: Pokemon) => string,
    getTitle: (value: string) => string,
    getFamilyKey: (value: string) => string,
  ): CategoryCandidate[] {
    const values = Array.from(new Set(pokemons.map(getValue).filter((value) => value)));
    return this.buildValueGroups(
      pokemons,
      kind,
      values,
      (pokemon, value) => getValue(pokemon) === value,
      getTitle,
      getFamilyKey,
    );
  }

  private buildValueGroups<T extends string | number>(
    pokemons: Pokemon[],
    kind: ConnectionCategoryKind,
    values: T[],
    matcher: (pokemon: Pokemon, value: T) => boolean,
    getTitle: (value: T) => string,
    getFamilyKey: (value: T) => string,
  ): CategoryCandidate[] {
    return values
      .map((value) => {
        const candidates = shuffleArray(pokemons.filter((pokemon) => matcher(pokemon, value)));
        return {
          id: `${kind}-${value}`,
          title: getTitle(value),
          familyKey: getFamilyKey(value),
          kind,
          matcher: (pokemon: Pokemon) => matcher(pokemon, value),
          candidates,
        } satisfies CategoryCandidate;
      })
      .filter((category) => category.candidates.length >= 4);
  }

  private buildTagGroups(pokemons: Pokemon[]): CategoryCandidate[] {
    const tagMap = new Map<string, { label: string; familyKey: string; candidates: Pokemon[] }>();

    for (const pokemon of pokemons) {
      const seen = new Set<string>();
      for (const tag of pokemon.ConnectionTags ?? []) {
        if (!tag?.key || !tag?.label || seen.has(tag.key)) {
          continue;
        }

        seen.add(tag.key);
        const current = tagMap.get(tag.key) ?? {
          label: tag.label,
          familyKey: this.getTagFamilyKey(tag.key),
          candidates: [],
        };
        current.candidates.push(pokemon);
        tagMap.set(tag.key, current);
      }
    }

    return Array.from(tagMap.entries())
      .filter(([, value]) => value.candidates.length >= 4)
      .map(([key, value]) => ({
        id: `tag-${key}`,
        title: value.label,
        familyKey: value.familyKey,
        kind: 'tag' as const,
        matcher: (pokemon: Pokemon) => (pokemon.ConnectionTags ?? []).some((tag) => tag.key === key),
        candidates: shuffleArray(value.candidates),
      }));
  }

  private isLegendary(pokemon: Pokemon): boolean {
    return pokemon.Legendary === true || pokemon.Legendary === 'TRUE';
  }

  private isTypeCategory(kind: ConnectionCategoryKind): boolean {
    return kind === 'type1' || kind === 'type2' || kind === 'anyType';
  }

  private getTagFamilyKey(key: string): string {
    const parts = key.split(':');
    if (parts[0] === 'type1' || parts[0] === 'type2') {
      return `type:${parts[1] ?? key}`;
    }

    if (parts[0] === 'type' && parts[1] === 'any') {
      return `type:${parts[2] ?? key}`;
    }

    return key;
  }

  private collectGroupPokemons(groups: ConnectionGroup[]): Pokemon[] {
    return groups.reduce<Pokemon[]>((list, group) => {
      list.push(...group.pokemon);
      return list;
    }, []);
  }

  private buildTiles(groups: ConnectionGroup[]): ConnectionTile[] {
    return shuffleArray(this.collectGroupPokemons(groups)).map((pokemon) => this.createTile(pokemon));
  }

  private createTile(pokemon: Pokemon): ConnectionTile {
    const isShiny = Math.random() < CONNECTIONS_SHINY_RATE && Boolean(pokemon.FrontShiny);

    return {
      pokemon,
      isShiny,
      displaySprite: isShiny
        ? pokemon.FrontShiny!
        : pokemon.FrontDefault
          || pokemon.Sprite
          || pokemon.OfficialArtwork
          || pokemon.Image
          || pokemon.SerebiiImage
          || CONNECTIONS_SPRITE_PLACEHOLDER,
    };
  }

  private getTypeLabel(type: string): string {
    const key = type.toLowerCase().replace(/\s+/g, '-');
    return this.typeLabels[key] ?? type;
  }
}
