import { prisma } from '../config/db.js'

let ensured = false

const ensureTable = async (): Promise<void> => {
  if (ensured) return
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS telegram_kv (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `)
  ensured = true
}

export const kvGet = async (key: string): Promise<string | null> => {
  await ensureTable()
  const rows: any[] = await prisma.$queryRawUnsafe(
    `SELECT value FROM telegram_kv WHERE key = $1`,
    key,
  )
  return rows.length ? rows[0].value : null
}

export const kvSet = async (key: string, value: string): Promise<void> => {
  await ensureTable()
  await prisma.$executeRawUnsafe(
    `INSERT INTO telegram_kv (key, value) VALUES ($1, $2)
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
    key,
    value,
  )
}

export const kvDel = async (key: string): Promise<void> => {
  await ensureTable()
  await prisma.$executeRawUnsafe(`DELETE FROM telegram_kv WHERE key = $1`, key)
}
