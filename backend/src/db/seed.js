import { readFileSync } from 'fs'
import path from 'path'
import { initDatabase, getDatabase } from '../config/database.js'
import { parseTimeString } from '../scraper/data-parser.js'

function seed() {
  initDatabase()
  const db = getDatabase()

  const dataPath = path.join(process.cwd(), 'data', 'seed-lectures.json')
  const data = JSON.parse(readFileSync(dataPath, 'utf-8'))

  // 기존 데이터 초기화
  db.exec('DELETE FROM lecture_times')
  db.exec('DELETE FROM lectures')
  db.exec('DELETE FROM departments')

  const insertDept = db.prepare(
    'INSERT INTO departments (name, college) VALUES (?, ?)'
  )
  const insertLecture = db.prepare(`
    INSERT INTO lectures
      (course_code, course_name, professor, credit, category, year_level, department_id, capacity, semester)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  const insertTime = db.prepare(`
    INSERT INTO lecture_times (lecture_id, day_of_week, start_time, end_time, room)
    VALUES (?, ?, ?, ?, ?)
  `)

  const semester = '2026-1'
  let totalLectures = 0
  let totalTimes = 0

  const seedAll = db.transaction(() => {
    // 학과 삽입
    const deptIdMap = {}
    for (const dept of data.departments) {
      const result = insertDept.run(dept.name, dept.college)
      deptIdMap[dept.name] = result.lastInsertRowid
    }
    console.log(`${data.departments.length}개 학과 삽입 완료`)

    // 강의 삽입
    for (const group of data.lectures) {
      const deptId = deptIdMap[group.department]

      for (const course of group.courses) {
        const result = insertLecture.run(
          course.code, course.name, course.professor,
          course.credit, course.category, course.year,
          deptId, course.capacity, semester
        )
        const lectureId = result.lastInsertRowid
        totalLectures++

        // 시간 파싱 및 삽입
        const timeSlots = parseTimeString(course.times)
        for (const slot of timeSlots) {
          insertTime.run(
            lectureId, slot.day_of_week, slot.start_time, slot.end_time, slot.room
          )
          totalTimes++
        }
      }
    }
  })

  seedAll()

  console.log(`${totalLectures}개 강의, ${totalTimes}개 시간 슬롯 삽입 완료`)

  // 검증
  const deptCount = db.prepare('SELECT COUNT(*) as cnt FROM departments').get().cnt
  const lectureCount = db.prepare('SELECT COUNT(*) as cnt FROM lectures').get().cnt
  const timeCount = db.prepare('SELECT COUNT(*) as cnt FROM lecture_times').get().cnt

  console.log(`\n[검증] departments: ${deptCount}, lectures: ${lectureCount}, lecture_times: ${timeCount}`)

  // 샘플 출력
  const sample = db.prepare(`
    SELECT l.course_code, l.course_name, l.professor, d.name as dept,
           lt.day_of_week, lt.start_time, lt.end_time, lt.room
    FROM lectures l
    JOIN departments d ON l.department_id = d.id
    JOIN lecture_times lt ON lt.lecture_id = l.id
    LIMIT 5
  `).all()

  console.log('\n[샘플 데이터]')
  for (const row of sample) {
    console.log(`  ${row.dept} | ${row.course_code} ${row.course_name} (${row.professor}) | ${row.day_of_week} ${row.start_time}-${row.end_time} ${row.room}`)
  }

  db.close()
}

seed()
