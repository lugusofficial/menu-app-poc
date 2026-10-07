import { createContext, useCallback, useContext, useEffect, useMemo, useReducer } from 'react'
import type { ReactNode } from 'react'
import type { MenuItem } from '../menu/types'
import { sessionReducer } from './sessionReducer'
import type { SessionAction } from './sessionReducer'
import { loadSession, saveSession, sessionKey } from './storage'
import type { Diner, OrderLine, TableSession } from './types'

type TableSessionContextValue = {
  session: TableSession
  dispatch: (action: SessionAction) => void
  currentDiner: Diner | null
  cartLines: OrderLine[]
  placedLines: OrderLine[]
  cartQuantity: number
  joinTable: (name: string) => void
  addItem: (item: MenuItem, quantity: number, notes: string) => void
  placeOrder: () => void
}

const TableSessionContext = createContext<TableSessionContextValue | null>(null)

function newId(): string {
  // randomUUID needs a secure context; a QR demo over plain http still has to work.
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

export function TableSessionProvider({
  venueSlug,
  tableId,
  children,
}: {
  venueSlug: string
  tableId: string
  children: ReactNode
}) {
  const [session, dispatch] = useReducer(sessionReducer, { venueSlug, tableId }, (init) =>
    loadSession(init.venueSlug, init.tableId),
  )

  useEffect(() => {
    saveSession(session)
  }, [session])

  // A second tab is a second phone at the same table in the demo, so changes
  // made there show up here instead of the two drifting apart.
  useEffect(() => {
    const key = sessionKey(venueSlug, tableId)
    const onStorage = (event: StorageEvent) => {
      if (event.key !== key) return
      dispatch({ type: 'syncFromTable', session: loadSession(venueSlug, tableId) })
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [venueSlug, tableId])

  const currentDiner = useMemo(
    () => session.diners.find((d) => d.dinerId === session.currentDinerId) ?? null,
    [session.diners, session.currentDinerId],
  )

  const cartLines = useMemo(() => session.lines.filter((l) => l.status === 'cart'), [session.lines])
  const placedLines = useMemo(
    () => session.lines.filter((l) => l.status === 'placed'),
    [session.lines],
  )
  const cartQuantity = useMemo(
    () => cartLines.reduce((sum, line) => sum + line.quantity, 0),
    [cartLines],
  )

  const joinTable = useCallback((name: string) => {
    dispatch({ type: 'joinDiner', dinerId: newId(), name, joinedAt: new Date().toISOString() })
  }, [])

  const addItem = useCallback(
    (item: MenuItem, quantity: number, notes: string) => {
      if (!session.currentDinerId) return
      dispatch({
        type: 'addLine',
        lineId: newId(),
        item,
        quantity,
        notes,
        dinerId: session.currentDinerId,
      })
    },
    [session.currentDinerId],
  )

  const placeOrder = useCallback(() => {
    dispatch({ type: 'placeOrder', placedAt: new Date().toISOString() })
  }, [])

  const value = useMemo(
    () => ({
      session,
      dispatch,
      currentDiner,
      cartLines,
      placedLines,
      cartQuantity,
      joinTable,
      addItem,
      placeOrder,
    }),
    [
      session,
      currentDiner,
      cartLines,
      placedLines,
      cartQuantity,
      joinTable,
      addItem,
      placeOrder,
    ],
  )

  return <TableSessionContext.Provider value={value}>{children}</TableSessionContext.Provider>
}

export function useTableSession(): TableSessionContextValue {
  const ctx = useContext(TableSessionContext)
  if (!ctx) throw new Error('useTableSession must be used within TableSessionProvider')
  return ctx
}
