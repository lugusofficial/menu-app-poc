export type MenuTag = 'popular' | 'vegetarian' | 'spicy' | 'glutenFree' | 'new'

export type MenuItem = {
  itemId: string
  categoryId: string
  name: string
  description: string
  priceCents: number
  emoji: string
  tags: MenuTag[]
  available: boolean
}

export type MenuCategory = {
  categoryId: string
  name: string
  emoji: string
}

export type Table = {
  tableId: string
  label: string
  seats: number
}

export type Venue = {
  venueSlug: string
  name: string
  tagline: string
  emoji: string
  /** Brazilian "taxa de serviço", charged on the subtotal and optional by law. */
  serviceFeeRate: number
  currency: string
  locale: string
  tables: Table[]
}

export type MenuResponse = {
  venue: Venue
  categories: MenuCategory[]
  items: MenuItem[]
}
