// Every amount in the app is an integer number of cents. Floats never hold a
// price, so a split can never leak or invent a cent.

export function formatCents(cents: number, locale = 'pt-BR', currency = 'BRL'): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(cents / 100)
}

/** Parses what a person types into a money field ("12,50", "12.5", "R$ 12") into cents. */
export function parseCents(input: string): number | null {
  const cleaned = input.replace(/[^\d,.-]/g, '').replace(',', '.')
  if (cleaned === '' || cleaned === '.' || cleaned === '-') return null
  const value = Number(cleaned)
  if (!Number.isFinite(value)) return null
  return Math.round(value * 100)
}

/**
 * Splits `total` cents into `parts` shares that add back up to `total` exactly.
 * The leftover cents go to the first shares, one each, so the result is stable
 * and never loses or creates money.
 */
export function divideCents(total: number, parts: number): number[] {
  if (parts <= 0) return []
  const sign = total < 0 ? -1 : 1
  const amount = Math.abs(total)
  const base = Math.floor(amount / parts)
  const remainder = amount - base * parts
  return Array.from({ length: parts }, (_, i) => sign * (base + (i < remainder ? 1 : 0)))
}

/** Percentage of an amount, rounded to the nearest cent (half up). */
export function percentOfCents(cents: number, rate: number): number {
  return Math.round(cents * rate)
}

/**
 * Spreads `total` cents across `weights` in proportion to them, using the
 * largest remainder method so the parts add back up to `total` exactly.
 * All weights zero (or no weights) gives everyone zero.
 */
export function allocateProportionally(total: number, weights: number[]): number[] {
  const totalWeight = weights.reduce((sum, w) => sum + w, 0)
  if (weights.length === 0) return []
  if (totalWeight <= 0 || total === 0) return weights.map(() => 0)

  const exact = weights.map((w) => (total * w) / totalWeight)
  const floors = exact.map((value) => Math.floor(value))
  let remaining = total - floors.reduce((sum, value) => sum + value, 0)

  // The cents left over go to the largest fractional parts first, ties to the
  // earlier diner, so the same bill always splits the same way.
  const order = exact
    .map((value, index) => ({ index, fraction: value - Math.floor(value) }))
    .sort((a, b) => b.fraction - a.fraction || a.index - b.index)

  const result = [...floors]
  for (const { index } of order) {
    if (remaining <= 0) break
    result[index] += 1
    remaining -= 1
  }
  return result
}
