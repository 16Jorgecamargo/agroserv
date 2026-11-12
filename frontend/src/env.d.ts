interface ImportMetaEnv {
  readonly VITE_API_MODE?: 'mock' | 'http'
  readonly VITE_API_URL?: string
  readonly VITE_ROUTER?: 'browser' | 'hash'
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
