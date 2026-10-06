import { render } from '@testing-library/react'
import type { ReactElement } from 'react'
import { MemoryRouter, Outlet, Route, Routes } from 'react-router-dom'
import type { TableContext } from '../app/tableContext'
import { MOCK_MENU } from '../features/menu/mockData'
import { TableSessionProvider } from '../features/session/TableSessionContext'
import { emptySession, saveSession } from '../features/session/storage'
import type { TableSession } from '../features/session/types'
import { ToastProvider } from '../shared/components/Toast'

export const TEST_VENUE = MOCK_MENU.venue.venueSlug
export const TEST_TABLE = '12'

export function tableContext(): TableContext {
  return {
    menu: MOCK_MENU,
    table: MOCK_MENU.venue.tables.find((t) => t.tableId === TEST_TABLE)!,
  }
}

/** Puts a table state in storage so the page renders with it already loaded. */
export function seedSession(overrides: Partial<TableSession> = {}): TableSession {
  const session = { ...emptySession(TEST_VENUE, TEST_TABLE), ...overrides }
  saveSession(session)
  return session
}

function TableOutlet({ context }: { context: TableContext }) {
  return <Outlet context={context} />
}

/**
 * Renders a page the way the app does: inside a router, a toast provider and a
 * table session, under an outlet that carries the table context. Pages are then
 * tested through what a diner sees rather than through mocked internals.
 */
export function renderInTable(
  element: ReactElement,
  { route = '/', context = tableContext() }: { route?: string; context?: TableContext } = {},
) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <ToastProvider>
        <TableSessionProvider venueSlug={TEST_VENUE} tableId={TEST_TABLE}>
          <Routes>
            <Route element={<TableOutlet context={context} />}>
              <Route path="*" element={element} />
            </Route>
          </Routes>
        </TableSessionProvider>
      </ToastProvider>
    </MemoryRouter>,
  )
}
