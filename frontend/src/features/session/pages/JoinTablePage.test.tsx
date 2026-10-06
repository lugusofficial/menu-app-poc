import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, beforeEach } from 'vitest'
import i18n from '../../../shared/i18n'
import { renderInTable, seedSession } from '../../../test/renderTable'
import { JoinTablePage } from './JoinTablePage'

const AT = '2026-10-06T20:00:00.000Z'
const ana = { dinerId: 'd1', name: 'Ana', colorIndex: 0, joinedAt: AT }
const bruno = { dinerId: 'd2', name: 'Bruno', colorIndex: 1, joinedAt: AT }

describe('JoinTablePage', () => {
  beforeEach(async () => {
    window.localStorage.clear()
    await i18n.changeLanguage('en')
  })

  it('welcomes the diner with the venue and the table', () => {
    renderInTable(<JoinTablePage />)
    expect(screen.getByRole('heading', { name: /Welcome to Cantina do Porto/ })).toBeInTheDocument()
    expect(screen.getByText(/You are at Mesa 12/)).toBeInTheDocument()
  })

  it('asks for a name when nobody is holding the phone yet', () => {
    renderInTable(<JoinTablePage />)
    expect(screen.getByLabelText('What should we call you?')).toBeInTheDocument()
  })

  it('refuses an empty name and explains why', async () => {
    renderInTable(<JoinTablePage />)
    await userEvent.click(screen.getByRole('button', { name: 'Join the table' }))

    const error = await screen.findByText(/Enter a name/)
    expect(error).toBeInTheDocument()
    expect(screen.getByLabelText('What should we call you?')).toHaveAttribute('aria-invalid', 'true')
  })

  it('joins the table with the typed name', async () => {
    renderInTable(<JoinTablePage />)
    await userEvent.type(screen.getByLabelText('What should we call you?'), 'Ana')
    await userEvent.click(screen.getByRole('button', { name: 'Join the table' }))

    const stored = JSON.parse(window.localStorage.getItem('mesa.session.cantina-do-porto.12') ?? '{}')
    expect(stored.diners).toHaveLength(1)
    expect(stored.diners[0].name).toBe('Ana')
    expect(stored.currentDinerId).toBe(stored.diners[0].dinerId)
  })

  it('offers to continue as the person who was already on this phone', () => {
    seedSession({ diners: [ana], currentDinerId: 'd1' })
    renderInTable(<JoinTablePage />)
    expect(screen.getByRole('button', { name: 'Continue as Ana' })).toBeInTheDocument()
  })

  it('shows the name field again after choosing to be someone else', async () => {
    seedSession({ diners: [ana], currentDinerId: 'd1' })
    renderInTable(<JoinTablePage />)
    await userEvent.click(screen.getByRole('button', { name: 'I am someone else' }))
    expect(screen.getByLabelText('What should we call you?')).toBeInTheDocument()
  })

  it('lists everyone already at the table', () => {
    seedSession({ diners: [ana, bruno], currentDinerId: 'd1' })
    renderInTable(<JoinTablePage />)
    const seated = screen.getByRole('heading', { name: 'Already at the table' }).parentElement
    expect(seated).toHaveTextContent('Ana')
    expect(seated).toHaveTextContent('Bruno')
  })

  it('reuses the existing diner when the typed name is already at the table', async () => {
    seedSession({ diners: [ana], currentDinerId: null })
    renderInTable(<JoinTablePage />)
    await userEvent.type(screen.getByLabelText('What should we call you?'), 'ana')
    await userEvent.click(screen.getByRole('button', { name: 'Join the table' }))

    const stored = JSON.parse(window.localStorage.getItem('mesa.session.cantina-do-porto.12') ?? '{}')
    expect(stored.diners).toHaveLength(1)
    expect(stored.currentDinerId).toBe('d1')
  })
})
