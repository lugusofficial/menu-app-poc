import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, beforeEach } from 'vitest'
import i18n from '../shared/i18n'
import { emptySession, saveSession } from '../features/session/storage'
import { App } from './App'

function renderApp(route: string) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <App />
    </MemoryRouter>,
  )
}

describe('App routing', () => {
  beforeEach(async () => {
    window.localStorage.clear()
    await i18n.changeLanguage('en')
  })

  it('opens on the home page', () => {
    renderApp('/')
    expect(
      screen.getByRole('heading', { name: 'Order and split the bill from your phone' }),
    ).toBeInTheDocument()
  })

  it('opens a scanned table on the join screen', async () => {
    renderApp('/t/cantina-do-porto/12')
    expect(await screen.findByRole('heading', { name: /Welcome to Cantina do Porto/ })).toBeInTheDocument()
    expect(screen.getByText(/You are at Mesa 12/)).toBeInTheDocument()
  })

  it('tells the diner when the QR code points at no table', async () => {
    renderApp('/t/cantina-do-porto/999')
    expect(await screen.findByRole('heading', { name: 'Table not found' })).toBeInTheDocument()
  })

  it('sends an anonymous diner from the menu back to the join screen', async () => {
    renderApp('/t/cantina-do-porto/12/menu')
    expect(await screen.findByLabelText('What should we call you?')).toBeInTheDocument()
  })

  it('shows the menu to a diner who has joined, with the table tabs', async () => {
    const session = emptySession('cantina-do-porto', '12')
    session.diners = [{ dinerId: 'd1', name: 'Ana', colorIndex: 0, joinedAt: '2026-10-06T20:00:00.000Z' }]
    session.currentDinerId = 'd1'
    saveSession(session)

    renderApp('/t/cantina-do-porto/12/menu')

    expect(await screen.findByRole('heading', { name: 'Menu', level: 1 })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Bill/ })).toBeInTheDocument()
    // Alone at the table, the header prompts instead of counting: one phone
    // ordering for a group is the common case.
    expect(screen.getByText('Add whoever is with you')).toBeInTheDocument()
  })

  it('walks from the menu to the order and on to the bill', async () => {
    const session = emptySession('cantina-do-porto', '12')
    session.diners = [{ dinerId: 'd1', name: 'Ana', colorIndex: 0, joinedAt: '2026-10-06T20:00:00.000Z' }]
    session.currentDinerId = 'd1'
    saveSession(session)

    renderApp('/t/cantina-do-porto/12/menu')
    await screen.findByRole('heading', { name: 'Menu', level: 1 })

    await userEvent.click(screen.getByRole('link', { name: /Order/ }))
    expect(await screen.findByRole('heading', { name: 'Table order' })).toBeInTheDocument()

    await userEvent.click(screen.getByRole('link', { name: /Bill/ }))
    expect(await screen.findByRole('heading', { name: 'Split the bill' })).toBeInTheDocument()
  })

  it('shows the not found page for an unknown address', () => {
    renderApp('/nao-existe')
    expect(screen.getByRole('heading', { name: 'Page not found' })).toBeInTheDocument()
  })
})
