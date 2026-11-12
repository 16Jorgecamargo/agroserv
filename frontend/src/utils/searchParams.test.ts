import { describe, expect, it } from 'vitest'
import { toSearchString } from './searchParams'

describe('toSearchString', () => {
  it('returns empty string when every value is empty', () => {
    expect(toSearchString({ q: '', location: '   ', category: undefined })).toBe('')
  })

  it('trims values and encodes them', () => {
    expect(toSearchString({ q: ' soja milho ', location: '' })).toBe('?q=soja+milho')
    expect(toSearchString({ category: 'pulverizacao' })).toBe('?category=pulverizacao')
  })
})
