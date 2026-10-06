import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import styles from './Toast.module.css'

export type ToastTone = 'info' | 'success' | 'warning'

type ToastItem = {
  id: number
  message: string
  tone: ToastTone
  durationMs: number
}

type ToastContextValue = {
  show: (message: string, tone?: ToastTone, durationMs?: number) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const ICON: Record<ToastTone, string> = {
  info: 'i',
  success: '✓',
  warning: '!',
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastItem | null>(null)
  const timerRef = useRef<number | null>(null)
  const idRef = useRef(0)

  const clearTimer = () => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }

  const show = useCallback((message: string, tone: ToastTone = 'info', durationMs = 3200) => {
    clearTimer()
    idRef.current += 1
    setToast({ id: idRef.current, message, tone, durationMs })
  }, [])

  useEffect(() => {
    if (!toast) return
    clearTimer()
    timerRef.current = window.setTimeout(() => setToast(null), toast.durationMs)
    return () => clearTimer()
  }, [toast])

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {toast &&
        createPortal(
          <div className={styles.container} aria-live="polite" aria-atomic="true">
            <div key={toast.id} className={`${styles.toast} ${styles[toast.tone]}`} role="status">
              <span className={styles.icon} aria-hidden="true">
                {ICON[toast.tone]}
              </span>
              <p className={styles.message}>{toast.message}</p>
            </div>
          </div>,
          document.body,
        )}
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
