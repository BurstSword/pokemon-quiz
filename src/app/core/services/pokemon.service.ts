import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, shareReplay, switchMap } from 'rxjs/operators';
import type { Pokemon } from '../models/pokemon.model';

@Injectable({ providedIn: 'root' })
export class PokemonService {
  private readonly http = inject(HttpClient);

  private readonly originalPokemons$ = this.loadPokemonList('assets/pokemon.json');

  private readonly fixedPokemons$ = this.loadPokemonList('assets/pokemon.fixed.json').pipe(
    switchMap((pokemons) => (pokemons.length > 0 ? of(pokemons) : this.originalPokemons$)),
    shareReplay({ bufferSize: 1, refCount: false }),
  );

  private readonly enrichedPokemons$ = this.loadPokemonList('assets/pokemon.enriched.json').pipe(
    switchMap((pokemons) => (pokemons.length > 0 ? of(pokemons) : this.fixedPokemons$)),
    shareReplay({ bufferSize: 1, refCount: false }),
  );

  getPokemons(): Observable<Pokemon[]> {
    return this.getPokemonList();
  }

  getPokemonList(): Observable<Pokemon[]> {
    return this.fixedPokemons$;
  }

  getFixedPokemonList(): Observable<Pokemon[]> {
    return this.fixedPokemons$;
  }

  getEnrichedPokemonList(): Observable<Pokemon[]> {
    return this.enrichedPokemons$;
  }

  private loadPokemonList(assetPath: string): Observable<Pokemon[]> {
    return this.http.get<Pokemon[]>(assetPath).pipe(
      map((list) => list.map((pokemon) => this.normalizePokemon(pokemon))),
      catchError((error) => {
        console.warn(`Error loading pokemon data from ${assetPath}:`, error);
        return of([] as Pokemon[]);
      }),
      shareReplay({ bufferSize: 1, refCount: false }),
    );
  }

  private normalizePokemon(pokemon: Pokemon): Pokemon {
    const normalizedLegendary =
      pokemon.Legendary === true
      || pokemon.Legendary === 'TRUE'
      || pokemon.IsLegendary === true
      || pokemon.IsMythical === true;

    return {
      ...pokemon,
      Legendary: normalizedLegendary,
      Type2: pokemon.Type2 ?? '',
      EggGroups: pokemon.EggGroups ?? [],
      Abilities: pokemon.Abilities ?? [],
      EvolutionFamily: pokemon.EvolutionFamily ?? [],
      EvolutionLineNames: pokemon.EvolutionLineNames ?? [],
      Tags: pokemon.Tags ?? [],
      ConnectionTags: pokemon.ConnectionTags ?? [],
      ClueTags: pokemon.ClueTags ?? [],
      IsLegendary: pokemon.IsLegendary ?? normalizedLegendary,
      IsMythical: pokemon.IsMythical ?? false,
      IsBaby: pokemon.IsBaby ?? false,
    };
  }
}
