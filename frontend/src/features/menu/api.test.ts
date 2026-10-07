import { describe, it, expect } from 'vitest'
import { itemsOfCategory, menuApi, NotFoundError, searchItems } from './api'
import { MOCK_MENU } from './mockData'
import { PHOTO_CREDITS } from './photoCredits'

describe('menuApi.getMenu', () => {
  it('returns the menu of a known venue', async () => {
    const menu = await menuApi.getMenu('cantina-do-porto')
    expect(menu.venue.name).toBe('Cantina do Porto')
    expect(menu.items.length).toBeGreaterThan(0)
  })

  it('rejects with NotFoundError for an unknown venue', async () => {
    await expect(menuApi.getMenu('nao-existe')).rejects.toBeInstanceOf(NotFoundError)
  })
})

describe('menuApi.getTable', () => {
  it('returns a known table', async () => {
    await expect(menuApi.getTable('cantina-do-porto', '12')).resolves.toMatchObject({
      tableId: '12',
      label: 'Mesa 12',
    })
  })

  it('rejects with NotFoundError for an unknown table', async () => {
    await expect(menuApi.getTable('cantina-do-porto', '999')).rejects.toBeInstanceOf(NotFoundError)
  })
})

describe('dish photos', () => {
  it('gives every item on the menu a photo', () => {
    const missing = MOCK_MENU.items.filter((item) => !item.image)
    expect(missing).toEqual([])
  })

  it('names the photo after the item, so the file is findable', () => {
    for (const item of MOCK_MENU.items) {
      expect(item.image).toBe(item.itemId)
    }
  })

  it('credits every photo it ships', () => {
    const credited = new Set(PHOTO_CREDITS.map((c) => c.itemId))
    const uncredited = MOCK_MENU.items.filter((item) => !credited.has(item.itemId))
    expect(uncredited).toEqual([])
  })

  it('names a licence and a source for every credit', () => {
    for (const credit of PHOTO_CREDITS) {
      expect(credit.license).not.toBe('')
      expect(credit.source).toMatch(/^https:\/\//)
    }
  })
})

describe('itemsOfCategory', () => {
  it('keeps only the items of that category', () => {
    const drinks = itemsOfCategory(MOCK_MENU.items, 'bebidas')
    expect(drinks.length).toBeGreaterThan(0)
    expect(drinks.every((item) => item.categoryId === 'bebidas')).toBe(true)
  })

  it('pushes unavailable items to the end', () => {
    const starters = itemsOfCategory(MOCK_MENU.items, 'entradas')
    const firstUnavailable = starters.findIndex((item) => !item.available)
    expect(firstUnavailable).toBe(starters.length - 1)
  })

  it('returns an empty list for an unknown category', () => {
    expect(itemsOfCategory(MOCK_MENU.items, 'nada')).toEqual([])
  })
})

describe('searchItems', () => {
  it('returns everything for an empty query', () => {
    expect(searchItems(MOCK_MENU.items, '  ')).toHaveLength(MOCK_MENU.items.length)
  })

  it('ignores accents and case', () => {
    const found = searchItems(MOCK_MENU.items, 'RAGU')
    expect(found.map((item) => item.itemId)).toContain('rague-costela')
  })

  it('also matches the description', () => {
    const found = searchItems(MOCK_MENU.items, 'chimichurri')
    expect(found.map((item) => item.itemId)).toEqual(['ancho'])
  })

  it('returns nothing when there is no match', () => {
    expect(searchItems(MOCK_MENU.items, 'sushi')).toEqual([])
  })
})
