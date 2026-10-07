import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { addDish, joinTable, switchTo, tabLink } from './helpers'

// Intl puts a non breaking space after "R$", so a regex matching a formatted
// amount uses \s, never a plain space. String matchers normalise it already.

/** Two people at the same table, each with their own dish. */
async function tableForTwo(page: Page) {
  await joinTable(page, 'Ana')
  await addDish(page, 'Bife ancho 300g')

  await switchTo(page, 'Bruno')
  await addDish(page, 'Risoto de cogumelos')

  await tabLink(page, 'Conta').click()
  await expect(page.getByRole('heading', { name: 'Dividir a conta' })).toBeVisible()
}

/** The card of one diner in the "who pays what" list. */
function shareOf(page: Page, name: string) {
  return page.getByRole('list', { name: 'Quem paga o quê' }).getByRole('listitem').filter({ hasText: name })
}

function itemRow(page: Page, dish: string) {
  return page.getByRole('list', { name: 'Itens da conta' }).getByRole('listitem').filter({ hasText: dish })
}

test.describe('splitting the bill', () => {
  test('splits the bill evenly between the table', async ({ page }) => {
    await tableForTwo(page)

    // 129,00 + 86,00 = 215,00 plus 10% = 236,50, half each.
    await expect(page.getByLabel('Resumo da conta')).toContainText('R$ 236,50')
    await expect(shareOf(page, 'Ana')).toContainText('R$ 118,25')
    await expect(shareOf(page, 'Bruno')).toContainText('R$ 118,25')
    await expect(page.getByText('A conta fecha certinho')).toBeVisible()
  })

  test('drops the service fee when the table declines it', async ({ page }) => {
    await tableForTwo(page)
    await page.getByLabel('Incluir taxa de serviço de 10%').uncheck()

    await expect(page.getByLabel('Resumo da conta')).toContainText('R$ 215,00')
    await expect(shareOf(page, 'Ana')).toContainText('R$ 107,50')
  })

  test('charges each person for what they ordered', async ({ page }) => {
    await tableForTwo(page)
    await page.getByRole('tab', { name: 'Por item' }).click()

    await expect(shareOf(page, 'Ana')).toContainText('R$ 141,90')
    await expect(shareOf(page, 'Bruno')).toContainText('R$ 94,60')
    await expect(shareOf(page, 'Ana')).toContainText('Bife ancho')
  })

  test('splits a shared dish between the two people who had it', async ({ page }) => {
    await tableForTwo(page)
    await page.getByRole('tab', { name: 'Por item' }).click()

    // Bruno helped with the steak: 129,00 splits in two.
    await itemRow(page, 'Bife ancho').getByRole('button', { name: 'Bruno' }).click()

    await expect(page.getByText('Dividido entre 2')).toBeVisible()
    await expect(shareOf(page, 'Ana')).toContainText('R$ 70,95')
    await expect(shareOf(page, 'Bruno')).toContainText('R$ 165,55')
  })

  test('warns while a dish has nobody on it and clears once it does', async ({ page }) => {
    await tableForTwo(page)
    await page.getByRole('tab', { name: 'Por item' }).click()

    await itemRow(page, 'Bife ancho').getByRole('button', { name: 'Ana' }).click()
    await expect(page.getByText(/R\$\s129,00 ainda não têm dono/)).toBeVisible()

    await itemRow(page, 'Bife ancho').getByRole('button', { name: 'Ana' }).click()
    await expect(page.getByText('A conta fecha certinho')).toBeVisible()
  })

  test('takes amounts the table types and reports the shortfall', async ({ page }) => {
    await tableForTwo(page)
    await page.getByRole('tab', { name: 'Valores livres' }).click()

    await page.getByLabel('Quanto Ana vai pagar').fill('100')
    await expect(page.getByText(/Faltam R\$\s136,50/)).toBeVisible()

    await page.getByLabel('Quanto Bruno vai pagar').fill('136,50')
    await expect(page.getByText('A conta fecha certinho')).toBeVisible()
  })

  test('warns when the table puts in more than the bill', async ({ page }) => {
    await tableForTwo(page)
    await page.getByRole('tab', { name: 'Valores livres' }).click()

    await page.getByLabel('Quanto Ana vai pagar').fill('200')
    await page.getByLabel('Quanto Bruno vai pagar').fill('200')
    await expect(page.getByText(/R\$\s163,50 a mais que o total/)).toBeVisible()
  })

  test('fills the free amounts evenly on request', async ({ page }) => {
    await tableForTwo(page)
    await page.getByRole('tab', { name: 'Valores livres' }).click()
    await page.getByRole('button', { name: 'Dividir o que falta por igual' }).click()

    await expect(page.getByLabel('Quanto Ana vai pagar')).toHaveValue('118,25')
    await expect(page.getByText('A conta fecha certinho')).toBeVisible()
  })

  test('marks a share as paid', async ({ page }) => {
    await tableForTwo(page)
    await shareOf(page, 'Ana').getByRole('button', { name: 'Marcar como pago' }).click()

    await expect(page.getByText('Ana marcado como pago')).toBeVisible()
    await expect(shareOf(page, 'Ana')).toContainText('Pago')
  })

  test('puts the chosen split in the URL, so it can be sent to someone', async ({ page }) => {
    await tableForTwo(page)
    await page.getByRole('tab', { name: 'Por item' }).click()
    await expect(page).toHaveURL(/[?&]split=byItem/)

    await page.getByRole('tab', { name: 'Por igual' }).click()
    await expect(page).not.toHaveURL(/split=/)
  })

  test('opens straight on the split named in a shared link', async ({ page }) => {
    await tableForTwo(page)
    await page.goto('t/cantina-do-porto/12/bill?split=byItem')

    await expect(page.getByRole('tab', { name: 'Por item' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    await expect(shareOf(page, 'Ana')).toContainText('R$ 141,90')
  })

  test('keeps the chosen split across a reload', async ({ page }) => {
    await tableForTwo(page)
    await page.getByRole('tab', { name: 'Por item' }).click()
    await page.reload()

    await expect(page.getByRole('tab', { name: 'Por item' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    await expect(shareOf(page, 'Ana')).toContainText('R$ 141,90')
  })
})
