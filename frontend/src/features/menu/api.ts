import { MOCK_MENU } from './mockData'
import type { MenuItem, MenuResponse, Table } from './types'

// The POC has no backend yet. Every call is async with a small delay on
// purpose, so pages are written against the loading and error states they will
// face once this file calls `http<T>()` instead of reading the mock.
const LATENCY_MS = 180

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), LATENCY_MS))
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'NotFoundError'
  }
}

export const menuApi = {
  getMenu: (venueSlug: string): Promise<MenuResponse> => {
    if (venueSlug !== MOCK_MENU.venue.venueSlug) {
      return Promise.reject(new NotFoundError(`Unknown venue "${venueSlug}"`))
    }
    return delay(MOCK_MENU)
  },

  getTable: (venueSlug: string, tableId: string): Promise<Table> => {
    if (venueSlug !== MOCK_MENU.venue.venueSlug) {
      return Promise.reject(new NotFoundError(`Unknown venue "${venueSlug}"`))
    }
    const table = MOCK_MENU.venue.tables.find((t) => t.tableId === tableId)
    if (!table) return Promise.reject(new NotFoundError(`Unknown table "${tableId}"`))
    return delay(table)
  },
}

/** Items of a category, in menu order, unavailable ones last. */
export function itemsOfCategory(items: MenuItem[], categoryId: string): MenuItem[] {
  return items
    .filter((item) => item.categoryId === categoryId)
    .sort((a, b) => Number(b.available) - Number(a.available))
}

/** Case and accent insensitive search over the item name and description. */
export function searchItems(items: MenuItem[], query: string): MenuItem[] {
  const needle = normalize(query)
  if (needle === '') return items
  return items.filter(
    (item) => normalize(item.name).includes(needle) || normalize(item.description).includes(needle),
  )
}

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
}
