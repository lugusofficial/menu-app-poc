export type Diner = {
  dinerId: string
  name: string
  /** Index into the avatar palette, so each person keeps one colour. */
  colorIndex: number
  joinedAt: string
}

/** A line of the table order. One line per item plus note combination. */
export type OrderLine = {
  lineId: string
  itemId: string
  name: string
  emoji: string
  unitPriceCents: number
  quantity: number
  notes: string
  addedByDinerId: string
  status: 'cart' | 'placed'
  placedAt: string | null
}

export type SplitMode = 'equal' | 'byItem' | 'custom'

export type TableSession = {
  venueSlug: string
  tableId: string
  openedAt: string
  diners: Diner[]
  /** Who is holding this phone. Null until someone joins. */
  currentDinerId: string | null
  lines: OrderLine[]
  /** lineId -> diners sharing that line, used by the byItem split. */
  assignments: Record<string, string[]>
  splitMode: SplitMode
  /** dinerId -> cents typed by hand, used by the custom split. */
  customAmounts: Record<string, number>
  /** Whether the optional 10% service fee is on the bill. */
  serviceFeeIncluded: boolean
  /** Diners who already settled their share, for the demo payment flow. */
  paidDinerIds: string[]
}
