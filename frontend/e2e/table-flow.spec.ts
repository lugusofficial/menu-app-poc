import { expect, test } from '@playwright/test'
import { addDish, joinTable, tabLink, TABLE_PATH } from './helpers'

test.describe('scanning a table and ordering', () => {
  test('the home page offers a table to scan', async ({ page }) => {
    await page.goto('.')
    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      'Peça e divida a conta pelo celular',
    )
    await expect(page.getByRole('link', { name: /Mesa 12/ })).toBeVisible()
    await expect(page.getByRole('img', { name: 'QR code da Mesa 12' })).toBeVisible()
  })

  test('a QR link opens the table on the join screen', async ({ page }) => {
    await page.goto(TABLE_PATH)
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Cantina do Porto')
    await expect(page.getByText('Você está na Mesa 12')).toBeVisible()
  })

  test('a table that does not exist says so instead of breaking', async ({ page }) => {
    await page.goto('t/cantina-do-porto/999')
    await expect(page.getByRole('heading', { name: 'Mesa não encontrada' })).toBeVisible()
  })

  test('a diner joins, orders and sends the order to the kitchen', async ({ page }) => {
    await joinTable(page, 'Ana')

    await addDish(page, 'Bife ancho 300g')
    await addDish(page, 'Chopp pilsen 300ml', 2)

    const cartBar = page.getByRole('link', { name: /Ver pedido/ })
    await expect(cartBar).toContainText('3 itens')
    await cartBar.click()

    await expect(page.getByRole('heading', { name: 'Pedido da mesa' })).toBeVisible()
    await expect(page.getByText('Pedido por Ana').first()).toBeVisible()
    await expect(page.getByText('R$ 161,00')).toBeVisible()

    await page.getByRole('button', { name: 'Enviar para a cozinha' }).click()
    await expect(page.getByRole('heading', { name: 'Na cozinha' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Enviar para a cozinha' })).toHaveCount(0)
  })

  test('the menu search narrows the list', async ({ page }) => {
    await joinTable(page, 'Ana')
    await page.getByLabel('Buscar no cardápio').fill('ragu')
    await expect(page.getByText(/ragù de costela/)).toBeVisible()
    await expect(page.getByText('Cacio e pepe')).toHaveCount(0)
  })

  test('a sold out dish cannot be ordered', async ({ page }) => {
    await joinTable(page, 'Ana')
    const soldOut = page.getByRole('button', { name: /Carpaccio de filé/ })
    await expect(soldOut).toBeDisabled()
    await expect(soldOut).toContainText('Esgotado')
  })

  test('the order survives a reload, the way a phone locking does', async ({ page }) => {
    await joinTable(page, 'Ana')
    await addDish(page, 'Tiramisù')

    await page.reload()
    await tabLink(page, 'Pedido').click()
    await expect(page.getByText('Tiramisù')).toBeVisible()
  })

  test('removing an item can be undone from the toast', async ({ page }) => {
    await joinTable(page, 'Ana')
    await addDish(page, 'Tiramisù')
    await tabLink(page, 'Pedido').click()

    await page.getByRole('button', { name: 'Diminuir quantidade' }).click()
    await expect(page.getByText('Tiramisù saiu do pedido')).toBeVisible()

    await page.getByRole('button', { name: 'Desfazer' }).click()
    await expect(page.getByText('Tiramisù')).toBeVisible()
    await expect(page.getByText('R$ 32,00').first()).toBeVisible()
  })

  test('the menu search goes into the URL', async ({ page }) => {
    await joinTable(page, 'Ana')
    await page.getByLabel('Buscar no cardápio').fill('ragu')
    await expect(page).toHaveURL(/[?&]q=ragu/)
  })

  test('someone who has not joined is asked who they are first', async ({ page }) => {
    await page.goto(`${TABLE_PATH}/bill`)
    await expect(page.getByLabel('Como podemos te chamar?')).toBeVisible()
  })

  test('the app switches to English', async ({ page }) => {
    await page.goto('.')
    await page.getByRole('button', { name: 'EN' }).click()
    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      'Order and split the bill from your phone',
    )
  })
})
