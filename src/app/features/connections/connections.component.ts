import { CommonModule, NgClass } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import type { ConnectionGroup, ConnectionRound, ConnectionTile } from '../../core/models/connections.model';
import type { Pokemon } from '../../core/models/pokemon.model';
import { combineLatest } from 'rxjs';
import { GameStatsService } from '../../core/services/game-stats.service';
import { GenerationFilterService } from '../../core/services/generation-filter.service';
import { PokemonConnectionsService } from '../../core/services/pokemon-connections.service';
import { PokemonService } from '../../core/services/pokemon.service';
import { ToastService } from '../../core/services/toast.service';
import { GameScoreBarComponent } from '../../shared/components/game-score-bar/game-score-bar.component';
import { HelpPanelComponent } from '../../shared/components/help-panel/help-panel.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { ResultBannerComponent } from '../../shared/components/result-banner/result-banner.component';
@Component({
  selector: 'app-connections',
  standalone: true,
  imports: [CommonModule, NgClass, PageHeaderComponent, HelpPanelComponent, ResultBannerComponent, GameScoreBarComponent],
  templateUrl: './connections.component.html',
  styleUrl: './connections.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConnectionsComponent implements OnInit {
  readonly modeId = 'connections' as const;
  readonly attemptSlots = [0, 1, 2, 3];
  pokemons: Pokemon[] = [];
  round?: ConnectionRound;
  loading = true;
  loadError = '';
  helpOpen = false;
  resultStatus: 'correct' | 'incorrect' | null = null;
  resultTitle = '';
  resultMessage = '';
  resultPoints: number | null = null;
  resultStreakText = '';
  resultRecordText = '';
  readonly nextLabel = 'Nueva ronda';

  private readonly selectedIds = new Set<number>();
  private readonly shakingIds = new Set<number>();
  private shakeTimeout?: ReturnType<typeof setTimeout>;
  private roundStartedAt = 0;
  private roundRecorded = false;

  constructor(
    private readonly pokemonService: PokemonService,
    private readonly generationFilterService: GenerationFilterService,
    private readonly pokemonConnectionsService: PokemonConnectionsService,
    private readonly toastService: ToastService,
    private readonly gameStatsService: GameStatsService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    combineLatest([
      this.pokemonService.getEnrichedPokemonList(),
      this.generationFilterService.activeGenerations$,
    ]).subscribe(([pokemons]) => {
      this.generationFilterService.initializeFromPokemonList(pokemons);
      this.pokemons = this.generationFilterService.getActivePokemonPool(pokemons);
      if (this.pokemons.length < 16) {
        this.loading = false;
        this.loadError = 'Activa más generaciones para jugar a Conexiones.';
        this.round = undefined;
        this.cdr.markForCheck();
        return;
      }

      this.startRound();
    });
  }

  get activeTiles(): ConnectionTile[] {
    return this.round?.tiles.filter((tile) => !tile.solvedGroupId) ?? [];
  }

  get solvedGroups(): ConnectionGroup[] {
    return this.round?.groups.filter((group) => group.solved) ?? [];
  }

  get selectedCount(): number {
    return this.selectedIds.size;
  }

  get canSubmit(): boolean {
    return !this.loading && !this.resultStatus && this.selectedCount === 4;
  }

  get attemptsLeft(): number {
    return this.round?.attemptsLeft ?? 0;
  }

  startRound(): void {
    if (this.pokemons.length === 0) {
      return;
    }

    this.toastService.clear();
    this.helpOpen = false;
    this.loadError = '';
    this.loading = true;
    this.resultStatus = null;
    this.resultTitle = '';
    this.resultMessage = '';
    this.resultPoints = null;
    this.resultStreakText = '';
    this.resultRecordText = '';
    this.roundStartedAt = Date.now();
    this.roundRecorded = false;
    this.selectedIds.clear();
    this.shakingIds.clear();

    if (this.shakeTimeout) {
      clearTimeout(this.shakeTimeout);
      this.shakeTimeout = undefined;
    }

    this.cdr.markForCheck();

    requestAnimationFrame(() => {
      this.round = this.pokemonConnectionsService.createRound(this.pokemons) ?? undefined;
      this.loading = false;
      if (!this.round) {
        this.loadError = 'Activa más generaciones para jugar a Conexiones.';
      }
      this.cdr.markForCheck();
    });
  }

  toggleTile(tile: ConnectionTile): void {
    if (!this.round || this.resultStatus || tile.solvedGroupId) {
      return;
    }

    const pokemonId = tile.pokemon.Number;
    if (this.selectedIds.has(pokemonId)) {
      this.selectedIds.delete(pokemonId);
      this.cdr.markForCheck();
      return;
    }

    if (this.selectedIds.size >= 4) {
      return;
    }

    this.selectedIds.add(pokemonId);
    this.cdr.markForCheck();
  }

  submitSelection(): void {
    const round = this.round;
    if (!round || this.selectedIds.size !== 4 || this.resultStatus) {
      return;
    }

    const match = round.groups.find((group) =>
      !group.solved
      && group.pokemon.length === 4
      && group.pokemon.every((pokemon) => this.selectedIds.has(pokemon.Number)),
    );

    if (match) {
      const selected = new Set(this.selectedIds);
      this.round = {
        ...round,
        groups: round.groups.map((group) =>
          group.id === match.id ? { ...group, solved: true } : group,
        ),
        tiles: round.tiles.map((tile) =>
          selected.has(tile.pokemon.Number)
            ? { ...tile, solvedGroupId: match.id }
            : tile,
        ),
      };

      this.selectedIds.clear();
      this.toastService.show(`Grupo correcto: ${match.title}`, 'success', 1400);

      if (this.round.groups.every((group) => group.solved)) {
        this.resultStatus = 'correct';
        this.resultTitle = 'Completado!';
        this.resultMessage = 'Has resuelto todas las conexiones.';
        this.finalizeRound(true, this.round.attemptsLeft);
      }

      this.cdr.markForCheck();
      return;
    }

    const attemptsLeft = Math.max(0, round.attemptsLeft - 1);
    const overlap = this.getMaxOverlap(round.groups);
    this.round = { ...round, attemptsLeft };
    this.triggerShake();
    this.selectedIds.clear();

    if (attemptsLeft === 0) {
      this.revealAllGroups();
      this.resultStatus = 'incorrect';
      this.resultTitle = 'Fin de la ronda';
      this.resultMessage = 'Estas eran las agrupaciones correctas.';
      this.finalizeRound(false, 0);
    } else {
      this.toastService.show(`${this.getOverlapMessage(overlap)} Te quedan ${attemptsLeft} intentos.`, 'danger', 1500);
    }

    this.cdr.markForCheck();
  }

  toggleHelp(): void {
    this.helpOpen = !this.helpOpen;
  }

  closeHelp(): void {
    this.helpOpen = false;
  }

  isSelected(tile: ConnectionTile): boolean {
    return this.selectedIds.has(tile.pokemon.Number);
  }

  isShaking(tile: ConnectionTile): boolean {
    return this.shakingIds.has(tile.pokemon.Number);
  }

  isAttemptAvailable(index: number): boolean {
    return index < this.attemptsLeft;
  }

  getSolvedTone(index: number): string {
    return `tone-${index % 4}`;
  }

  getTileDisplaySprite(tile: ConnectionTile): string {
    return tile.displaySprite || this.getSpriteFallback(tile.pokemon);
  }

  getSolvedPokemonSprite(pokemon: Pokemon): string {
    return this.getTileByPokemonNumber(pokemon.Number)?.displaySprite || this.getSpriteFallback(pokemon);
  }

  isPokemonShiny(pokemon: Pokemon): boolean {
    return this.getTileByPokemonNumber(pokemon.Number)?.isShiny ?? false;
  }

  getPokemonLabel(pokemon: Pokemon): string {
    return pokemon.SpanishName || pokemon.DisplayName || pokemon.Name;
  }

  trackByTile = (_: number, tile: ConnectionTile): number => tile.pokemon.Number;
  trackByGroup = (_: number, group: ConnectionGroup): string => group.id;
  trackByPokemon = (_: number, pokemon: Pokemon): number => pokemon.Number;

  private revealAllGroups(): void {
    const round = this.round;
    if (!round) {
      return;
    }

    const tileToGroupId = new Map<number, string>();
    round.groups.forEach((group) => {
      group.pokemon.forEach((pokemon) => tileToGroupId.set(pokemon.Number, group.id));
    });

    this.round = {
      ...round,
      groups: round.groups.map((group) => ({ ...group, solved: true })),
      tiles: round.tiles.map((tile) => ({
        ...tile,
        solvedGroupId: tileToGroupId.get(tile.pokemon.Number),
      })),
    };
  }

  private triggerShake(): void {
    this.shakingIds.clear();
    this.selectedIds.forEach((id) => this.shakingIds.add(id));

    if (this.shakeTimeout) {
      clearTimeout(this.shakeTimeout);
    }

    this.shakeTimeout = setTimeout(() => {
      this.shakingIds.clear();
      this.cdr.markForCheck();
    }, 420);
  }

  private getMaxOverlap(groups: ConnectionGroup[]): number {
    const selected = this.selectedIds;
    return groups
      .filter((group) => !group.solved)
      .reduce((maxOverlap, group) => {
        const overlap = group.pokemon.filter((pokemon) => selected.has(pokemon.Number)).length;
        return Math.max(maxOverlap, overlap);
      }, 0);
  }

  private getOverlapMessage(overlap: number): string {
    if (overlap >= 3) {
      return '3 coincidencias.';
    }

    if (overlap === 2) {
      return '2 coincidencias.';
    }

    return 'No encajan.';
  }

  private getTileByPokemonNumber(number: number): ConnectionTile | undefined {
    return this.round?.tiles.find((tile) => tile.pokemon.Number === number);
  }

  private getSpriteFallback(pokemon: Pokemon): string {
    return pokemon.FrontDefault
      || pokemon.Sprite
      || pokemon.OfficialArtwork
      || pokemon.Image
      || pokemon.SerebiiImage
      || 'data:image/svg+xml;charset=UTF-8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 80 80%22%3E%3Crect width=%2280%22 height=%2280%22 rx=%2218%22 fill=%22%23e2e8f0%22/%3E%3Ccircle cx=%2240%22 cy=%2228%22 r=%2212%22 fill=%22%2394a3b8%22/%3E%3Crect x=%2222%22 y=%2246%22 width=%2236%22 height=%2212%22 rx=%226%22 fill=%22%2394a3b8%22/%3E%3C/svg%3E';
  }

  private finalizeRound(won: boolean, remainingMistakes: number): void {
    if (this.roundRecorded) {
      return;
    }

    this.roundRecorded = true;
    const feedback = this.gameStatsService.recordGameResult({
      mode: this.modeId,
      won,
      correct: won ? 1 : 0,
      wrong: won ? 0 : 1,
      remainingMistakes,
      durationMs: this.roundStartedAt > 0 ? Date.now() - this.roundStartedAt : undefined,
      perfectRound: won && remainingMistakes === 4,
    });

    this.resultPoints = feedback.points;
    this.resultStreakText = feedback.lostStreak
      ? 'Racha perdida'
      : feedback.currentModeStreak > 0
        ? `Racha ${feedback.currentModeStreak}`
        : '';
    this.resultRecordText = feedback.isNewRecord
      ? 'Nuevo record'
      : feedback.modeStats.bestScore > 0
        ? `Record ${feedback.modeStats.bestScore}`
        : '';

    if (!won && feedback.lostStreak) {
      this.resultMessage = `${this.resultMessage} Racha reiniciada.`;
    }
  }
}
