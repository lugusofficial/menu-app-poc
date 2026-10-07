import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import styles from './Toast.module.css'

export type ToastTone = 'info' | 'success' | 'warning'

export type ToastAction = { label: string; onAction: () => void }

type ToastItem = {
  id: number
  message: string
  tone: ToastTone
  durationMs: number
  action?: ToastAction
}

type ShowOptions = { tone?: ToastTone; durationMs?: number; action?: ToastAction }

type ToastContextValue = {
  show: (message: string, options?: ShowOptions) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

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

  const show = useCallback((message: string, options: ShowOptions = {}) => {
    const { tone = 'info', action } = options
    clearTimer()
    idRef.current += 1
    setToast({
      id: idRef.current,
      message,
      tone,
      // An undo offer has to outlive a glance, so it gets longer by default.
      durationMs: options.durationMs ?? (action ? 7000 : 3200),
      action,
    })
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
      {createPortal(
        // The live region is always mounted, so a screen reader announces each
        // message instead of only noticing the region appearing.
        <div className={styles.container} role="status" aria-live="polite" aria-atomic="true">
          {toast && (
            <div key={toast.id} className={`${styles.toast} ${styles[toast.tone]}`}>
              <span className={styles.bar} aria-hidden="true" />
              <p className={styles.message}>{toast.message}</p>
              {toast.action && (
                <button
                  type="button"
                  className={styles.action}
                  onClick={() => {
                    toast.action?.onAction()
                    setToast(null)
                  }}
                >
                  {toast.action.label}
                </button>
              )}
            </div>
          )}
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
