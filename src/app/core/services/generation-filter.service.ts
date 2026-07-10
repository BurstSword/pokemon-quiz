import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import type { Pokemon } from '../models/pokemon.model';

const STORAGE_KEY = 'pokequiz.activeGenerations';

@Injectable({ providedIn: 'root' })
export class GenerationFilterService {
  private readonly availableGenerationsSubject = new BehaviorSubject<number[]>([]);
  private readonly activeGenerationsSubject = new BehaviorSubject<number[]>([]);
  private readonly readySubject = new BehaviorSubject<boolean>(false);

  readonly availableGenerations$ = this.availableGenerationsSubject.asObservable();
  readonly activeGenerations$ = this.activeGenerationsSubject.asObservable();
  readonly ready$ = this.readySubject.asObservable();

  activeGenerations(): number[] {
    return this.activeGenerationsSubject.value;
  }

  availableGenerations(): number[] {
    return this.availableGenerationsSubject.value;
  }

  isReady(): boolean {
    return this.readySubject.value;
  }

  initializeFromPokemonList(pokemonList: Pokemon[]): void {
    const available = Array.from(
      new Set(
        pokemonList
          .map((pokemon) => pokemon.Generation)
          .filter((generation): generation is number => typeof generation === 'number' && generation > 0),
      ),
    ).sort((left, right) => left - right);

    if (available.length === 0) {
      return;
    }

    const currentAvailable = this.availableGenerationsSubject.value;
    const stored = this.readStoredGenerations();
    const currentActive = this.activeGenerationsSubject.value;

    const availableChanged =
      available.length !== currentAvailable.length
      || available.some((generation, index) => generation !== currentAvailable[index]);

    if (!availableChanged && currentActive.length > 0) {
      return;
    }

    const baseSelection = stored.length > 0 ? stored : currentActive;
    const merged = available.filter((generation) => baseSelection.includes(generation));
    const appendedNew = available.filter((generation) => !baseSelection.includes(generation));
    const nextActive = [...merged, ...appendedNew];

    this.availableGenerationsSubject.next(available);
    this.activeGenerationsSubject.next(nextActive.length > 0 ? nextActive : [...available]);
    this.readySubject.next(true);
    this.persist();
  }

  setGenerationActive(generation: number, active: boolean): boolean {
    if (active) {
      if (this.isGenerationActive(generation)) {
        return true;
      }

      const next = [...this.activeGenerationsSubject.value, generation].sort((left, right) => left - right);
      this.activeGenerationsSubject.next(next);
      this.persist();
      return true;
    }

    const current = this.activeGenerationsSubject.value;
    if (current.length <= 1 && current.includes(generation)) {
      return false;
    }

    const next = current.filter((value) => value !== generation);
    if (next.length === 0) {
      return false;
    }

    this.activeGenerationsSubject.next(next);
    this.persist();
    return true;
  }

  toggleGeneration(generation: number): boolean {
    return this.setGenerationActive(generation, !this.isGenerationActive(generation));
  }

  selectAll(): void {
    const available = this.availableGenerationsSubject.value;
    if (available.length === 0) {
      return;
    }

    this.activeGenerationsSubject.next([...available]);
    this.persist();
  }

  isGenerationActive(generation: number): boolean {
    return this.activeGenerationsSubject.value.includes(generation);
  }

  filterPokemonByActiveGenerations(pokemonList: Pokemon[]): Pokemon[] {
    const active = this.activeGenerationsSubject.value;
    if (active.length === 0) {
      return [...pokemonList];
    }

    return pokemonList.filter((pokemon) => active.includes(pokemon.Generation));
  }

  getActivePokemonPool(pokemonList: Pokemon[]): Pokemon[] {
    return this.filterPokemonByActiveGenerations(pokemonList);
  }

  private persist(): void {
    if (typeof localStorage === 'undefined') {
      return;
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.activeGenerationsSubject.value));
    } catch {
      // Ignore storage errors and keep runtime state.
    }
  }

  private readStoredGenerations(): number[] {
    if (typeof localStorage === 'undefined') {
      return [];
    }

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return [];
      }

      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        return [];
      }

      return parsed
        .map((value) => Number(value))
        .filter((value) => Number.isInteger(value) && value > 0);
    } catch {
      return [];
    }
  }
}
