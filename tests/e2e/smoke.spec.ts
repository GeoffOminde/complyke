import { test, expect } from '@playwright/test'

test('landing page loads and sign-in switches to login', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' })

  await expect(page.getByText('ComplyKe', { exact: true }).first()).toBeVisible()
  await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible()

  await page.getByRole('button', { name: 'Sign In' }).click()

  await expect(page.getByText('Welcome Back')).toBeVisible()
  await expect(page.getByLabel('Email Address')).toBeVisible()
  await expect(page.getByLabel('Password')).toBeVisible()
})

const hasAuthEnv =
  !!(process.env.PLAYWRIGHT_TEST_EMAIL ?? process.env.E2E_EMAIL) &&
  !!(process.env.PLAYWRIGHT_TEST_PASSWORD ?? process.env.E2E_PASSWORD)

test.describe('authenticated flows', () => {
  test.use({ storageState: hasAuthEnv ? 'playwright/.auth/user.json' : undefined })

  test('authenticated flows', async ({ page }) => {
    test.skip(
      !hasAuthEnv,
      'Set PLAYWRIGHT_TEST_EMAIL and PLAYWRIGHT_TEST_PASSWORD to run authenticated e2e flows.'
    )

    const openModuleOrExpectTierRestricted = async (
      navButtonName: string,
      successCheck: () => Promise<void>
    ) => {
      await page.getByRole('button', { name: navButtonName }).click()

      try {
        await successCheck()
      } catch {
        await expect(page.getByText('Tier Restricted')).toBeVisible({ timeout: 10_000 })
        const dismiss = page.getByRole('button', { name: /Dismiss|Go Back|Confirm|Stay Here/ }).first()
        if (await dismiss.isVisible().catch(() => false)) {
          await dismiss.click()
        }
      }
    }

    await page.goto('/', { waitUntil: 'domcontentloaded' })

    await expect(
      page.getByRole('heading').filter({ hasText: /Risk Dashboard|Institutional Command/ }).first()
    ).toBeVisible()
    await expect(page.getByText('Compliance Health Score')).toBeVisible()

    await openModuleOrExpectTierRestricted('Contract Generator', async () => {
      await expect(page.getByText('Contract Engine')).toBeVisible({ timeout: 10_000 })
    })

    await openModuleOrExpectTierRestricted('Payroll Calc', async () => {
      await expect(page.getByText('Payroll Tax Engine')).toBeVisible({ timeout: 10_000 })
    })

    await openModuleOrExpectTierRestricted('Privacy Policy', async () => {
      await expect(
        page.getByText('Institutional Privacy Policy Generator aligned with ODPC (Kenya) guidelines.')
      ).toBeVisible({ timeout: 10_000 })
    })

    await openModuleOrExpectTierRestricted('Tax Lens', async () => {
      await expect(page.getByText('Submit Institutional Receipt')).toBeVisible({ timeout: 10_000 })
    })

    await page.getByRole('button', { name: 'Dashboard' }).click()
    await expect(page.getByText('Statutory PIN Audit')).toBeVisible()
    await page.getByPlaceholder('P051234567X').fill('ABC123')
    await page.getByRole('button', { name: 'Audit PIN' }).click()
    await expect(page.getByText(/Validation Failed|Handshake Unverified|Statutory Verified/)).toBeVisible()

    await page.getByRole('button', { name: 'Open Wakili AI Chat' }).click()
    await expect(page.getByRole('heading', { name: 'Wakili AI' })).toBeVisible()
  })
})
