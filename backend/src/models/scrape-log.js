import { getDatabase } from '../config/database.js'

export function findRecent(limit = 5) {
  const db = getDatabase()
  return db.prepare(
    'SELECT * FROM scrape_logs ORDER BY id DESC LIMIT ?'
  ).all(limit)
}

export function insertLog(status = 'running') {
  const db = getDatabase()
  const result = db.prepare(
    'INSERT INTO scrape_logs (status) VALUES (?)'
  ).run(status)
  return result.lastInsertRowid
}

export function updateLog(id, { status, totalCount, errorMessage }) {
  const db = getDatabase()
  db.prepare(
    'UPDATE scrape_logs SET status = ?, completed_at = CURRENT_TIMESTAMP, total_count = ?, error_message = ? WHERE id = ?'
  ).run(status, totalCount || 0, errorMessage || null, id)
}
