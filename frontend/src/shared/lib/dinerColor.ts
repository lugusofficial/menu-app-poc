/** Six colours cycle, so a seventh diner reuses the first colour. */
export function dinerColor(colorIndex: number): string {
  return `var(--diner-${colorIndex % 6})`
}

export function initialsOf(name: string): string {
  const trimmed = name.trim()
  if (trimmed === '') return '?'
  return trimmed.slice(0, 1).toUpperCase()
}
