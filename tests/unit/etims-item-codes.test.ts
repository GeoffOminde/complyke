import { describe, expect, it, vi } from 'vitest'

describe('resolveItemCode', () => {
  it('returns trimmed input when no map is configured', async () => {
    vi.resetModules()
    delete process.env.ETIMS_ITEM_CODE_MAP
    const { resolveItemCode } = await import('../../lib/etims/item-codes')
    expect(resolveItemCode(' iv-001 ')).toBe('iv-001')
  })

  it('uses ETIMS_ITEM_CODE_MAP to rewrite codes', async () => {
    vi.resetModules()
    process.env.ETIMS_ITEM_CODE_MAP = JSON.stringify({ 'iv-001': 'HS-0302' })
    const { resolveItemCode } = await import('../../lib/etims/item-codes')
    expect(resolveItemCode('iv-001')).toBe('HS-0302')
  })

  it('throws when itemCd is missing', async () => {
    vi.resetModules()
    delete process.env.ETIMS_ITEM_CODE_MAP
    const { resolveItemCode } = await import('../../lib/etims/item-codes')
    expect(() => resolveItemCode('')).toThrow('Each item entry must include a non-empty itemCd.')
  })
})
