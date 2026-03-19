import { openDB } from 'idb'

const DB_NAME = 'submerged-offline'
const STORE_NAME = 'pending_completions'
const DB_VERSION = 2

export interface PendingCompletion {
  id?: number
  plan_id: string
  day_id: string
  day_index?: number
  completed_at: number
  created_at: number
}

async function getDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
      if (oldVersion < 2) {
        db.deleteObjectStore(STORE_NAME)
      }
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true })
      }
    },
  })
}

export async function queueCompletion(
  planId: string,
  dayId: string,
  dayIndex?: number
): Promise<void> {
  const db = await getDB()
  const now = Date.now()
  const item: PendingCompletion = {
    plan_id: planId,
    day_id: dayId,
    completed_at: now,
    created_at: now,
  }
  if (typeof dayIndex === 'number') item.day_index = dayIndex
  await db.add(STORE_NAME, item)
}

export async function flushQueue(): Promise<{ synced: number; failed: number }> {
  const db = await getDB()
  const items = (await db.getAll(STORE_NAME)) as PendingCompletion[]
  let synced = 0
  let failed = 0

  for (const item of items) {
    try {
      const body: Record<string, string | number> = {
        plan_id: item.plan_id,
        day_id: item.day_id,
      }
      if (typeof item.day_index === 'number') body.day_index = item.day_index
      const res = await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        credentials: 'include',
      })
      if (res.ok) {
        await db.delete(STORE_NAME, item.id!)
        synced++
      } else {
        failed++
      }
    } catch {
      failed++
    }
  }

  return { synced, failed }
}

export async function getPendingCount(): Promise<number> {
  const db = await getDB()
  return db.count(STORE_NAME)
}

export async function clearByPlanId(planId: string): Promise<number> {
  const db = await getDB()
  const items = (await db.getAll(STORE_NAME)) as PendingCompletion[]
  const toDelete = items.filter((i) => i.plan_id === planId)
  for (const item of toDelete) {
    if (item.id != null) await db.delete(STORE_NAME, item.id)
  }
  return toDelete.length
}
