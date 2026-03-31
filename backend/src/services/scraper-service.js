import { readFileSync, existsSync } from 'fs'
import path from 'path'
import { getDatabase } from '../config/database.js'
import { parseTimeString, parseLecture } from '../scraper/data-parser.js'
import { fetchAllDepartments } from '../scraper/hufs-scraper.js'
import * as scrapeLogModel from '../models/scrape-log.js'

let scraping = false

// 스크래핑 실행
export async function runScrape(options = {}) {
  const { mode = 'live' } = options

  if (scraping) {
    const error = new Error('스크래핑이 이미 진행 중입니다.')
    error.status = 409
    error.code = 'SCRAPE_IN_PROGRESS'
    throw error
  }

  scraping = true
  const logId = scrapeLogModel.insertLog('running')

  // 비동기로 실행 (즉시 응답 반환)
  setImmediate(async () => {
    try {
      let count
      if (mode === 'seed') {
        count = loadSeedData()
        console.log(`Scrape completed: ${count} lectures loaded from seed`)
      } else {
        count = await runLiveScrape()
        console.log(`Scrape completed: ${count} lectures fetched from HUFS API`)
      }
      scrapeLogModel.updateLog(logId, { status: 'success', totalCount: count })
    } catch (error) {
      scrapeLogModel.updateLog(logId, { status: 'failed', errorMessage: error.message })
      console.error(`Scrape failed: ${error.message}`)
    } finally {
      scraping = false
    }
  })

  return { logId, status: 'started', mode }
}

// 실제 HUFS API에서 강의 데이터 수집
async function runLiveScrape() {
  const rawLectures = await fetchAllDepartments()

  if (rawLectures.length === 0) {
    throw new Error('HUFS API에서 강의 데이터를 가져오지 못했습니다.')
  }

  const parsed = rawLectures.map(raw => ({
    ...parseLecture(raw, raw._deptName),
    campus: raw._campus || 'H1',
    gubun: raw._gubun || '1'
  }))
  const count = upsertLectures(parsed)
  return count
}

// 파싱된 강의 데이터를 DB에 저장 (DELETE + INSERT 패턴)
function upsertLectures(lectures) {
  const db = getDatabase()
  const semester = '2026-1'

  const insertDept = db.prepare(
    'INSERT OR IGNORE INTO departments (name, campus) VALUES (?, ?)'
  )
  const getDeptId = db.prepare(
    'SELECT id FROM departments WHERE name = ? AND campus = ?'
  )
  const insertLecture = db.prepare(`
    INSERT INTO lectures
      (course_code, course_name, professor, credit, category, year_level, department_id, capacity, enrolled, semester, gubun)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  const insertTime = db.prepare(`
    INSERT INTO lecture_times (lecture_id, day_of_week, start_time, end_time, room)
    VALUES (?, ?, ?, ?, ?)
  `)

  const doUpsert = db.transaction(() => {
    // 기존 데이터 삭제
    db.exec('DELETE FROM lecture_times')
    db.exec('DELETE FROM lectures')
    db.exec('DELETE FROM departments')

    let totalLectures = 0

    for (const lecture of lectures) {
      // 학과 삽입
      insertDept.run(lecture.department, lecture.campus || 'H1')
      const dept = getDeptId.get(lecture.department, lecture.campus || 'H1')
      const deptId = dept ? dept.id : null

      // 강의 삽입
      const result = insertLecture.run(
        lecture.course_code, lecture.course_name, lecture.professor,
        lecture.credit, lecture.category, lecture.year_level,
        deptId, lecture.capacity, lecture.enrolled, semester, lecture.gubun || '1'
      )
      const lectureId = result.lastInsertRowid
      totalLectures++

      // 시간 슬롯 삽입
      for (const slot of lecture.times) {
        insertTime.run(lectureId, slot.day_of_week, slot.start_time, slot.end_time, slot.room)
      }
    }

    return totalLectures
  })

  return doUpsert()
}

// 시드 데이터를 DB에 로드 (폴백용)
function loadSeedData() {
  const db = getDatabase()
  const dataPath = path.join(process.cwd(), 'data', 'seed-lectures.json')

  if (!existsSync(dataPath)) {
    throw new Error('시드 데이터 파일을 찾을 수 없습니다.')
  }

  const data = JSON.parse(readFileSync(dataPath, 'utf-8'))

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

  const doSeed = db.transaction(() => {
    const deptIdMap = {}
    for (const dept of data.departments) {
      const result = insertDept.run(dept.name, dept.college)
      deptIdMap[dept.name] = result.lastInsertRowid
    }

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

        const timeSlots = parseTimeString(course.times)
        for (const slot of timeSlots) {
          insertTime.run(lectureId, slot.day_of_week, slot.start_time, slot.end_time, slot.room)
        }
      }
    }
  })

  doSeed()
  return totalLectures
}

// 최근 스크래핑 상태 조회
export function getScrapeStatus() {
  return scrapeLogModel.findRecent(5)
}
