import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const assetsDir = path.join(rootDir, 'src', 'assets');
const inputPath = path.join(assetsDir, 'pokemon.json');
const fixedPath = path.join(assetsDir, 'pokemon.fixed.json');
const enrichedPath = path.join(assetsDir, 'pokemon.enriched.json');
const summaryPath = path.join(assetsDir, 'pokemon.connection-tags.summary.json');
const cacheDir = path.join(rootDir, '.cache', 'pokeapi');

const refresh = process.argv.includes('--refresh');
const concurrency = process.argv.includes('--concurrency')
  ? Math.max(1, Number(process.argv[process.argv.indexOf('--concurrency') + 1]) || 6)
  : 6;

const generationMap = {
  'generation-i': 1,
  'generation-ii': 2,
  'generation-iii': 3,
  'generation-iv': 4,
  'generation-v': 5,
  'generation-vi': 6,
  'generation-vii': 7,
  'generation-viii': 8,
  'generation-ix': 9,
};

const languagePriority = {
  description: ['en', 'es'],
};

const colorLabels = {
  black: 'Color negro',
  blue: 'Color azul',
  brown: 'Color marrón',
  gray: 'Color gris',
  green: 'Color verde',
  pink: 'Color rosa',
  purple: 'Color morado',
  red: 'Color rojo',
  white: 'Color blanco',
  yellow: 'Color amarillo',
};

const shapeLabels = {
  armor: 'Forma armadura',
  arms: 'Forma con brazos',
  ball: 'Forma bola',
  blob: 'Forma amorfa',
  bipedal: 'Forma bípeda',
  'bug-wings': 'Forma alas de bicho',
  fish: 'Forma pez',
  heads: 'Forma varias cabezas',
  humanoid: 'Forma humanoide',
  legs: 'Forma con patas',
  quadruped: 'Forma cuadrúpeda',
  squiggle: 'Forma serpenteante',
  tentacles: 'Forma tentáculos',
  upright: 'Forma erguida',
  wings: 'Forma con alas',
};

const habitatLabels = {
  cave: 'Hábitat cueva',
  forest: 'Hábitat bosque',
  grassland: 'Hábitat pradera',
  mountain: 'Hábitat montaña',
  rare: 'Hábitat raro',
  'rough-terrain': 'Hábitat terreno abrupto',
  sea: 'Hábitat mar',
  urban: 'Hábitat zona urbana',
  'waters-edge': 'Hábitat orilla',
};

const eggGroupLabels = {
  amorphous: 'Grupo huevo amorfo',
  bug: 'Grupo huevo bicho',
  ditto: 'Grupo huevo Ditto',
  dragon: 'Grupo huevo dragón',
  fairy: 'Grupo huevo hada',
  field: 'Grupo huevo campo',
  flying: 'Grupo huevo volador',
  ground: 'Grupo huevo campo',
  grass: 'Grupo huevo planta',
  'human-like': 'Grupo huevo humanoide',
  humanshape: 'Grupo huevo humanoide',
  indeterminate: 'Grupo huevo amorfo',
  mineral: 'Grupo huevo mineral',
  monster: 'Grupo huevo monstruo',
  'no-eggs': 'Grupo huevo sin huevos',
  plant: 'Grupo huevo planta',
  undiscovered: 'Grupo huevo desconocido',
  water1: 'Grupo huevo agua 1',
  water2: 'Grupo huevo agua 2',
  water3: 'Grupo huevo agua 3',
};

const typeLabels = {
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

const forbiddenVisibleLabelFragments = [
  'Generacion',
  'Habitat',
  'cuadrupeda',
  'pequenos',
  'Pokemon ligeros',
  'Pokemon pequenos',
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

await mkdir(cacheDir, { recursive: true });

const inputList = JSON.parse(await readFile(inputPath, 'utf8'));
const numberToOriginal = new Map(inputList.map((pokemon) => [pokemon.Number, pokemon]));
const speciesIdToNumber = new Map();

console.log(`[enrich] Loaded ${inputList.length} base Pokemon from ${path.relative(rootDir, inputPath)}`);
console.log(`[enrich] Refresh cache: ${refresh ? 'yes' : 'no'} | Concurrency: ${concurrency}`);

const runtimeCache = new Map();
const evolutionRuntimeCache = new Map();

const results = await mapWithConcurrency(inputList, concurrency, async (pokemon, index) => {
  const position = `${index + 1}/${inputList.length}`;
  try {
    const bundle = await fetchPokemonBundle(pokemon.Number);
    if (bundle.species?.name) {
      speciesIdToNumber.set(bundle.species.name, pokemon.Number);
    }

    const fixed = buildFixedPokemon(pokemon, bundle);
    const enriched = normalizeEnrichedPokemonShape(buildEnrichedPokemon(fixed, pokemon, bundle));
    if ((index + 1) % 50 === 0 || index === inputList.length - 1) {
      console.log(`[enrich] Processed ${position}`);
    }

    return {
      fixed,
      enriched,
      ok: true,
    };
  } catch (error) {
    const message = summarizeError(error);
    console.warn(`[enrich] ${position} failed for #${pokemon.Number} ${pokemon.Name}: ${message}`);
    return {
      fixed: buildFixedPokemon(pokemon),
      enriched: normalizeEnrichedPokemonShape({
        ...buildFixedPokemon(pokemon),
        DisplayName: pokemon.Name,
        EnrichmentError: message,
      }),
      ok: false,
      error: message,
    };
  }
});

const fixedList = results.map((result) => result.fixed);
const enrichedList = results.map((result) => result.enriched);

const tagCounter = new Map();
for (const pokemon of enrichedList) {
  const uniqueKeys = new Set();
  for (const tag of pokemon.ConnectionTags ?? []) {
    if (!tag?.key || uniqueKeys.has(tag.key)) {
      continue;
    }
    uniqueKeys.add(tag.key);
    const current = tagCounter.get(tag.key) ?? { label: tag.label, count: 0 };
    current.count += 1;
    tagCounter.set(tag.key, current);
  }
}

const summaryList = Array.from(tagCounter.entries())
  .map(([key, value]) => ({
    key,
    label: value.label,
    count: value.count,
  }))
  .filter((entry) => entry.count >= 4)
  .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label));

validateOutputs(inputList, fixedList, enrichedList, summaryList);

await writeJson(fixedPath, fixedList);
await writeJson(enrichedPath, enrichedList);
await writeJson(summaryPath, summaryList);

const okCount = results.filter((result) => result.ok).length;
const errorCount = results.length - okCount;

console.log('[enrich] Completed.');
console.log(`[enrich] Total processed: ${results.length}`);
console.log(`[enrich] Enriched OK: ${okCount}`);
console.log(`[enrich] Enriched with error fallback: ${errorCount}`);
console.log(`[enrich] Generated: ${path.relative(rootDir, fixedPath)}`);
console.log(`[enrich] Generated: ${path.relative(rootDir, enrichedPath)}`);
console.log(`[enrich] Generated: ${path.relative(rootDir, summaryPath)}`);

async function fetchPokemonBundle(number) {
  const pokemon = await readOrFetchCachedJson(`pokemon-${number}.json`, `https://pokeapi.co/api/v2/pokemon/${number}`);
  const species = await readOrFetchCachedJson(`species-${number}.json`, `https://pokeapi.co/api/v2/pokemon-species/${number}`);

  let evolutionChain = null;
  if (species?.evolution_chain?.url) {
    const chainId = extractTrailingId(species.evolution_chain.url);
    const cacheKey = `evolution-chain-${chainId}.json`;
    const runtimeKey = `evolution:${chainId}`;
    if (!evolutionRuntimeCache.has(runtimeKey)) {
      evolutionRuntimeCache.set(
        runtimeKey,
        readOrFetchCachedJson(cacheKey, species.evolution_chain.url),
      );
    }
    evolutionChain = await evolutionRuntimeCache.get(runtimeKey);
  }

  return { pokemon, species, evolutionChain };
}

async function readOrFetchCachedJson(cacheFileName, url) {
  const fullPath = path.join(cacheDir, cacheFileName);
  const runtimeKey = `${cacheFileName}:${refresh ? 'refresh' : 'cache'}`;
  if (runtimeCache.has(runtimeKey)) {
    return runtimeCache.get(runtimeKey);
  }

  const promise = (async () => {
    if (!refresh) {
      try {
        const cached = await readFile(fullPath, 'utf8');
        return JSON.parse(cached);
      } catch (error) {
        if (error?.code !== 'ENOENT') {
          throw error;
        }
      }
    }

    const json = await fetchJsonWithRetry(url);
    await writeJson(fullPath, json);
    return json;
  })();

  runtimeCache.set(runtimeKey, promise);
  return promise;
}

async function fetchJsonWithRetry(url, retries = 3) {
  let lastError;
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(url, {
        headers: {
          'accept': 'application/json',
          'user-agent': 'pokemon-quiz-data-enricher/1.0',
        },
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} for ${url}`);
      }
      return await response.json();
    } catch (error) {
      clearTimeout(timeout);
      lastError = error;
      if (attempt < retries) {
        await sleep(400 * attempt);
      }
    }
  }

  throw lastError;
}

function buildFixedPokemon(original, bundle = {}) {
  const pokemonData = bundle.pokemon;
  const speciesData = bundle.species;
  const type1 = normalizeType(pokemonData?.types?.find((type) => type.slot === 1)?.type?.name) || original.Type1;
  const type2 = normalizeType(pokemonData?.types?.find((type) => type.slot === 2)?.type?.name) || '';
  const generation = generationMap[speciesData?.generation?.name] ?? original.Generation;
  const isSpecial = Boolean(speciesData?.is_legendary || speciesData?.is_mythical);
  const legendary = isSpecial ? 'TRUE' : 'FALSE';
  const descriptionFallback = getBestDescription(speciesData) ?? normalizeLoreText(original.Description);
  const description = shouldReplaceDescription(original.Description)
    ? descriptionFallback
    : normalizeLoreText(original.Description);

  return {
    Number: original.Number,
    Name: normalizeText(original.Name) || formatDisplayName(speciesData?.name) || `Pokémon ${original.Number}`,
    Generation: generation,
    Legendary: legendary,
    Image: normalizeText(original.Image) || getOfficialArtwork(pokemonData) || getSerebiiImage(original.Number),
    Type1: type1,
    Type2: type2,
    Description: description || normalizeText(original.Description) || '',
  };
}

function buildEnrichedPokemon(fixed, original, bundle) {
  const pokemonData = bundle.pokemon;
  const speciesData = bundle.species;
  const evolutionChain = bundle.evolutionChain;

  const evolutionInfo = buildEvolutionInfo(original.Number, evolutionChain);
  const stats = buildStats(pokemonData?.stats ?? []);
  const highestStat = getHighestStat(stats);
  const descriptionEn = getFlavorText(speciesData, 'en') ?? fixed.Description;
  const descriptionEs = getFlavorText(speciesData, 'es') ?? null;
  const genus = getGenus(speciesData, ['es', 'en']) ?? null;
  const englishName = getLocalizedName(speciesData, 'en') ?? fixed.Name;
  const spanishName = getLocalizedName(speciesData, 'es') ?? null;
  const japaneseName = getLocalizedName(speciesData, 'ja-Hrkt') ?? getLocalizedName(speciesData, 'ja') ?? null;
  const abilities = (pokemonData?.abilities ?? [])
    .filter((entry) => !entry.is_hidden)
    .map((entry) => entry.ability?.name)
    .filter(Boolean);
  const hiddenAbility = (pokemonData?.abilities ?? []).find((entry) => entry.is_hidden)?.ability?.name ?? null;

  const enriched = {
    ...fixed,
    Slug: pokemonData?.name ?? slugifyName(fixed.Name),
    SpeciesName: speciesData?.name ?? pokemonData?.name ?? slugifyName(fixed.Name),
    DisplayName: fixed.Name,
    EnglishName: englishName,
    SpanishName: spanishName,
    JapaneseName: japaneseName,
    DescriptionEn: descriptionEn,
    DescriptionEs: descriptionEs,
    Genus: genus,
    Color: speciesData?.color?.name ?? null,
    Shape: speciesData?.shape?.name ?? null,
    Habitat: speciesData?.habitat?.name ?? null,
    GrowthRate: speciesData?.growth_rate?.name ?? null,
    EggGroups: (speciesData?.egg_groups ?? []).map((group) => group.name),
    IsBaby: Boolean(speciesData?.is_baby),
    IsLegendary: Boolean(speciesData?.is_legendary),
    IsMythical: Boolean(speciesData?.is_mythical),
    Height: pokemonData?.height ?? null,
    Weight: pokemonData?.weight ?? null,
    HeightMeters: typeof pokemonData?.height === 'number' ? roundToOneDecimal(pokemonData.height / 10) : null,
    WeightKg: typeof pokemonData?.weight === 'number' ? roundToOneDecimal(pokemonData.weight / 10) : null,
    CaptureRate: speciesData?.capture_rate ?? null,
    BaseHappiness: speciesData?.base_happiness ?? null,
    HatchCounter: speciesData?.hatch_counter ?? null,
    GenderRate: speciesData?.gender_rate ?? null,
    BaseExperience: pokemonData?.base_experience ?? null,
    Abilities: abilities,
    HiddenAbility: hiddenAbility,
    Stats: stats,
    EvolutionChainId: evolutionInfo.chainId,
    EvolutionFamily: evolutionInfo.family,
    EvolvesFrom: evolutionInfo.evolvesFrom,
    EvolutionStage: evolutionInfo.stage,
    IsFinalEvolution: evolutionInfo.isFinalEvolution,
    EvolutionLineNames: evolutionInfo.lineNames,
    OfficialArtwork: getOfficialArtwork(pokemonData),
    FrontDefault: pokemonData?.sprites?.front_default ?? null,
    FrontShiny: pokemonData?.sprites?.front_shiny ?? null,
    Sprite: pokemonData?.sprites?.front_default ?? null,
    SerebiiImage: getSerebiiImage(original.Number),
  };

  const tags = buildTags(enriched, highestStat);
  return {
    ...enriched,
    Tags: tags.tags,
    ConnectionTags: tags.connectionTags,
    ClueTags: tags.clueTags,
  };
}

function normalizeEnrichedPokemonShape(pokemon) {
  const normalized = {
    Number: pokemon.Number ?? null,
    Name: pokemon.Name ?? '',
    Generation: pokemon.Generation ?? null,
    Legendary: pokemon.Legendary ?? 'FALSE',
    Image: pokemon.Image ?? null,
    Type1: pokemon.Type1 ?? null,
    Type2: pokemon.Type2 ?? '',
    Description: pokemon.Description ?? null,
    Slug: pokemon.Slug ?? null,
    SpeciesName: pokemon.SpeciesName ?? null,
    DisplayName: pokemon.DisplayName ?? pokemon.Name ?? '',
    EnglishName: pokemon.EnglishName ?? null,
    SpanishName: pokemon.SpanishName ?? null,
    JapaneseName: pokemon.JapaneseName ?? null,
    DescriptionEn: pokemon.DescriptionEn ?? null,
    DescriptionEs: pokemon.DescriptionEs ?? null,
    Genus: pokemon.Genus ?? null,
    Color: pokemon.Color ?? null,
    Shape: pokemon.Shape ?? null,
    Habitat: pokemon.Habitat ?? null,
    GrowthRate: pokemon.GrowthRate ?? null,
    EggGroups: Array.isArray(pokemon.EggGroups) ? pokemon.EggGroups : [],
    IsBaby: pokemon.IsBaby ?? false,
    IsLegendary: pokemon.IsLegendary ?? false,
    IsMythical: pokemon.IsMythical ?? false,
    Height: pokemon.Height ?? null,
    Weight: pokemon.Weight ?? null,
    HeightMeters: pokemon.HeightMeters ?? null,
    WeightKg: pokemon.WeightKg ?? null,
    CaptureRate: pokemon.CaptureRate ?? null,
    BaseHappiness: pokemon.BaseHappiness ?? null,
    HatchCounter: pokemon.HatchCounter ?? null,
    GenderRate: pokemon.GenderRate ?? null,
    BaseExperience: pokemon.BaseExperience ?? null,
    Abilities: Array.isArray(pokemon.Abilities) ? pokemon.Abilities : [],
    HiddenAbility: pokemon.HiddenAbility ?? null,
    Stats: normalizeStatsShape(pokemon.Stats),
    EvolutionChainId: pokemon.EvolutionChainId ?? null,
    EvolutionFamily: Array.isArray(pokemon.EvolutionFamily) ? pokemon.EvolutionFamily : [],
    EvolvesFrom: pokemon.EvolvesFrom ?? null,
    EvolutionStage: pokemon.EvolutionStage ?? null,
    IsFinalEvolution: pokemon.IsFinalEvolution ?? false,
    EvolutionLineNames: Array.isArray(pokemon.EvolutionLineNames) ? pokemon.EvolutionLineNames : [],
    OfficialArtwork: pokemon.OfficialArtwork ?? null,
    FrontDefault: pokemon.FrontDefault ?? null,
    FrontShiny: pokemon.FrontShiny ?? null,
    Sprite: pokemon.Sprite ?? null,
    SerebiiImage: pokemon.SerebiiImage ?? null,
    Tags: Array.isArray(pokemon.Tags) ? pokemon.Tags : [],
    ConnectionTags: Array.isArray(pokemon.ConnectionTags) ? pokemon.ConnectionTags : [],
    ClueTags: Array.isArray(pokemon.ClueTags) ? pokemon.ClueTags : [],
  };

  if (pokemon.EnrichmentError) {
    normalized.EnrichmentError = pokemon.EnrichmentError;
  }

  return normalized;
}

function normalizeStatsShape(stats) {
  if (stats == null) {
    return null;
  }

  return {
    HP: stats.HP ?? null,
    Attack: stats.Attack ?? null,
    Defense: stats.Defense ?? null,
    SpecialAttack: stats.SpecialAttack ?? null,
    SpecialDefense: stats.SpecialDefense ?? null,
    Speed: stats.Speed ?? null,
    Total: stats.Total ?? null,
  };
}

function buildEvolutionInfo(number, evolutionChain) {
  if (!evolutionChain?.chain) {
    return {
      chainId: null,
      family: [number],
      evolvesFrom: null,
      stage: 1,
      isFinalEvolution: true,
      lineNames: [numberToOriginal.get(number)?.Name].filter(Boolean),
    };
  }

  const nodes = [];
  walkEvolutionChain(evolutionChain.chain, 1, null, nodes);
  const selfNode = nodes.find((node) => node.number === number);
  const family = nodes
    .map((node) => node.number)
    .filter((value) => typeof value === 'number')
    .filter((value, index, values) => values.indexOf(value) === index);
  const lineNames = family
    .map((value) => numberToOriginal.get(value)?.Name)
    .filter(Boolean);

  return {
    chainId: evolutionChain.id ?? extractTrailingId(evolutionChain.chain?.species?.url ?? ''),
    family: family.length > 0 ? family : [number],
    evolvesFrom: selfNode?.parentNumber ?? null,
    stage: selfNode?.stage ?? 1,
    isFinalEvolution: selfNode ? selfNode.isFinal : true,
    lineNames,
  };
}

function walkEvolutionChain(node, stage, parentNumber, nodes) {
  if (!node?.species?.url) {
    return;
  }

  const number = extractTrailingId(node.species.url);
  const children = node.evolves_to ?? [];
  nodes.push({
    number,
    stage,
    parentNumber,
    isFinal: children.length === 0,
  });

  for (const child of children) {
    walkEvolutionChain(child, stage + 1, number, nodes);
  }
}

function buildStats(statsEntries) {
  const mapped = {
    HP: null,
    Attack: null,
    Defense: null,
    SpecialAttack: null,
    SpecialDefense: null,
    Speed: null,
    Total: null,
  };

  for (const entry of statsEntries) {
    const base = entry?.base_stat;
    switch (entry?.stat?.name) {
      case 'hp':
        mapped.HP = base;
        break;
      case 'attack':
        mapped.Attack = base;
        break;
      case 'defense':
        mapped.Defense = base;
        break;
      case 'special-attack':
        mapped.SpecialAttack = base;
        break;
      case 'special-defense':
        mapped.SpecialDefense = base;
        break;
      case 'speed':
        mapped.Speed = base;
        break;
      default:
        break;
    }
  }

  const values = [mapped.HP, mapped.Attack, mapped.Defense, mapped.SpecialAttack, mapped.SpecialDefense, mapped.Speed];
  if (values.every((value) => typeof value === 'number')) {
    mapped.Total = values.reduce((total, value) => total + value, 0);
  }

  return mapped;
}

function getHighestStat(stats) {
  const candidates = [
    ['HP', stats?.HP],
    ['Attack', stats?.Attack],
    ['Defense', stats?.Defense],
    ['SpecialAttack', stats?.SpecialAttack],
    ['SpecialDefense', stats?.SpecialDefense],
    ['Speed', stats?.Speed],
  ].filter((entry) => typeof entry[1] === 'number');

  if (candidates.length === 0) {
    return null;
  }

  candidates.sort((left, right) => right[1] - left[1]);
  return { key: candidates[0][0], value: candidates[0][1] };
}

function buildTags(pokemon, highestStat) {
  const tags = new Set();
  const connectionTagMap = new Map();
  const clueTagMap = new Map();

  const addTag = (key) => {
    if (key) {
      tags.add(key);
    }
  };

  const addConnectionTag = (key, label) => {
    if (!key || !label) return;
    connectionTagMap.set(key, { key, label });
  };

  const addClueTag = (key, label) => {
    if (!key || !label) return;
    clueTagMap.set(key, { key, label });
  };

  if (pokemon.Type1) {
    addTag(`type1:${pokemon.Type1.toLowerCase()}`);
    addTag(`type:any:${pokemon.Type1.toLowerCase()}`);
    addConnectionTag(`type1:${pokemon.Type1.toLowerCase()}`, `Tipo principal ${getTypeLabel(pokemon.Type1)}`);
    addConnectionTag(`type:any:${pokemon.Type1.toLowerCase()}`, `Tipo ${getTypeLabel(pokemon.Type1)}`);
    addClueTag(`type1:${pokemon.Type1.toLowerCase()}`, `Tipo principal ${getTypeLabel(pokemon.Type1)}`);
  }

  if (pokemon.Type2) {
    addTag(`type2:${pokemon.Type2.toLowerCase()}`);
    addTag(`type:any:${pokemon.Type2.toLowerCase()}`);
    addConnectionTag(`type2:${pokemon.Type2.toLowerCase()}`, `Tipo secundario ${getTypeLabel(pokemon.Type2)}`);
    addConnectionTag(`type:any:${pokemon.Type2.toLowerCase()}`, `Tipo ${getTypeLabel(pokemon.Type2)}`);
    addClueTag(`type2:${pokemon.Type2.toLowerCase()}`, `Tipo secundario ${getTypeLabel(pokemon.Type2)}`);
  }

  if (pokemon.Generation) {
    addTag(`generation:${pokemon.Generation}`);
    addConnectionTag(`generation:${pokemon.Generation}`, `Generación ${pokemon.Generation}`);
    addClueTag(`generation:${pokemon.Generation}`, `Generación ${pokemon.Generation}`);
  }

  if (pokemon.Color) {
    addTag(`color:${pokemon.Color}`);
    addConnectionTag(`color:${pokemon.Color}`, colorLabels[pokemon.Color] ?? `Color ${pokemon.Color}`);
    addClueTag(`color:${pokemon.Color}`, colorLabels[pokemon.Color] ?? `Color ${pokemon.Color}`);
  }

  if (pokemon.Shape) {
    addTag(`shape:${pokemon.Shape}`);
    addConnectionTag(`shape:${pokemon.Shape}`, shapeLabels[pokemon.Shape] ?? `Forma ${pokemon.Shape}`);
    addClueTag(`shape:${pokemon.Shape}`, shapeLabels[pokemon.Shape] ?? `Forma ${pokemon.Shape}`);
  }

  if (pokemon.Habitat) {
    addTag(`habitat:${pokemon.Habitat}`);
    addConnectionTag(`habitat:${pokemon.Habitat}`, habitatLabels[pokemon.Habitat] ?? `Hábitat ${pokemon.Habitat}`);
    addClueTag(`habitat:${pokemon.Habitat}`, habitatLabels[pokemon.Habitat] ?? `Hábitat ${pokemon.Habitat}`);
  }

  for (const eggGroup of pokemon.EggGroups ?? []) {
    addTag(`egg-group:${eggGroup}`);
    addConnectionTag(`egg-group:${eggGroup}`, eggGroupLabels[eggGroup] ?? `Grupo huevo ${eggGroup}`);
    addClueTag(`egg-group:${eggGroup}`, eggGroupLabels[eggGroup] ?? `Grupo huevo ${eggGroup}`);
  }

  if (pokemon.IsLegendary) {
    addTag('legendary');
    addConnectionTag('legendary', 'Legendarios');
    addClueTag('legendary', 'Legendario');
  }

  if (pokemon.IsMythical) {
    addTag('mythical');
    addConnectionTag('mythical', 'Míticos');
    addClueTag('mythical', 'Mítico');
  }

  if (pokemon.IsBaby) {
    addTag('baby');
    addConnectionTag('baby', 'Bebés');
    addClueTag('baby', 'Bebé');
  }

  if (pokemon.EvolutionStage) {
    addTag(`evolution-stage:${pokemon.EvolutionStage}`);
    addConnectionTag(`evolution-stage:${pokemon.EvolutionStage}`, `${ordinalLabel(pokemon.EvolutionStage)} fase evolutiva`);
    addClueTag(`evolution-stage:${pokemon.EvolutionStage}`, `${ordinalLabel(pokemon.EvolutionStage)} fase evolutiva`);
  }

  if (pokemon.IsFinalEvolution) {
    addTag('final-evolution');
    addConnectionTag('final-evolution', 'Evolución final');
    addClueTag('final-evolution', 'Evolución final');
  }

  if (typeof pokemon.HeightMeters === 'number') {
    if (pokemon.HeightMeters >= 2) {
      addTag('height:tall');
      addConnectionTag('height:tall', 'Pokémon grandes');
    }
    if (pokemon.HeightMeters <= 0.7) {
      addTag('height:small');
      addConnectionTag('height:small', 'Pokémon pequeños');
    }
    addClueTag('height', `Altura ${pokemon.HeightMeters} m`);
  }

  if (typeof pokemon.WeightKg === 'number') {
    if (pokemon.WeightKg >= 100) {
      addTag('weight:heavy');
      addConnectionTag('weight:heavy', 'Pokémon pesados');
    }
    if (pokemon.WeightKg <= 10) {
      addTag('weight:light');
      addConnectionTag('weight:light', 'Pokémon ligeros');
    }
    addClueTag('weight', `Peso ${pokemon.WeightKg} kg`);
  }

  if (typeof pokemon.Stats?.Speed === 'number' && pokemon.Stats.Speed >= 100) {
    addTag('stat:fast');
    addConnectionTag('stat:fast', 'Pokémon rápidos');
  }

  if (typeof pokemon.Stats?.Attack === 'number' && pokemon.Stats.Attack >= 110) {
    addTag('stat:high-attack');
    addConnectionTag('stat:high-attack', 'Ataque alto');
  }

  if (typeof pokemon.Stats?.Defense === 'number' && pokemon.Stats.Defense >= 100) {
    addTag('stat:high-defense');
    addConnectionTag('stat:high-defense', 'Defensa alta');
  }

  if (typeof pokemon.Stats?.SpecialAttack === 'number' && pokemon.Stats.SpecialAttack >= 110) {
    addTag('stat:high-special-attack');
    addConnectionTag('stat:high-special-attack', 'Ataque especial alto');
  }

  if (typeof pokemon.Stats?.SpecialDefense === 'number' && pokemon.Stats.SpecialDefense >= 110) {
    addTag('stat:high-special-defense');
    addConnectionTag('stat:high-special-defense', 'Defensa especial alta');
  }

  if (highestStat) {
    addClueTag(`stat:${highestStat.key}`, getStatClueLabel(highestStat));
  }

  return {
    tags: Array.from(tags).sort(),
    connectionTags: Array.from(connectionTagMap.values()).sort((left, right) => left.label.localeCompare(right.label)),
    clueTags: Array.from(clueTagMap.values()).sort((left, right) => left.label.localeCompare(right.label)),
  };
}

function getStatClueLabel(highestStat) {
  const labels = {
    HP: 'Destaca en PS',
    Attack: 'Destaca en ataque',
    Defense: 'Destaca en defensa',
    SpecialAttack: 'Destaca en ataque especial',
    SpecialDefense: 'Destaca en defensa especial',
    Speed: 'Destaca en velocidad',
  };

  return labels[highestStat.key] ?? 'Stat destacado';
}

function ordinalLabel(stage) {
  if (stage === 1) return 'Primera';
  if (stage === 2) return 'Segunda';
  if (stage === 3) return 'Tercera';
  return `${stage}a`;
}

function getOfficialArtwork(pokemonData) {
  return pokemonData?.sprites?.other?.['official-artwork']?.front_default
    ?? pokemonData?.sprites?.other?.home?.front_default
    ?? pokemonData?.sprites?.front_default
    ?? null;
}

function getSerebiiImage(number) {
  return `https://www.serebii.net/pokemon/art/${String(number).padStart(3, '0')}.png`;
}

function getFlavorText(speciesData, language) {
  const entries = speciesData?.flavor_text_entries ?? [];
  const match = entries.find((entry) => entry.language?.name === language);
  return normalizeLoreText(match?.flavor_text ?? '');
}

function getBestDescription(speciesData) {
  for (const language of languagePriority.description) {
    const value = getFlavorText(speciesData, language);
    if (value) {
      return value;
    }
  }

  return null;
}

function getGenus(speciesData, languages) {
  const genera = speciesData?.genera ?? [];
  for (const language of languages) {
    const genus = genera.find((entry) => entry.language?.name === language)?.genus;
    if (genus) {
      return normalizeLoreText(genus);
    }
  }
  return null;
}

function getLocalizedName(speciesData, language) {
  const names = speciesData?.names ?? [];
  const value = names.find((entry) => entry.language?.name === language)?.name;
  const normalized = normalizeText(value);
  return normalized || null;
}

function normalizeText(value) {
  if (typeof value !== 'string') {
    return '';
  }

  return value
    .replace(/[\f\n\r\t]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeLoreText(value) {
  return normalizeText(value)
    .replace(/Pok[eé]mon/gi, 'Pokémon')
    .replace(/POKÃ‰MON|POKÃ©MON|PokÃ©mon/g, 'Pokémon')
    .replace(/POK[eE]MON/g, 'Pokémon');
}

function shouldReplaceDescription(value) {
  const description = normalizeText(value);
  if (!description) {
    return true;
  }

  return /Ã|�/.test(description);
}

function normalizeType(value) {
  if (!value) return '';
  return value
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function slugifyName(value) {
  return normalizeText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function formatDisplayName(value) {
  if (!value) {
    return '';
  }

  return value
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function roundToOneDecimal(value) {
  return Math.round(value * 10) / 10;
}

function getTypeLabel(typeName) {
  if (!typeName) {
    return '';
  }

  const normalized = typeName.toLowerCase().replace(/\s+/g, '-');
  return typeLabels[normalized] ?? typeName;
}

function extractTrailingId(url) {
  const match = String(url).match(/\/(\d+)\/?$/);
  return match ? Number(match[1]) : null;
}

function summarizeError(error) {
  if (!error) {
    return 'Unknown error';
  }

  if (error.name === 'AbortError') {
    return 'Request timeout';
  }

  return String(error.message ?? error).slice(0, 200);
}

function validateOutputs(originalList, fixedList, enrichedList, summaryList) {
  const assert = (condition, message) => {
    if (!condition) {
      throw new Error(`[validate] ${message}`);
    }
  };

  assert(Array.isArray(fixedList), 'pokemon.fixed.json must be an array');
  assert(Array.isArray(enrichedList), 'pokemon.enriched.json must be an array');
  assert(Array.isArray(summaryList), 'pokemon.connection-tags.summary.json must be an array');
  assert(fixedList.length === originalList.length, 'fixed count must match original count');
  assert(enrichedList.length === originalList.length, 'enriched count must match original count');

  const seenNumbers = new Set();
  for (const pokemon of fixedList) {
    assert(pokemon && typeof pokemon === 'object', 'fixed contains null/invalid entries');
    assert(typeof pokemon.Number === 'number', 'fixed entry missing Number');
    assert(typeof pokemon.Name === 'string' && pokemon.Name.length > 0, 'fixed entry missing Name');
    assert(typeof pokemon.Type1 === 'string' && pokemon.Type1.length > 0, 'fixed entry missing Type1');
    assert(typeof pokemon.Image === 'string' && pokemon.Image.length > 0, 'fixed entry missing Image');
    assert(typeof pokemon.Type2 === 'string', 'fixed Type2 must be a string');
    assert(!seenNumbers.has(pokemon.Number), `duplicate Number in fixed: ${pokemon.Number}`);
    seenNumbers.add(pokemon.Number);
  }

  for (const pokemon of enrichedList) {
    assert(pokemon && typeof pokemon === 'object', 'enriched contains null/invalid entries');
    assert(typeof pokemon.Number === 'number', 'enriched entry missing Number');
    assert(Array.isArray(pokemon.Tags), `Tags must be an array for #${pokemon.Number}`);
    assert(Array.isArray(pokemon.ConnectionTags), `ConnectionTags must be an array for #${pokemon.Number}`);
    assert(Array.isArray(pokemon.ClueTags), `ClueTags must be an array for #${pokemon.Number}`);
    assert(Array.isArray(pokemon.EvolutionFamily), `EvolutionFamily must be an array for #${pokemon.Number}`);
    assert(Array.isArray(pokemon.EvolutionLineNames), `EvolutionLineNames must be an array for #${pokemon.Number}`);
    assert(
      pokemon.Stats === null
      || typeof pokemon.Stats === 'object',
      `Stats must be an object or null for #${pokemon.Number}`,
    );
    if (pokemon.Stats) {
      const expectedStatsKeys = ['HP', 'Attack', 'Defense', 'SpecialAttack', 'SpecialDefense', 'Speed', 'Total'];
      const statKeys = Object.keys(pokemon.Stats);
      assert(
        expectedStatsKeys.length === statKeys.length && expectedStatsKeys.every((key, index) => key === statKeys[index]),
        `Stats shape mismatch for #${pokemon.Number}`,
      );
    }
  }

  for (const entry of summaryList) {
    assert(entry.count >= 4, `summary includes tag with count < 4: ${entry.key}`);
  }

  const expectedKeys = Object.keys(enrichedList[0] ?? {});
  for (const pokemon of enrichedList) {
    const keys = Object.keys(pokemon);
    assert(
      expectedKeys.length === keys.length && expectedKeys.every((key, index) => key === keys[index]),
      `enriched shape mismatch for #${pokemon.Number}`,
    );
  }

  const labelSources = [
    ...enrichedList.flatMap((pokemon) => [
      ...(pokemon.ConnectionTags ?? []).map((tag) => tag.label),
      ...(pokemon.ClueTags ?? []).map((tag) => tag.label),
    ]),
    ...summaryList.map((entry) => entry.label),
  ];

  for (const label of labelSources) {
    assert(
      !forbiddenVisibleLabelFragments.some((fragment) => label.includes(fragment)),
      `visible label needs correction: ${label}`,
    );
  }

  for (const pokemon of enrichedList) {
    assert(!containsUndefinedDeep(pokemon), `enriched entry contains undefined values for #${pokemon.Number}`);
  }

  console.log('[validate] JSON validation passed.');
}

function containsUndefinedDeep(value) {
  if (value === undefined) {
    return true;
  }

  if (Array.isArray(value)) {
    return value.some((entry) => containsUndefinedDeep(entry));
  }

  if (value && typeof value === 'object') {
    return Object.values(value).some((entry) => containsUndefinedDeep(entry));
  }

  return false;
}

async function writeJson(filePath, value) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

async function mapWithConcurrency(items, limit, worker) {
  const results = new Array(items.length);
  let index = 0;

  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (true) {
        const current = index;
        index += 1;
        if (current >= items.length) {
          return;
        }

        results[current] = await worker(items[current], current);
      }
    }),
  );

  return results;
}
