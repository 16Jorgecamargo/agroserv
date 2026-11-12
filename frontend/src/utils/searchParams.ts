export function toSearchString(values: Record<string, string | undefined>): string {
  const params = new URLSearchParams()
  Object.entries(values).forEach(([key, value]) => {
    const trimmed = value?.trim()
    if (trimmed) params.set(key, trimmed)
  })
  const query = params.toString()
  return query ? `?${query}` : ''
}
