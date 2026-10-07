import type { MenuItem } from '../menu/types'
import { emptySession } from './storage'
import type { Diner, OrderLine, TableSession } from './types'

// The reducer is pure: ids and timestamps always arrive in the action, so tests
// can fix them and two phones at the same table stay comparable.
export type SessionAction =
  | { type: 'joinDiner'; dinerId: string; name: string; joinedAt: string }
  | { type: 'addDiner'; dinerId: string; name: string; joinedAt: string }
  | { type: 'removeDiner'; dinerId: string }
  | { type: 'switchDiner'; dinerId: string }
  | {
      type: 'addLine'
      lineId: string
      item: MenuItem
      quantity: number
      notes: string
      dinerId: string
    }
  | { type: 'setQuantity'; lineId: string; quantity: number }
  | { type: 'removeLine'; lineId: string }
  | { type: 'restoreLine'; line: OrderLine; sharedBy: string[] }
  | { type: 'placeOrder'; placedAt: string }
  | { type: 'toggleAssignment'; lineId: string; dinerId: string }
  | { type: 'setCustomAmount'; dinerId: string; cents: number }
  | { type: 'toggleServiceFee' }
  | { type: 'togglePaid'; dinerId: string }
  | { type: 'syncFromTable'; session: TableSession }
  | { type: 'reset' }

export function sessionReducer(state: TableSession, action: SessionAction): TableSession {
  switch (action.type) {
    // Joining is this phone saying who is holding it. Adding is that person
    // putting someone else at the table, which must not change who they are:
    // one phone often orders for a whole table.
    case 'joinDiner':
      return seat(state, action, true)

    case 'addDiner':
      return seat(state, action, false)

    case 'removeDiner': {
      if (!canRemoveDiner(state, action.dinerId)) return state
      const assignments = Object.fromEntries(
        Object.entries(state.assignments).map(([lineId, ids]) => [
          lineId,
          ids.filter((id) => id !== action.dinerId),
        ]),
      )
      const customAmounts = { ...state.customAmounts }
      delete customAmounts[action.dinerId]
      return {
        ...state,
        diners: state.diners.filter((d) => d.dinerId !== action.dinerId),
        assignments,
        customAmounts,
        paidDinerIds: state.paidDinerIds.filter((id) => id !== action.dinerId),
      }
    }

    case 'switchDiner': {
      if (!state.diners.some((d) => d.dinerId === action.dinerId)) return state
      return { ...state, currentDinerId: action.dinerId }
    }

    case 'addLine': {
      if (action.quantity <= 0 || !action.item.available) return state
      const notes = action.notes.trim()
      // Same item, same note, same person and still in the cart: bump the
      // quantity instead of opening a second line.
      const mergeable = state.lines.find(
        (line) =>
          line.status === 'cart' &&
          line.itemId === action.item.itemId &&
          line.notes === notes &&
          line.addedByDinerId === action.dinerId,
      )
      if (mergeable) {
        return {
          ...state,
          lines: state.lines.map((line) =>
            line.lineId === mergeable.lineId
              ? { ...line, quantity: line.quantity + action.quantity }
              : line,
          ),
        }
      }
      const line: OrderLine = {
        lineId: action.lineId,
        itemId: action.item.itemId,
        name: action.item.name,
        emoji: action.item.emoji,
        image: action.item.image,
        unitPriceCents: action.item.priceCents,
        quantity: action.quantity,
        notes,
        addedByDinerId: action.dinerId,
        status: 'cart',
        placedAt: null,
      }
      return {
        ...state,
        lines: [...state.lines, line],
        // Whoever ordered it pays for it by default; the bill page can change that.
        assignments: { ...state.assignments, [line.lineId]: [action.dinerId] },
      }
    }

    case 'setQuantity': {
      if (action.quantity <= 0) return sessionReducer(state, { type: 'removeLine', lineId: action.lineId })
      return {
        ...state,
        lines: state.lines.map((line) =>
          line.lineId === action.lineId ? { ...line, quantity: action.quantity } : line,
        ),
      }
    }

    case 'removeLine': {
      const assignments = { ...state.assignments }
      delete assignments[action.lineId]
      return {
        ...state,
        lines: state.lines.filter((line) => line.lineId !== action.lineId),
        assignments,
      }
    }

    case 'restoreLine': {
      // Undo of a removal: the line goes back where it was, with the people who
      // were sharing it, so undoing is a true reversal and not a re-add.
      if (state.lines.some((line) => line.lineId === action.line.lineId)) return state
      return {
        ...state,
        lines: [...state.lines, action.line],
        assignments: { ...state.assignments, [action.line.lineId]: action.sharedBy },
      }
    }

    case 'placeOrder': {
      if (!state.lines.some((line) => line.status === 'cart')) return state
      return {
        ...state,
        lines: state.lines.map((line) =>
          line.status === 'cart'
            ? { ...line, status: 'placed' as const, placedAt: action.placedAt }
            : line,
        ),
      }
    }

    case 'toggleAssignment': {
      const current = state.assignments[action.lineId] ?? []
      const next = current.includes(action.dinerId)
        ? current.filter((id) => id !== action.dinerId)
        : [...current, action.dinerId]
      return { ...state, assignments: { ...state.assignments, [action.lineId]: next } }
    }

    case 'setCustomAmount': {
      const cents = Math.max(0, Math.round(action.cents))
      return { ...state, customAmounts: { ...state.customAmounts, [action.dinerId]: cents } }
    }

    case 'toggleServiceFee':
      return { ...state, serviceFeeIncluded: !state.serviceFeeIncluded }

    case 'togglePaid': {
      const paid = state.paidDinerIds.includes(action.dinerId)
        ? state.paidDinerIds.filter((id) => id !== action.dinerId)
        : [...state.paidDinerIds, action.dinerId]
      return { ...state, paidDinerIds: paid }
    }

    case 'syncFromTable': {
      // Another phone at the same table sent its view of the order. The table
      // is shared, but who is holding this phone is not.
      const stillSeated = action.session.diners.some((d) => d.dinerId === state.currentDinerId)
      return {
        ...action.session,
        currentDinerId: stillSeated ? state.currentDinerId : action.session.currentDinerId,
      }
    }

    case 'reset':
      return emptySession(state.venueSlug, state.tableId)
  }
}

function seat(
  state: TableSession,
  action: { dinerId: string; name: string; joinedAt: string },
  becomeCurrent: boolean,
): TableSession {
  const name = action.name.trim()
  if (name === '') return state

  // Someone already at the table under that name is that same person, not a
  // second one: two "Ana" rows would make the bill meaningless.
  const existing = state.diners.find((d) => sameName(d.name, name))
  if (existing) {
    return becomeCurrent ? { ...state, currentDinerId: existing.dinerId } : state
  }

  const diner: Diner = {
    dinerId: action.dinerId,
    name,
    colorIndex: nextColorIndex(state),
    joinedAt: action.joinedAt,
  }
  return {
    ...state,
    diners: [...state.diners, diner],
    currentDinerId: becomeCurrent ? diner.dinerId : state.currentDinerId,
  }
}

/** The lowest colour nobody is using, so a removal frees its colour again. */
function nextColorIndex(state: TableSession): number {
  const taken = new Set(state.diners.map((d) => d.colorIndex))
  let index = 0
  while (taken.has(index)) index += 1
  return index
}

/**
 * Whether a diner can be taken off the table. Someone who ordered cannot: their
 * items would be left with nobody to pay for them. Nor can the person holding
 * the phone remove themselves.
 */
export function canRemoveDiner(state: TableSession, dinerId: string): boolean {
  if (state.currentDinerId === dinerId) return false
  return !state.lines.some((line) => line.addedByDinerId === dinerId)
}

function sameName(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase()
}
