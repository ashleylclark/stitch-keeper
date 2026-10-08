export function searchYarn(yarn, query) {
  const needle = query.toLowerCase();

  return yarn.filter((item) =>
    [item.name, item.brand, item.color, item.material, item.weight].some(
      (value) => value?.toLowerCase().includes(needle),
    ),
  );
}

export function searchPatterns(patterns, query) {
  const needle = query.toLowerCase();

  return patterns.filter((pattern) =>
    [
      pattern.name,
      pattern.category,
      pattern.difficulty,
      pattern.source,
      pattern.notes,
    ].some((value) => value?.toLowerCase().includes(needle)),
  );
}
