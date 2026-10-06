import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { clearSession, emptySession, loadSession, saveSession, sessionKey } from './storage'

describe('sessionKey', () => {
  it('scopes the key to the venue and the table', () => {
    expect(sessionKey('cantina', '7')).toBe('mesa.session.cantina.7')
  })
})

describe('emptySession', () => {
  it('starts with nobody at the table and the service fee on', () => {
    const session = emptySession('cantina', '7', () => '2026-10-06T20:00:00.000Z')
    expect(session).toMatchObject({
      venueSlug: 'cantina',
      tableId: '7',
      openedAt: '2026-10-06T20:00:00.000Z',
      diners: [],
      lines: [],
      currentDinerId: null,
      splitMode: 'equal',
      serviceFeeIncluded: true,
    })
  })
})

describe('loadSession and saveSession', () => {
  beforeEach(() => window.localStorage.clear())
  afterEach(() => vi.restoreAllMocks())

  it('returns an empty session when nothing is stored', () => {
    expect(loadSession('cantina', '7').diners).toEqual([])
  })

  it('round trips a saved session', () => {
    const session = emptySession('cantina', '7')
    session.diners = [{ dinerId: 'd1', name: 'Ana', colorIndex: 0, joinedAt: '2026-10-06T20:00:00.000Z' }]
    saveSession(session)
    expect(loadSession('cantina', '7').diners).toHaveLength(1)
  })

  it('keeps sessions of different tables apart', () => {
    const session = emptySession('cantina', '7')
    session.diners = [{ dinerId: 'd1', name: 'Ana', colorIndex: 0, joinedAt: '2026-10-06T20:00:00.000Z' }]
    saveSession(session)
    expect(loadSession('cantina', '12').diners).toEqual([])
  })

  it('falls back to an empty session when the stored value is corrupt', () => {
    window.localStorage.setItem(sessionKey('cantina', '7'), '{not json')
    expect(loadSession('cantina', '7').diners).toEqual([])
  })

  it('falls back to an empty session when the stored shape is from an older build', () => {
    window.localStorage.setItem(sessionKey('cantina', '7'), JSON.stringify({ people: [] }))
    expect(loadSession('cantina', '7').lines).toEqual([])
  })

  it('fills in fields a stored session is missing', () => {
    window.localStorage.setItem(
      sessionKey('cantina', '7'),
      JSON.stringify({ diners: [], lines: [], splitMode: 'byItem' }),
    )
    const session = loadSession('cantina', '7')
    expect(session.splitMode).toBe('byItem')
    expect(session.assignments).toEqual({})
    expect(session.paidDinerIds).toEqual([])
  })

  it('does not throw when storage is blocked', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    expect(() => loadSession('cantina', '7')).not.toThrow()
    expect(() => saveSession(emptySession('cantina', '7'))).not.toThrow()
  })

  it('clears a stored session', () => {
    saveSession(emptySession('cantina', '7'))
    clearSession('cantina', '7')
    expect(window.localStorage.getItem(sessionKey('cantina', '7'))).toBeNull()
  })
})
