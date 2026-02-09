import { openDB, type DBSchema, type IDBPDatabase } from 'idb'

interface AudioDB extends DBSchema {
  audios: {
    key: string
    value: {
      id: string
      blob: Blob
      mimeType: string
      fileName: string
      createdAt: Date
    }
  }
}

const DB_NAME = 'transcrilab-audio'
const DB_VERSION = 1
const STORE_NAME = 'audios'

let dbPromise: Promise<IDBPDatabase<AudioDB>> | null = null

function getDB(): Promise<IDBPDatabase<AudioDB>> {
  if (!dbPromise) {
    dbPromise = openDB<AudioDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' })
        }
      },
    })
  }
  return dbPromise
}

export async function saveAudio(
  historyId: string,
  file: File
): Promise<void> {
  const db = await getDB()
  await db.put(STORE_NAME, {
    id: historyId,
    blob: file,
    mimeType: file.type,
    fileName: file.name,
    createdAt: new Date(),
  })
}

export async function getAudio(
  historyId: string
): Promise<{ blob: Blob; mimeType: string; fileName: string } | null> {
  const db = await getDB()
  const record = await db.get(STORE_NAME, historyId)
  if (!record) return null
  return {
    blob: record.blob,
    mimeType: record.mimeType,
    fileName: record.fileName,
  }
}

export async function deleteAudio(historyId: string): Promise<void> {
  const db = await getDB()
  await db.delete(STORE_NAME, historyId)
}

export async function hasAudio(historyId: string): Promise<boolean> {
  const db = await getDB()
  const record = await db.get(STORE_NAME, historyId)
  return !!record
}

export async function clearAllAudios(): Promise<void> {
  const db = await getDB()
  await db.clear(STORE_NAME)
}
