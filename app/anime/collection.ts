export function sortAnimeByScore<T extends { score?: number }>(items: readonly T[]) {
  return items
    .map((item, index) => ({ item, index }))
    .sort((left, right) => {
      const scoreDifference = (right.item.score ?? -1) - (left.item.score ?? -1)
      return scoreDifference || left.index - right.index
    })
    .map(({ item }) => item)
}

export function groupAnimeByScore<T extends { score?: number }>(items: readonly T[]) {
  const groups = new Map<number | null, T[]>()

  for (const item of items) {
    const score = item.score ?? null
    const group = groups.get(score)
    if (group) group.push(item)
    else groups.set(score, [item])
  }

  return [...Array.from({ length: 10 }, (_, index) => 10 - index), null]
    .map((score) => ({ score, items: groups.get(score) ?? [] }))
    .filter((group) => group.items.length > 0)
}
