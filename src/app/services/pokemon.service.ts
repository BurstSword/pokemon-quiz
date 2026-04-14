import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, shareReplay } from 'rxjs/operators';
import { Observable, of } from 'rxjs';
import type { Pokemon } from 'interfaces';

@Injectable({ providedIn: 'root' })
export class PokemonService {
  private readonly pokemons$ = this.http.get<Pokemon[]>('assets/pokemon.json').pipe(
    map((list) => list.map((pokemon) => ({ ...pokemon }))),
    catchError((err) => {
      console.error('Error loading pokemon data:', err);
      return of([] as Pokemon[]);
    }),
    shareReplay({ bufferSize: 1, refCount: false }),
  );

  constructor(private http: HttpClient) {}

  getPokemons(): Observable<Pokemon[]> {
    return this.pokemons$;
  }
}
