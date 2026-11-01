export function fuzzyScore(name: string, query: string): number | null {
  const normalizedName = name.toLocaleLowerCase("ru-RU");
  const normalizedQuery = query.toLocaleLowerCase("ru-RU");
  const directMatch = normalizedName.indexOf(normalizedQuery);
  if (directMatch >= 0) return directMatch;

  let position = 0;
  let gaps = 0;
  for (const character of normalizedQuery) {
    const next = normalizedName.indexOf(character, position);
    if (next < 0) {
      position = -1;
      break;
    }
    gaps += next - position;
    position = next + 1;
  }
  if (position >= 0) return normalizedName.length + gaps;

  let bestDistance = Number.POSITIVE_INFINITY;
  for (const word of normalizedName.split(/\s+/)) {
    let previous = Array.from(
      { length: normalizedQuery.length + 1 },
      (_, index) => index,
    );
    for (let row = 1; row <= word.length; row++) {
      const current = [row];
      for (let column = 1; column <= normalizedQuery.length; column++) {
        current[column] = Math.min(
          current[column - 1] + 1,
          previous[column] + 1,
          previous[column - 1] +
            (word[row - 1] === normalizedQuery[column - 1] ? 0 : 1),
        );
      }
      previous = current;
    }
    bestDistance = Math.min(bestDistance, previous[normalizedQuery.length]);
  }

  const allowedDistance = Math.max(1, Math.floor(normalizedQuery.length / 4));
  return bestDistance <= allowedDistance
    ? normalizedName.length + bestDistance * 10
    : null;
}
