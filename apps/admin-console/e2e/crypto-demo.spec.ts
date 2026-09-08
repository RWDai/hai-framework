import { expect, test } from '@playwright/test'
import { registerAndLogin, waitForHydration } from './helpers'

test('crypto demo computes SM3 and verifies SM4 round trips', async ({ page, request }) => {
  await registerAndLogin(page, request, 'crypto')
  await page.goto('/admin/modules')
  await waitForHydration(page)
  await page.getByRole('tab', { name: /Crypto|加密/i }).click()
  const input = page.locator('#crypto-plain')
  await input.fill('abc')
  const hashButton = page.getByRole('button', { name: /Compute Hash|计算哈希/ })
  await hashButton.click()
  await expect(page.getByTestId('crypto-hash')).toHaveText('66c7f0f462eeedd9d1f2d46bdc10e4e24167c4875cf2f7a2297da02b8f4ba8e0')
  await hashButton.click()
  await expect(page.getByTestId('crypto-hash')).toHaveText('66c7f0f462eeedd9d1f2d46bdc10e4e24167c4875cf2f7a2297da02b8f4ba8e0')
  await input.fill('中文😀')
  await expect(page.getByTestId('crypto-hash')).toHaveCount(0)
  const encryptButton = page.getByRole('button', { name: /Symmetric Encrypt|对称加密/ })
  await encryptButton.click()
  await expect(page.getByTestId('crypto-decrypted')).toHaveText('中文😀')
  const first = await page.getByTestId('crypto-cipher').textContent() ?? ''
  expect(JSON.parse(first)).toMatchObject({ mode: 'cbc', encoding: 'hex' })
  await encryptButton.click()
  await expect(page.getByTestId('crypto-cipher')).not.toHaveText(first)
  await expect(page.getByTestId('crypto-decrypted')).toHaveText('中文😀')
  await input.fill('')
  await expect(page.getByTestId('crypto-cipher')).toHaveCount(0)
})
