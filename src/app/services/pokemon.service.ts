import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, shareReplay } from 'rxjs/operators';
import { Observable } from 'rxjs';
import type { Pokemon } from 'interfaces';

@Injectable({ providedIn: 'root' })
export class PokemonService {
  private readonly pokemons$ = this.http.get<Pokemon[]>('assets/pokemon.json').pipe(
    map((list) => list.map((pokemon) => ({ ...pokemon }))),
    shareReplay({ bufferSize: 1, refCount: false }),
  );

  constructor(private http: HttpClient) {}

  getPokemons(): Observable<Pokemon[]> {
    return this.pokemons$;
  }
}
