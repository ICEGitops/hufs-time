import pg from 'pg'
import { readFileSync } from 'fs'
import path from 'path'

const { Pool } = pg

let pool

export function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000
    })
  }
  return pool
}

export async function query(sql, params = []) {
  return getPool().query(sql, params)
}

export async function getAll(sql, params = []) {
  const result = await query(sql, params)
  return result.rows
}

export async function getOne(sql, params = []) {
  const result = await query(sql, params)
  return result.rows[0] || null
}

export async function run(sql, params = []) {
  const result = await query(sql, params)
  return { rowCount: result.rowCount, rows: result.rows }
}

export async function withTransaction(fn) {
  const client = await getPool().connect()
  try {
    await client.query('BEGIN')
    const result = await fn(client)
    await client.query('COMMIT')
    return result
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

export async function initDatabase() {
  const p = getPool()
  const schema = readFileSync(
    path.join(process.cwd(), 'src', 'db', 'schema.sql'),
    'utf-8'
  )
  await p.query(schema)
  console.log('Database initialized')
}

export async function closePool() {
  if (pool) {
    await pool.end()
    pool = null
  }
}
