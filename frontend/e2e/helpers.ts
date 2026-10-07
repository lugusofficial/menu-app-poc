import type { Page } from '@playwright/test'

export const TABLE_PATH = 't/cantina-do-porto/12'

/** Opens a table the way a QR code does, as a diner with this name. */
export async function joinTable(page: Page, name: string, tablePath = TABLE_PATH) {
  await page.goto(tablePath)
  const nameField = page.getByLabel('Como podemos te chamar?')
  const continueButton = page.getByRole('button', { name: `Continuar como ${name}` })

  if (await continueButton.isVisible().catch(() => false)) {
    await continueButton.click()
  } else {
    await nameField.fill(name)
    await page.getByRole('button', { name: 'Entrar na mesa' }).click()
  }
  await page.getByRole('heading', { name: 'Cardápio', level: 1 }).waitFor()
}

/** Adds a dish to the order from the menu page. */
export async function addDish(page: Page, dish: string, quantity = 1) {
  await page.getByRole('button', { name: new RegExp(dish) }).first().click()
  const sheet = page.getByRole('dialog')
  for (let i = 1; i < quantity; i += 1) {
    await sheet.getByRole('button', { name: 'Aumentar quantidade' }).click()
  }
  await sheet.getByRole('button', { name: /Adicionar/ }).click()
  await sheet.waitFor({ state: 'detached' })
}

/**
 * Adds a dish, optionally on behalf of someone who is not holding the phone.
 * Pass null for "whoever is holding it".
 */
export async function addDishFor(page: Page, dish: string, forDiner: string | null) {
  await page.getByRole('button', { name: new RegExp(dish) }).first().click()
  const sheet = page.getByRole('dialog')
  if (forDiner) await sheet.getByRole('button', { name: forDiner }).click()
  await sheet.getByRole('button', { name: /Adicionar/ }).click()
  await sheet.waitFor({ state: 'detached' })
}

/** Switches the phone to another person at the same table. */
export async function switchTo(page: Page, name: string, tablePath = TABLE_PATH) {
  await page.goto(tablePath)
  const seated = page.getByRole('button', { name: new RegExp(`^${name}`) })
  if (await seated.isVisible().catch(() => false)) {
    await seated.click()
  } else {
    await page.getByRole('button', { name: 'Sou outra pessoa' }).click()
    await page.getByLabel('Como podemos te chamar?').fill(name)
    await page.getByRole('button', { name: 'Entrar na mesa' }).click()
  }
  await page.getByRole('heading', { name: 'Cardápio', level: 1 }).waitFor()
}

export function tabLink(page: Page, name: 'Cardápio' | 'Pedido' | 'Conta') {
  return page.getByRole('link', { name: new RegExp(name) })
}
