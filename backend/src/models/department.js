import { getDatabase } from '../config/database.js'

export function findAll(campus) {
  const db = getDatabase()
  if (campus) {
    return db.prepare(
      'SELECT id, name, college, campus, created_at FROM departments WHERE campus = ? ORDER BY name'
    ).all(campus)
  }
  return db.prepare(
    'SELECT id, name, college, campus, created_at FROM departments ORDER BY name'
  ).all()
}
