import path from 'node:path'
import { test, expect } from '@playwright/test'

const hasAuthEnv =
  !!(process.env.PLAYWRIGHT_TEST_EMAIL ?? process.env.E2E_EMAIL) &&
  !!(process.env.PLAYWRIGHT_TEST_PASSWORD ?? process.env.E2E_PASSWORD)

test.describe('authenticated api smoke', () => {
  test.use({ storageState: hasAuthEnv ? 'playwright/.auth/user.json' : undefined })

  test('protected APIs respond with authenticated session', async ({ page }) => {
    test.skip(
      !hasAuthEnv,
      'Set PLAYWRIGHT_TEST_EMAIL and PLAYWRIGHT_TEST_PASSWORD to run authenticated API smoke tests.'
    )

    // Ensure auth cookies are loaded in this browser context before API calls.
    await page.goto('/', { waitUntil: 'domcontentloaded' })

    const kra = await page.request.post('/api/kra/verify', {
      data: { pin: 'P051234567X' },
    })
    expect(kra.status()).toBe(200)
    const kraJson = await kra.json()
    expect(kraJson).toHaveProperty('valid')

    const chat = await page.request.post('/api/chat', {
      data: { messages: [{ role: 'user', content: 'List key employer obligations under Section 41.' }] },
    })
    expect(chat.status()).toBe(200)
    const chatJson = await chat.json()
    expect(typeof chatJson.message).toBe('string')

    const review = await page.request.post('/api/review-contract', {
      data: {
        employeeName: 'Jane Doe',
        jobTitle: 'Operations Associate',
        grossSalary: 32000,
        location: 'nairobi',
        contractText:
          'Employee shall work full-time, receive monthly salary, and be subject to all lawful deductions.',
      },
    })
    expect([200, 500, 503]).toContain(review.status())
    const reviewJson = await review.json()
    if (review.status() === 200) {
      expect(reviewJson).toHaveProperty('success', true)
    } else {
      expect(reviewJson).toHaveProperty('error')
    }

    const sms = await page.request.post('/api/reminders/sms', {
      data: {
        phoneNumber: '254700000000',
        message: 'ComplyKe test reminder.',
        type: 'smoke_test',
      },
    })
    expect(sms.status()).toBe(200)
    const smsJson = await sms.json()
    expect(smsJson).toHaveProperty('success', true)

    const mpesa = await page.request.post('/api/mpesa/payment', {
      data: {
        phoneNumber: '254712345678',
        amount: 1,
        plan: 'smoke-test',
      },
    })
    expect([200, 400]).toContain(mpesa.status())

    const scan = await page.request.post('/api/scan-receipt', {
      multipart: {
        image: {
          name: 'logo.svg',
          mimeType: 'image/svg+xml',
          buffer: await (await import('node:fs/promises')).readFile(path.join(process.cwd(), 'public', 'logo.svg')),
        },
      },
    })
    expect([200, 400, 500]).toContain(scan.status())
  })
})
