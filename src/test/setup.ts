import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

class IntersectionObserverStub {
  readonly root = null
  readonly rootMargin = ''
  readonly thresholds = []
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return []
  }
}

vi.stubGlobal('IntersectionObserver', IntersectionObserverStub)
window.scrollTo = vi.fn() as unknown as typeof window.scrollTo

afterEach(() => {
  cleanup()
  localStorage.clear()
})
