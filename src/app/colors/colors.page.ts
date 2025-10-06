import { Component, OnInit } from '@angular/core';
import { Pokemon } from 'interfaces';

@Component({
  selector: 'app-colors',
  templateUrl: './colors.page.html',
  styleUrls: ['./colors.page.scss'],
})
export class ColorsPage implements OnInit {
  pokemons: Pokemon[] = [];
  pokemon: Pokemon = {} as Pokemon;
  visible: boolean = false;
  pokemonTypes: boolean = false;

  pokemonTypesArray = [
    { type: 'Normal', image: '../../assets/pokemontypes/normal.webp' },
    { type: 'Fire', image: '../../assets/pokemontypes/fire.webp' },
    { type: 'Water', image: '../../assets/pokemontypes/water.webp' },
    { type: 'Electric', image: '../../assets/pokemontypes/electric.webp' },
    { type: 'Grass', image: '../../assets/pokemontypes/grass.webp' },
    { type: 'Ice', image: '../../assets/pokemontypes/ice.webp' },
    { type: 'Fighting', image: '../../assets/pokemontypes/fighting.webp' },
    { type: 'Poison', image: '../../assets/pokemontypes/poison.webp' },
    { type: 'Ground', image: '../../assets/pokemontypes/ground.webp' },
    { type: 'Flying', image: '../../assets/pokemontypes/flying.webp' },
    { type: 'Psychic', image: '../../assets/pokemontypes/psychic.webp' },
    { type: 'Bug', image: '../../assets/pokemontypes/bug.webp' },
    { type: 'Rock', image: '../../assets/pokemontypes/rock.webp' },
    { type: 'Ghost', image: '../../assets/pokemontypes/ghost.webp' },
    { type: 'Dragon', image: '../../assets/pokemontypes/dragon.webp' },
    { type: 'Dark', image: '../../assets/pokemontypes/dark.webp' },
    { type: 'Steel', image: '../../assets/pokemontypes/steel.webp' },
    { type: 'Fairy', image: '../../assets/pokemontypes/fairy.webp' },
  ];

  constructor() { }

  ngOnInit() {
  }

  getImageUrl(type: string) {
    const pokemonType = this.pokemonTypesArray.find(pokemonType => pokemonType.type === type);
    return pokemonType ? pokemonType.image : '';
  }

  showPokemonTypes() {
    this.pokemonTypes = !this.pokemonTypes;
  }

  // Function to extract the dominant color from a Base64 image string
  extractDominantColor(base64Image: string): Promise<string> {
    return new Promise((resolve, reject) => {
      // Create a new image and set the source to the Base64 string
      const img = new Image();
      img.src = base64Image;

      // Ensure cross-origin access is allowed for canvas manipulation
      img.crossOrigin = 'Anonymous';

      img.onload = () => {
        // Create a canvas and get its context
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject('Unable to get canvas context');
          return;
        }

        // Set canvas size to the image size
        canvas.width = img.width;
        canvas.height = img.height;

        // Draw the image onto the canvas
        ctx.drawImage(img, 0, 0);

        // Get the image data from the canvas
        const imageData = ctx.getImageData(0, 0, img.width, img.height);
        const data = imageData.data;

        // Object to keep track of color frequency
        const colorMap: { [key: string]: number } = {};

        // Loop through every pixel's color data
        for (let i = 0; i < data.length; i += 4) {
          // Convert the color to a string in the format "r-g-b"
          const color = `${data[i]}-${data[i + 1]}-${data[i + 2]}`;

          // Increment the count for the color
          if (colorMap[color]) {
            colorMap[color]++;
          } else {
            colorMap[color] = 1;
          }
        }

        // Find the most frequent color
        let dominantColor = '#000000';
        let maxCount = 0;
        for (const color in colorMap) {
          if (colorMap[color] > maxCount) {
            maxCount = colorMap[color];
            const rgb = color.split('-').map(c => parseInt(c, 10));
            dominantColor = `rgb(${rgb.join(',')})`;
          }
        }

        // Resolve the promise with the dominant color
        resolve(dominantColor);
      };

      img.onerror = (error) => {
        reject('Error loading image');
      };
    });
  }

  getDominantColor(base64Image: string) {
    this.extractDominantColor(base64Image).then((color) => {
      console.log(color);
    }).catch((error) => {
      console.error(error);
    });
  }
  
}

export async function getPokemons(): Promise<Pokemon[]> {
  const request = await fetch('./assets/pokemon.json')
  const data = await request.json()
  return data
}