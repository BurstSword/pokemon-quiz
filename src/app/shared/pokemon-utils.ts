export const pickRandomItem = <T>(items: T[]): T | undefined => {
  if (items.length === 0) return undefined;
  const idx = Math.floor(Math.random() * items.length);
  return items.splice(idx, 1)[0];
};

export const shuffleArray = <T>(items: T[]): T[] => {
  const array = [...items];
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
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
    const idx = Math.floor(Math.random() * pool.length);
    result.push(pool.splice(idx, 1)[0]);
  }

  return result;
};
