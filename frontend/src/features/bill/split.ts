import { allocateProportionally, divideCents, percentOfCents } from '../../shared/lib/money'
import type { Diner, OrderLine, SplitMode, TableSession } from '../session/types'

export type DinerShare = {
  dinerId: string
  name: string
  colorIndex: number
  /** What this person owes before the service fee. */
  subtotalCents: number
  serviceFeeCents: number
  totalCents: number
  /** Lines this person is paying for. */
  lineIds: string[]
}

export type SplitResult = {
  shares: DinerShare[]
  /** The bill itself, the same whichever mode is picked. */
  billSubtotalCents: number
  billServiceFeeCents: number
  billTotalCents: number
  /** Food nobody claimed, in the byItem mode. Zero means the bill is covered. */
  unassignedCents: number
  /**
   * Bill total minus what the shares add up to: how much the table is still
   * short (positive) or has over-assigned (negative). Always zero in `equal`
   * mode; the other two modes let the table leave a gap on purpose, and this
   * is what the page warns about.
   */
  differenceCents: number
}

export function lineTotalCents(line: OrderLine): number {
  return line.unitPriceCents * line.quantity
}

/** The bill counts what is in the cart as well as what already went to the kitchen. */
export function subtotalOf(lines: OrderLine[]): number {
  return lines.reduce((sum, line) => sum + lineTotalCents(line), 0)
}

/**
 * Turns a table session into what each person owes.
 *
 * Every amount is an integer number of cents and no mode ever loses or invents
 * one: a share that cannot divide evenly is settled with the largest remainder,
 * and anything left over is reported in `differenceCents` instead of being
 * quietly absorbed.
 */
export function computeSplit(
  session: TableSession,
  serviceFeeRate: number,
  mode: SplitMode,
): SplitResult {
  const billSubtotalCents = subtotalOf(session.lines)
  const billServiceFeeCents = session.serviceFeeIncluded
    ? percentOfCents(billSubtotalCents, serviceFeeRate)
    : 0
  const billTotalCents = billSubtotalCents + billServiceFeeCents

  const bill = { billSubtotalCents, billServiceFeeCents, billTotalCents }

  if (session.diners.length === 0) {
    return { ...bill, shares: [], unassignedCents: 0, differenceCents: billTotalCents }
  }

  const { shares, unassignedCents } = shareOut(session, serviceFeeRate, billSubtotalCents, mode)
  const assigned = shares.reduce((sum, share) => sum + share.totalCents, 0)

  return { ...bill, shares, unassignedCents, differenceCents: billTotalCents - assigned }
}

function shareOut(
  session: TableSession,
  serviceFeeRate: number,
  billSubtotalCents: number,
  mode: SplitMode,
): { shares: DinerShare[]; unassignedCents: number } {
  switch (mode) {
    case 'equal':
      return {
        shares: splitEqually(session.diners, billSubtotalCents, serviceFeeRate, session.serviceFeeIncluded),
        unassignedCents: 0,
      }
    case 'byItem':
      return splitByItem(session, serviceFeeRate)
    case 'custom':
      return { shares: splitCustom(session.diners, session.customAmounts), unassignedCents: 0 }
  }
}

function splitEqually(
  diners: Diner[],
  subtotalCents: number,
  serviceFeeRate: number,
  serviceFeeIncluded: boolean,
): DinerShare[] {
  const subtotals = divideCents(subtotalCents, diners.length)
  const fees = serviceFeeIncluded
    ? divideCents(percentOfCents(subtotalCents, serviceFeeRate), diners.length)
    : diners.map(() => 0)

  return diners.map((diner, i) => ({
    ...identity(diner),
    subtotalCents: subtotals[i],
    serviceFeeCents: fees[i],
    totalCents: subtotals[i] + fees[i],
    lineIds: [],
  }))
}

function splitByItem(
  session: TableSession,
  serviceFeeRate: number,
): { shares: DinerShare[]; unassignedCents: number } {
  const { diners, lines, assignments, serviceFeeIncluded } = session
  const dinerIds = new Set(diners.map((d) => d.dinerId))
  const subtotalByDiner = new Map(diners.map((d) => [d.dinerId, 0]))
  const linesByDiner = new Map(diners.map((d) => [d.dinerId, [] as string[]]))
  let unassignedCents = 0

  for (const line of lines) {
    // A diner can be dropped from the table while an old assignment still names
    // them, so only people actually at the table count.
    const sharedBy = (assignments[line.lineId] ?? []).filter((id) => dinerIds.has(id))
    const total = lineTotalCents(line)
    if (sharedBy.length === 0) {
      unassignedCents += total
      continue
    }
    // A shared starter divides to the cent; the leftover goes to the first
    // diners on the line, which is stable because the list order is stable.
    const slices = divideCents(total, sharedBy.length)
    sharedBy.forEach((dinerId, i) => {
      subtotalByDiner.set(dinerId, (subtotalByDiner.get(dinerId) ?? 0) + slices[i])
      linesByDiner.get(dinerId)?.push(line.lineId)
    })
  }

  const subtotals = diners.map((diner) => subtotalByDiner.get(diner.dinerId) ?? 0)
  // The service fee follows the food: it is charged on the claimed subtotal
  // only, and spread so the parts add back up to that fee exactly. Food nobody
  // claimed carries no fee here — it shows up as the table's shortfall.
  const claimedSubtotal = subtotals.reduce((sum, value) => sum + value, 0)
  const feeToSpread = serviceFeeIncluded ? percentOfCents(claimedSubtotal, serviceFeeRate) : 0
  const fees = allocateProportionally(feeToSpread, subtotals)

  return {
    unassignedCents,
    shares: diners.map((diner, i) => ({
      ...identity(diner),
      subtotalCents: subtotals[i],
      serviceFeeCents: fees[i],
      totalCents: subtotals[i] + fees[i],
      lineIds: linesByDiner.get(diner.dinerId) ?? [],
    })),
  }
}

function splitCustom(diners: Diner[], customAmounts: Record<string, number>): DinerShare[] {
  return diners.map((diner) => {
    const totalCents = Math.max(0, Math.round(customAmounts[diner.dinerId] ?? 0))
    return {
      ...identity(diner),
      // A typed amount is the whole share, service fee included: splitting it
      // back out would be inventing a number the diner never said.
      subtotalCents: totalCents,
      serviceFeeCents: 0,
      totalCents,
      lineIds: [],
    }
  })
}

function identity(diner: Diner): Pick<DinerShare, 'dinerId' | 'name' | 'colorIndex'> {
  return { dinerId: diner.dinerId, name: diner.name, colorIndex: diner.colorIndex }
}

/** An even amount per person, used by the "divide o que falta" button. */
export function suggestCustomAmounts(
  diners: Diner[],
  billTotalCents: number,
): Record<string, number> {
  const slices = divideCents(billTotalCents, diners.length)
  return Object.fromEntries(diners.map((diner, i) => [diner.dinerId, slices[i]]))
}
