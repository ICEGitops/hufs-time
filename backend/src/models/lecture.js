import { getDatabase } from '../config/database.js'

// lecture_times를 lectures 배열에 매핑
function attachTimes(lectures) {
  if (lectures.length === 0) return lectures

  const db = getDatabase()
  const ids = lectures.map(l => l.id)
  const placeholders = ids.map(() => '?').join(',')
  const times = db.prepare(
    `SELECT id, lecture_id, day_of_week, start_time, end_time, room
     FROM lecture_times WHERE lecture_id IN (${placeholders})`
  ).all(...ids)

  const timeMap = {}
  for (const t of times) {
    if (!timeMap[t.lecture_id]) timeMap[t.lecture_id] = []
    timeMap[t.lecture_id].push({
      id: t.id,
      day_of_week: t.day_of_week,
      start_time: t.start_time,
      end_time: t.end_time,
      room: t.room
    })
  }

  return lectures.map(l => ({
    ...l,
    times: timeMap[l.id] || []
  }))
}

export function findAll(filters = {}) {
  const db = getDatabase()
  const { department, year, category, day, keyword, gubun, page = 1, limit = 50 } = filters

  const conditions = []
  const params = []

  if (department) {
    conditions.push('d.name = ?')
    params.push(department)
  }
  if (year) {
    conditions.push('l.year_level = ?')
    params.push(Number(year))
  }
  if (category) {
    conditions.push('l.category = ?')
    params.push(category)
  }
  if (day) {
    conditions.push(
      'EXISTS (SELECT 1 FROM lecture_times lt WHERE lt.lecture_id = l.id AND lt.day_of_week = ?)'
    )
    params.push(day)
  }
  if (gubun) {
    conditions.push('l.gubun = ?')
    params.push(gubun)
  }
  if (keyword) {
    conditions.push('(l.course_name LIKE ? OR l.professor LIKE ?)')
    const like = `%${keyword}%`
    params.push(like, like)
  }

  const whereClause = conditions.length > 0
    ? 'WHERE ' + conditions.join(' AND ')
    : ''

  const baseFrom = `FROM lectures l LEFT JOIN departments d ON l.department_id = d.id ${whereClause}`

  const total = db.prepare(`SELECT COUNT(*) as count ${baseFrom}`).get(...params).count

  const offset = (page - 1) * limit
  const lectures = db.prepare(
    `SELECT l.*, d.name as department_name ${baseFrom} ORDER BY l.id LIMIT ? OFFSET ?`
  ).all(...params, limit, offset)

  return {
    lectures: attachTimes(lectures),
    total,
    page,
    limit
  }
}

export function findById(id) {
  const db = getDatabase()
  const lecture = db.prepare(
    'SELECT l.*, d.name as department_name FROM lectures l LEFT JOIN departments d ON l.department_id = d.id WHERE l.id = ?'
  ).get(id)

  if (!lecture) return null

  const times = db.prepare(
    'SELECT id, lecture_id, day_of_week, start_time, end_time, room FROM lecture_times WHERE lecture_id = ?'
  ).all(id)

  return { ...lecture, times }
}

export function search(q, page = 1, limit = 50) {
  const db = getDatabase()
  const like = `%${q}%`
  const params = [like, like, like]

  const whereClause = 'WHERE l.course_name LIKE ? OR l.professor LIKE ? OR l.course_code LIKE ?'
  const baseFrom = `FROM lectures l LEFT JOIN departments d ON l.department_id = d.id ${whereClause}`

  const total = db.prepare(`SELECT COUNT(*) as count ${baseFrom}`).get(...params).count

  const offset = (page - 1) * limit
  const lectures = db.prepare(
    `SELECT l.*, d.name as department_name ${baseFrom} ORDER BY l.id LIMIT ? OFFSET ?`
  ).all(...params, limit, offset)

  return {
    lectures: attachTimes(lectures),
    total,
    page,
    limit
  }
}
