import { ToastProvider } from '../shared/components/Toast'
import { AppRoutes } from './routes'

export function App() {
  return (
    <ToastProvider>
      <AppRoutes />
    </ToastProvider>
  )
}
