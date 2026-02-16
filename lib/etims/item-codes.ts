const defaultMap: Record<string, string> = {}

function parseMap(raw?: string): Record<string, string> {
  if (!raw) return defaultMap
  try {
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return Object.fromEntries(
        Object.entries(parsed).map(([key, value]) => [
          key.trim(),
          typeof value === 'string' ? value.trim() : String(value),
        ])
      )
    }
  } catch {
    console.warn('ETIMS_ITEM_CODE_MAP is not valid JSON; defaulting to identity mapping.')
  }
  return defaultMap
}

const map = parseMap(process.env.ETIMS_ITEM_CODE_MAP)

export function resolveItemCode(candidate: string): string {
  const trimmed = candidate.trim()
  if (!trimmed) {
    throw new Error('Each item entry must include a non-empty itemCd.')
  }
  return map[trimmed] || trimmed
}
