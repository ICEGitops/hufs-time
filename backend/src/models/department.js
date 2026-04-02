import { getAll } from '../config/database.js'

export async function findAll(campus) {
  if (campus) {
    return getAll(
      'SELECT id, name, college, campus, created_at FROM departments WHERE campus = $1 ORDER BY name',
      [campus]
    )
  }
  return getAll(
    'SELECT id, name, college, campus, created_at FROM departments ORDER BY name'
  )
}
