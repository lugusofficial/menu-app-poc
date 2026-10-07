import type { TableSession } from './types'

const PREFIX = 'mesa.session'

export function sessionKey(venueSlug: string, tableId: string): string {
  return `${PREFIX}.${venueSlug}.${tableId}`
}

export function emptySession(
  venueSlug: string,
  tableId: string,
  now = () => new Date().toISOString(),
): TableSession {
  return {
    venueSlug,
    tableId,
    openedAt: now(),
    diners: [],
    currentDinerId: null,
    lines: [],
    assignments: {},
    customAmounts: {},
    serviceFeeIncluded: true,
    paidDinerIds: [],
  }
}

/**
 * Reads the session of a table. Anything unreadable (private mode, a stale
 * shape from an older build) falls back to a fresh session instead of throwing:
 * a diner at a table must never see a crash because of old storage.
 */
export function loadSession(venueSlug: string, tableId: string): TableSession {
  try {
    const raw = window.localStorage.getItem(sessionKey(venueSlug, tableId))
    if (!raw) return emptySession(venueSlug, tableId)
    const parsed = JSON.parse(raw) as unknown
    if (!isSession(parsed)) return emptySession(venueSlug, tableId)
    return { ...emptySession(venueSlug, tableId), ...parsed, venueSlug, tableId }
  } catch {
    return emptySession(venueSlug, tableId)
  }
}

export function saveSession(session: TableSession): void {
  try {
    window.localStorage.setItem(
      sessionKey(session.venueSlug, session.tableId),
      JSON.stringify(session),
    )
  } catch {
    // Storage full or blocked: the session still works for this page view.
  }
}

export function clearSession(venueSlug: string, tableId: string): void {
  try {
    window.localStorage.removeItem(sessionKey(venueSlug, tableId))
  } catch {
    // Nothing to do, the caller already reset the in-memory state.
  }
}

function isSession(value: unknown): value is TableSession {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as Partial<TableSession>
  return Array.isArray(candidate.diners) && Array.isArray(candidate.lines)
}
