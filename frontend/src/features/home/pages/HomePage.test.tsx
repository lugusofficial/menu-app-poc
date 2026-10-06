import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, beforeEach } from 'vitest'
import i18n from '../../../shared/i18n'
import { HomePage } from './HomePage'

function renderHome() {
  return render(
    <MemoryRouter>
      <HomePage />
    </MemoryRouter>,
  )
}

describe('HomePage', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en')
  })

  it('explains what the app does', () => {
    renderHome()
    expect(
      screen.getByRole('heading', { name: 'Order and split the bill from your phone' }),
    ).toBeInTheDocument()
  })

  it('lists the demo tables once the menu has loaded', async () => {
    renderHome()
    expect(await screen.findByRole('link', { name: /Mesa 12/ })).toHaveAttribute(
      'href',
      '/t/cantina-do-porto/12',
    )
  })

  it('shows how many seats a table has', async () => {
    renderHome()
    expect(await screen.findByText('6 seats')).toBeInTheDocument()
    expect(screen.getByText('2 seats')).toBeInTheDocument()
  })

  it('draws a QR code for each table', async () => {
    renderHome()
    expect(await screen.findByRole('img', { name: 'QR code for Mesa 12' })).toBeInTheDocument()
  })

  it('switches the whole page to Portuguese', async () => {
    await i18n.changeLanguage('pt')
    renderHome()
    expect(
      screen.getByRole('heading', { name: 'Peça e divida a conta pelo celular' }),
    ).toBeInTheDocument()
    expect(await screen.findByText('6 lugares')).toBeInTheDocument()
  })
})
