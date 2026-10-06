import { useOutletContext } from 'react-router-dom'
import type { MenuResponse, Table } from '../features/menu/types'

/** What `TableLayout` hands down to every page under a table route. */
export type TableContext = { menu: MenuResponse; table: Table }

export function useTableContext(): TableContext {
  return useOutletContext<TableContext>()
}
