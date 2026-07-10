export const pickRandomItem = <T>(items: T[]): T | undefined => {
  if (items.length === 0) return undefined;
  const index = Math.floor(Math.random() * items.length);
  return items[index];
};

export const pickRandomItemExcluding = <T>(
  items: T[],
  exclude: (item: T) => boolean,
): T | undefined => {
  const filtered = items.filter((item) => !exclude(item));
  return pickRandomItem(filtered.length > 0 ? filtered : items);
};

export const getOfficialArtworkUrl = (number: number): string =>
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${number}.png`;

export const shuffleArray = <T>(items: T[]): T[] => {
  const array = [...items];
  for (let index = array.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [array[index], array[randomIndex]] = [array[randomIndex], array[index]];
  }

  return array;
};

export const sampleUnique = <T>(
  items: T[],
  count: number,
  exclude?: (item: T) => boolean,
): T[] => {
  const pool = exclude ? items.filter((item) => !exclude(item)) : [...items];
  const result: T[] = [];

  while (result.length < count && pool.length > 0) {
    const index = Math.floor(Math.random() * pool.length);
    const picked = pool.splice(index, 1)[0];
    if (picked) {
      result.push(picked);
    }
  }

  return result;
};

export const uniqueBy = <T, K>(items: T[], getKey: (item: T) => K): T[] => {
  const seen = new Set<K>();
  const result: T[] = [];

  for (const item of items) {
    const key = getKey(item);
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(item);
  }

  return result;
};

export const buildUniqueOptions = <T>(
  correctItem: T,
  items: T[],
  getKey: (item: T) => number,
  optionCount = 4,
): T[] => {
  const correctKey = getKey(correctItem);
  const distractors = shuffleArray(
    uniqueBy(
      items.filter((item) => getKey(item) !== correctKey),
      getKey,
    ),
  ).slice(0, Math.max(0, optionCount - 1));

  const options = shuffleArray(uniqueBy([correctItem, ...distractors], getKey));

  if (options.length !== optionCount) {
    return [];
  }

  return options;
};
