import '@testing-library/jest-dom/vitest'
import { cleanup, configure } from '@testing-library/react'
import { afterEach, beforeEach, vi } from 'vitest'
import { resetMockDatabase } from '../services/api/mockDatabase'

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

configure({ asyncUtilTimeout: 4000 })

vi.stubGlobal('IntersectionObserver', IntersectionObserverStub)
window.scrollTo = vi.fn() as unknown as typeof window.scrollTo

beforeEach(() => {
  resetMockDatabase()
})

afterEach(() => {
  cleanup()
  localStorage.clear()
})