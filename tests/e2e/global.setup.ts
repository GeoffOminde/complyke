import { chromium, type FullConfig } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'

const authFile = path.join(process.cwd(), 'playwright', '.auth', 'user.json')

function getAuthCredentials() {
  const email = process.env.PLAYWRIGHT_TEST_EMAIL ?? process.env.E2E_EMAIL
  const password = process.env.PLAYWRIGHT_TEST_PASSWORD ?? process.env.E2E_PASSWORD
  return { email, password }
}

async function globalSetup(config: FullConfig) {
  const { email, password } = getAuthCredentials()

  if (!email || !password) {
    console.warn(
      '[playwright] Skipping auth state setup. Set PLAYWRIGHT_TEST_EMAIL and PLAYWRIGHT_TEST_PASSWORD to enable authenticated e2e tests.'
    )
    return
  }

  const browser = await chromium.launch()
  const page = await browser.newPage()
  const baseURL = config.projects[0]?.use?.baseURL ?? 'http://localhost:3000'

  await mkdir(path.dirname(authFile), { recursive: true })

  await page.goto(String(baseURL), { waitUntil: 'domcontentloaded' })
  await page.getByRole('button', { name: 'Sign In' }).click()
  await page.getByLabel('Email Address').fill(email)
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: 'Sign In' }).click()

  const dashboardHeading = page
    .getByRole('heading')
    .filter({ hasText: /Risk Dashboard|Institutional Command/ })
    .first()
  await dashboardHeading.waitFor({ state: 'visible', timeout: 30_000 })

  await page.context().storageState({ path: authFile })
  await browser.close()
}

export default globalSetup
