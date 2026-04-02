import { getAll, run } from '../config/database.js'

export async function findRecent(limit = 5) {
  return getAll(
    'SELECT * FROM scrape_logs ORDER BY id DESC LIMIT $1',
    [limit]
  )
}

export async function insertLog(status = 'running') {
  const result = await run(
    'INSERT INTO scrape_logs (status) VALUES ($1) RETURNING id',
    [status]
  )
  return result.rows[0].id
}

export async function updateLog(id, { status, totalCount, errorMessage }) {
  await run(
    'UPDATE scrape_logs SET status = $1, completed_at = CURRENT_TIMESTAMP, total_count = $2, error_message = $3 WHERE id = $4',
    [status, totalCount || 0, errorMessage || null, id]
  )
}
