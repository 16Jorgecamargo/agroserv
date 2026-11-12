const DATABASE_NAME = 'agroserv_mock_files'
const STORE_NAME = 'files'
export const MOCK_FILE_PREFIX = 'mockfile:'

const memoryStore = new Map<string, string>()
let databasePromise: Promise<IDBDatabase | null> | null = null

function openDatabase(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === 'undefined') return Promise.resolve(null)
  if (databasePromise) return databasePromise

  databasePromise = new Promise((resolve) => {
    try {
      const request = indexedDB.open(DATABASE_NAME, 1)
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains(STORE_NAME)) request.result.createObjectStore(STORE_NAME)
      }
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => resolve(null)
      request.onblocked = () => resolve(null)
    } catch {
      resolve(null)
    }
  })

  return databasePromise
}

function runTransaction<T>(database: IDBDatabase, mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>): Promise<T | undefined> {
  return new Promise((resolve) => {
    try {
      const transaction = database.transaction(STORE_NAME, mode)
      const request = action(transaction.objectStore(STORE_NAME))
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => resolve(undefined)
    } catch {
      resolve(undefined)
    }
  })
}

export function isMockFileUrl(url: string | undefined): url is string {
  return Boolean(url?.startsWith(MOCK_FILE_PREFIX))
}

export function getMockFileId(url: string): string {
  return url.slice(MOCK_FILE_PREFIX.length)
}

export async function saveMockFile(id: string, dataUrl: string): Promise<void> {
  memoryStore.set(id, dataUrl)
  const database = await openDatabase()
  if (database) await runTransaction(database, 'readwrite', (store) => store.put(dataUrl, id))
}

export async function readMockFile(id: string): Promise<string | undefined> {
  const cached = memoryStore.get(id)
  if (cached) return cached

  const database = await openDatabase()
  if (!database) return undefined

  const stored = await runTransaction<string>(database, 'readonly', (store) => store.get(id) as IDBRequest<string>)
  if (typeof stored === 'string') memoryStore.set(id, stored)
  return typeof stored === 'string' ? stored : undefined
}

export async function clearMockFiles(): Promise<void> {
  memoryStore.clear()
  const database = await openDatabase()
  if (database) await runTransaction(database, 'readwrite', (store) => store.clear())
}
