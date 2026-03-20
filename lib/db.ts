import Database from 'better-sqlite3'
import { readFileSync } from 'fs'
import { join } from 'path'
import bcrypt from 'bcrypt'

const DB_PATH =
  process.env.FREEDIVING_DB_PATH || join(process.cwd(), 'data.db')

export const db = new Database(DB_PATH, { readonly: false })
db.pragma('journal_mode = DELETE')
db.pragma('temp_store = MEMORY')

if (process.env.NODE_ENV !== 'test') {
  console.log('Database:', DB_PATH)
}

export function runSchema() {
  const schemaPath = join(process.cwd(), 'lib', 'schema.sql')
  const schema = readFileSync(schemaPath, 'utf-8')
  db.exec(schema)
}

export function seedUsers() {
  const nicoPassword = process.env.USER_PASSWORD_NICO || 'password'
  const athenaPassword = process.env.USER_PASSWORD_ATHENA || 'password'

  const nicoHash = bcrypt.hashSync(nicoPassword, 10)
  const athenaHash = bcrypt.hashSync(athenaPassword, 10)

  const insert = db.prepare(`
    INSERT OR IGNORE INTO users (username, password_hash) VALUES (?, ?)
  `)
  insert.run('nico', nicoHash)
  insert.run('athena', athenaHash)
}

runSchema()
seedUsers()
