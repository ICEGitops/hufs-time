import { getAll, getOne } from '../config/database.js'

// lecture_times를 lectures 배열에 매핑
async function attachTimes(lectures) {
  if (lectures.length === 0) return lectures

  const ids = lectures.map(l => l.id)
  const placeholders = ids.map((_, i) => `$${i + 1}`).join(',')
  const times = await getAll(
    `SELECT id, lecture_id, day_of_week, start_time, end_time, room
     FROM lecture_times WHERE lecture_id IN (${placeholders})`,
    ids
  )

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

export async function findAll(filters = {}) {
  const { department, year, category, day, keyword, gubun, page = 1, limit = 50 } = filters

  const conditions = []
  const params = []
  let idx = 1

  if (department) {
    conditions.push(`d.name = $${idx++}`)
    params.push(department)
  }
  if (year) {
    conditions.push(`l.year_level = $${idx++}`)
    params.push(Number(year))
  }
  if (category) {
    conditions.push(`l.category = $${idx++}`)
    params.push(category)
  }
  if (day) {
    conditions.push(
      `EXISTS (SELECT 1 FROM lecture_times lt WHERE lt.lecture_id = l.id AND lt.day_of_week = $${idx++})`
    )
    params.push(day)
  }
  if (gubun) {
    conditions.push(`l.gubun = $${idx++}`)
    params.push(gubun)
  }
  if (keyword) {
    conditions.push(`(l.course_name LIKE $${idx++} OR l.professor LIKE $${idx++})`)
    const like = `%${keyword}%`
    params.push(like, like)
  }

  const whereClause = conditions.length > 0
    ? 'WHERE ' + conditions.join(' AND ')
    : ''

  const baseFrom = `FROM lectures l LEFT JOIN departments d ON l.department_id = d.id ${whereClause}`

  const countRow = await getOne(`SELECT COUNT(*) as count ${baseFrom}`, params)
  const total = parseInt(countRow.count)

  const offset = (page - 1) * limit
  const lectures = await getAll(
    `SELECT l.*, d.name as department_name ${baseFrom} ORDER BY l.id LIMIT $${idx++} OFFSET $${idx++}`,
    [...params, limit, offset]
  )

  return {
    lectures: await attachTimes(lectures),
    total,
    page,
    limit
  }
}

export async function findById(id) {
  const lecture = await getOne(
    'SELECT l.*, d.name as department_name FROM lectures l LEFT JOIN departments d ON l.department_id = d.id WHERE l.id = $1',
    [id]
  )

  if (!lecture) return null

  const times = await getAll(
    'SELECT id, lecture_id, day_of_week, start_time, end_time, room FROM lecture_times WHERE lecture_id = $1',
    [id]
  )

  return { ...lecture, times }
}

export async function search(q, page = 1, limit = 50) {
  const like = `%${q}%`

  const whereClause = 'WHERE l.course_name LIKE $1 OR l.professor LIKE $2 OR l.course_code LIKE $3'
  const baseFrom = `FROM lectures l LEFT JOIN departments d ON l.department_id = d.id ${whereClause}`

  const countRow = await getOne(`SELECT COUNT(*) as count ${baseFrom}`, [like, like, like])
  const total = parseInt(countRow.count)

  const offset = (page - 1) * limit
  const lectures = await getAll(
    `SELECT l.*, d.name as department_name ${baseFrom} ORDER BY l.id LIMIT $4 OFFSET $5`,
    [like, like, like, limit, offset]
  )

  return {
    lectures: await attachTimes(lectures),
    total,
    page,
    limit
  }
}
