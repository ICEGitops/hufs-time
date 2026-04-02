import { readFileSync } from 'fs'
import path from 'path'
import { initDatabase, withTransaction, getOne, getAll, closePool } from '../config/database.js'
import { parseTimeString } from '../scraper/data-parser.js'

async function seed() {
  await initDatabase()

  const dataPath = path.join(process.cwd(), 'data', 'seed-lectures.json')
  const data = JSON.parse(readFileSync(dataPath, 'utf-8'))

  const semester = '2026-1'
  let totalLectures = 0
  let totalTimes = 0

  await withTransaction(async (client) => {
    await client.query('DELETE FROM lecture_times')
    await client.query('DELETE FROM lectures')
    await client.query('DELETE FROM departments')

    const deptIdMap = {}
    for (const dept of data.departments) {
      const result = await client.query(
        'INSERT INTO departments (name, college) VALUES ($1, $2) RETURNING id',
        [dept.name, dept.college]
      )
      deptIdMap[dept.name] = result.rows[0].id
    }
    console.log(`${data.departments.length}개 학과 삽입 완료`)

    for (const group of data.lectures) {
      const deptId = deptIdMap[group.department]

      for (const course of group.courses) {
        const result = await client.query(`
          INSERT INTO lectures
            (course_code, course_name, professor, credit, category, year_level, department_id, capacity, semester)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          RETURNING id
        `, [
          course.code, course.name, course.professor,
          course.credit, course.category, course.year,
          deptId, course.capacity, semester
        ])
        const lectureId = result.rows[0].id
        totalLectures++

        const timeSlots = parseTimeString(course.times)
        for (const slot of timeSlots) {
          await client.query(
            'INSERT INTO lecture_times (lecture_id, day_of_week, start_time, end_time, room) VALUES ($1, $2, $3, $4, $5)',
            [lectureId, slot.day_of_week, slot.start_time, slot.end_time, slot.room]
          )
          totalTimes++
        }
      }
    }
  })

  console.log(`${totalLectures}개 강의, ${totalTimes}개 시간 슬롯 삽입 완료`)

  const deptCount = await getOne('SELECT COUNT(*) as cnt FROM departments')
  const lectureCount = await getOne('SELECT COUNT(*) as cnt FROM lectures')
  const timeCount = await getOne('SELECT COUNT(*) as cnt FROM lecture_times')

  console.log(`\n[검증] departments: ${deptCount.cnt}, lectures: ${lectureCount.cnt}, lecture_times: ${timeCount.cnt}`)

  const sample = await getAll(`
    SELECT l.course_code, l.course_name, l.professor, d.name as dept,
           lt.day_of_week, lt.start_time, lt.end_time, lt.room
    FROM lectures l
    JOIN departments d ON l.department_id = d.id
    JOIN lecture_times lt ON lt.lecture_id = l.id
    LIMIT 5
  `)

  console.log('\n[샘플 데이터]')
  for (const row of sample) {
    console.log(`  ${row.dept} | ${row.course_code} ${row.course_name} (${row.professor}) | ${row.day_of_week} ${row.start_time}-${row.end_time} ${row.room}`)
  }

  await closePool()
}

seed().catch(err => {
  console.error(err)
  process.exit(1)
})
