import { describe, it, expect, vi } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useAsync } from './useAsync'

describe('useAsync', () => {
  it('starts loading and then exposes the data', async () => {
    const fn = vi.fn().mockResolvedValue(['a'])
    const { result } = renderHook(() => useAsync(fn))

    expect(result.current.loading).toBe(true)
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.data).toEqual(['a'])
    expect(result.current.error).toBeNull()
  })

  it('exposes the error when the function rejects', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('boom'))
    const { result } = renderHook(() => useAsync(fn))

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toBeInstanceOf(Error)
    expect(result.current.data).toBeNull()
  })

  it('runs the function again on reload', async () => {
    const fn = vi.fn().mockResolvedValueOnce(['first']).mockResolvedValueOnce(['second'])
    const { result } = renderHook(() => useAsync(fn))

    await waitFor(() => expect(result.current.data).toEqual(['first']))
    act(() => result.current.reload())
    await waitFor(() => expect(result.current.data).toEqual(['second']))
  })
})
