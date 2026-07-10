import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { combineLatest } from 'rxjs';
import type { Pokemon } from '../../core/models/pokemon.model';
import { GenerationFilterService } from '../../core/services/generation-filter.service';
import { PokemonService } from '../../core/services/pokemon.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';

type RoutePath =
  | 'shadow-quiz'
  | 'blur-quiz'
  | 'clues'
  | 'colors'
  | 'connections'
  | 'pokedex';

interface LobbyRoute {
  path: RoutePath;
  title: string;
  description: string;
  icon: 'shadow' | 'blur' | 'colors' | 'clues' | 'connections' | 'pokedex';
}

@Component({
  selector: 'app-lobby',
  standalone: true,
  imports: [CommonModule, RouterLink, PageHeaderComponent],
  templateUrl: './lobby.component.html',
  styleUrl: './lobby.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LobbyComponent implements OnInit {
  readonly routes: ReadonlyArray<LobbyRoute> = [
    {
      path: 'shadow-quiz',
      title: 'Quiz sombra',
      description: 'Reconoce al Pokémon por su silueta.',
      icon: 'shadow',
    },
    {
      path: 'blur-quiz',
      title: 'Quiz blur',
      description: 'Adivina antes de que la imagen se aclare.',
      icon: 'blur',
    },
    {
      path: 'colors',
      title: 'Quiz colores',
      description: 'Encuentra al Pokémon por su paleta.',
      icon: 'colors',
    },
    {
      path: 'clues',
      title: 'Quiz pistas',
      description: 'Empieza por la Pokédex y pide pistas.',
      icon: 'clues',
    },
    {
      path: 'connections',
      title: 'Conexiones Pokémon',
      description: 'Agrupa 16 Pokémon por algo en común.',
      icon: 'connections',
    },
    {
      path: 'pokedex',
      title: 'Pokédex',
      description: 'Explora especies, tipos y descripciones.',
      icon: 'pokedex',
    },
  ];

  readonly logoPath = 'assets/brand/pokequiz-mark.svg';
  allPokemons: Pokemon[] = [];
  availableGenerations: number[] = [];
  activeGenerations: number[] = [];
  activePoolCount = 0;
  generationNotice = '';
  generationsReady = false;

  constructor(
    private readonly pokemonService: PokemonService,
    private readonly generationFilterService: GenerationFilterService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    combineLatest([
      this.pokemonService.getEnrichedPokemonList(),
      this.generationFilterService.activeGenerations$,
      this.generationFilterService.availableGenerations$,
      this.generationFilterService.ready$,
    ]).subscribe(([pokemons, activeGenerations, availableGenerations, ready]) => {
      this.generationFilterService.initializeFromPokemonList(pokemons);
      this.allPokemons = [...pokemons];
      this.availableGenerations = availableGenerations.length > 0
        ? [...availableGenerations]
        : this.generationFilterService.availableGenerations();
      this.activeGenerations = activeGenerations.length > 0
        ? [...activeGenerations]
        : this.generationFilterService.activeGenerations();
      this.activePoolCount = this.generationFilterService.getActivePokemonPool(this.allPokemons).length;
      this.generationsReady = ready || this.generationFilterService.isReady();
      this.cdr.markForCheck();
    });
  }

  toggleGeneration(generation: number): void {
    const updated = this.generationFilterService.toggleGeneration(generation);
    this.generationNotice = updated ? '' : 'Selecciona al menos una generación.';
    this.cdr.markForCheck();
  }

  selectAllGenerations(): void {
    this.generationFilterService.selectAll();
    this.generationNotice = '';
    this.cdr.markForCheck();
  }

  isGenerationActive(generation: number): boolean {
    return this.activeGenerations.includes(generation);
  }

  trackByPath = (_: number, route: LobbyRoute): string => route.path;
  trackByGeneration = (_: number, generation: number): number => generation;
}
