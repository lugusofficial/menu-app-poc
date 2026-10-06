import { useCallback, useEffect, useState } from 'react'

type AsyncState<T> = { data: T | null; loading: boolean; error: unknown }

/**
 * Runs an async function on mount (and whenever `fn` identity changes) and
 * tracks loading, error and data. Pass a stable function reference (an `api`
 * method, or one wrapped in `useCallback`) so it does not re-run every render.
 */
export function useAsync<T>(fn: () => Promise<T>): AsyncState<T> & { reload: () => void } {
  const [state, setState] = useState<AsyncState<T>>({ data: null, loading: true, error: null })
  const [nonce, setNonce] = useState(0)

  const reload = useCallback(() => setNonce((n) => n + 1), [])

  useEffect(() => {
    let active = true

    async function load() {
      try {
        const data = await fn()
        if (active) setState({ data, loading: false, error: null })
      } catch (error) {
        if (active) setState({ data: null, loading: false, error })
      }
    }

    void load()
    return () => {
      active = false
    }
  }, [fn, nonce])

  return { ...state, reload }
}
