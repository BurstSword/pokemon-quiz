import { ChangeDetectionStrategy, Component, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { NgIf } from '@angular/common';
import type { Pokemon } from '../../../core/models/pokemon.model';
import { PokemonTypeService } from '../../../core/services/pokemon-type.service';

@Component({
  selector: 'app-pokemon-detail-dialog',
  standalone: true,
  imports: [NgIf],
  templateUrl: './pokemon-detail-dialog.component.html',
  styleUrl: './pokemon-detail-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PokemonDetailDialogComponent {
  @Input({ required: true }) pokemon!: Pokemon;
  @Output() readonly close = new EventEmitter<void>();

  constructor(private readonly pokemonTypeService: PokemonTypeService) {}

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.close.emit();
  }

  getImageUrl(type: string): string {
    return this.pokemonTypeService.getTypeImage(type);
  }

  get displayName(): string {
    return this.pokemon.SpanishName || this.pokemon.DisplayName || this.pokemon.Name;
  }

  get description(): string {
    return this.pokemon.DescriptionEs || this.pokemon.Description || this.pokemon.DescriptionEn || 'No hay descripción disponible.';
  }

  get genus(): string | null {
    return this.pokemon.Genus || null;
  }

  get isLegendary(): boolean {
    return this.pokemon.IsLegendary || this.pokemon.IsMythical || this.pokemon.Legendary === true || this.pokemon.Legendary === 'TRUE';
  }
}
