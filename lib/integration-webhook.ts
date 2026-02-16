import crypto from 'node:crypto'

interface IntegrationWebhookPayload {
  event: string
  timestamp: string
  nonce: string
  data: Record<string, unknown>
}

function getWebhookConfig() {
  const url = (process.env.ERP_WEBHOOK_URL || '').trim()
  const secret = (process.env.ERP_WEBHOOK_SECRET || '').trim()
  return { url, secret }
}

function signPayload(secret: string, timestamp: string, nonce: string, body: string): string {
  return crypto.createHmac('sha256', secret).update(`${timestamp}.${nonce}.${body}`).digest('hex')
}

export async function sendIntegrationWebhook(
  event: string,
  data: Record<string, unknown>
): Promise<void> {
  const { url, secret } = getWebhookConfig()
  if (!url) return

  const timestamp = new Date().toISOString()
  const nonce = crypto.randomBytes(16).toString('hex')
  const payload: IntegrationWebhookPayload = { event, timestamp, nonce, data }
  const body = JSON.stringify(payload)

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-complyke-event': event,
    'x-complyke-timestamp': timestamp,
    'x-complyke-nonce': nonce,
  }

  if (secret) {
    headers['x-complyke-signature'] = signPayload(secret, timestamp, nonce, body)
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body,
    })
    if (!response.ok) {
      const text = await response.text()
      console.error(`Integration webhook failed (${response.status}):`, text)
    }
  } catch (error) {
    console.error('Integration webhook transport error:', error)
  }
}
