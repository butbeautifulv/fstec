type SubdivisionRef = { name: string } | null | undefined

export function summarizeOrderSubdivisions(
  items: { subdivision: SubdivisionRef }[]
): string | null {
  const names = [
    ...new Set(
      items
        .map((item) => item.subdivision?.name)
        .filter((name): name is string => Boolean(name))
    ),
  ].sort((a, b) => a.localeCompare(b, "ru"))

  if (names.length === 0) return null
  return names.join(", ")
}
