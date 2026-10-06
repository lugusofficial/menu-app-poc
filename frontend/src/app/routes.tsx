import { Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom'
import type { ReactElement } from 'react'
import { useTableSession } from '../features/session/TableSessionContext'
import { HomePage } from '../features/home/pages/HomePage'
import { JoinTablePage } from '../features/session/pages/JoinTablePage'
import { MenuPage } from '../features/menu/pages/MenuPage'
import { OrderPage } from '../features/order/pages/OrderPage'
import { BillPage } from '../features/bill/pages/BillPage'
import { NotFoundPage } from '../features/home/pages/NotFoundPage'
import { TableLayout } from './TableLayout'

/**
 * Nobody can order or see the bill before saying who they are: the whole app
 * attributes items to a person, so an anonymous diner has nothing to show.
 */
function RequireDiner({ children }: { children: ReactElement }) {
  const { currentDiner } = useTableSession()
  const { venueSlug = '', tableId = '' } = useParams()
  const location = useLocation()

  if (!currentDiner) {
    return (
      <Navigate
        to={`/t/${encodeURIComponent(venueSlug)}/${encodeURIComponent(tableId)}`}
        replace
        state={{ from: location.pathname }}
      />
    )
  }
  return children
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/t/:venueSlug/:tableId" element={<TableLayout />}>
        <Route index element={<JoinTablePage />} />
        <Route
          path="menu"
          element={
            <RequireDiner>
              <MenuPage />
            </RequireDiner>
          }
        />
        <Route
          path="order"
          element={
            <RequireDiner>
              <OrderPage />
            </RequireDiner>
          }
        />
        <Route
          path="bill"
          element={
            <RequireDiner>
              <BillPage />
            </RequireDiner>
          }
        />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
