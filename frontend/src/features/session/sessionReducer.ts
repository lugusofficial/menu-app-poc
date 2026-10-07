import type { MenuItem } from '../menu/types'
import { emptySession } from './storage'
import type { Diner, OrderLine, TableSession } from './types'

// The reducer is pure: ids and timestamps always arrive in the action, so tests
// can fix them and two phones at the same table stay comparable.
export type SessionAction =
  | { type: 'joinDiner'; dinerId: string; name: string; joinedAt: string }
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
    case 'joinDiner': {
      const name = action.name.trim()
      if (name === '') return state
      const existing = state.diners.find((d) => sameName(d.name, name))
      if (existing) return { ...state, currentDinerId: existing.dinerId }
      const diner: Diner = {
        dinerId: action.dinerId,
        name,
        colorIndex: state.diners.length,
        joinedAt: action.joinedAt,
      }
      return { ...state, diners: [...state.diners, diner], currentDinerId: diner.dinerId }
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

function sameName(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase()
}
