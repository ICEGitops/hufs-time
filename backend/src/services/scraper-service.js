import { readFileSync, existsSync } from 'fs'
import path from 'path'
import { withTransaction } from '../config/database.js'
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
  const logId = await scrapeLogModel.insertLog('running')

  // 비동기로 실행 (즉시 응답 반환)
  setImmediate(async () => {
    try {
      let count
      if (mode === 'seed') {
        count = await loadSeedData()
        console.log(`Scrape completed: ${count} lectures loaded from seed`)
      } else {
        count = await runLiveScrape()
        console.log(`Scrape completed: ${count} lectures fetched from HUFS API`)
      }
      await scrapeLogModel.updateLog(logId, { status: 'success', totalCount: count })
    } catch (error) {
      await scrapeLogModel.updateLog(logId, { status: 'failed', errorMessage: error.message })
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
  const count = await upsertLectures(parsed)
  return count
}

// 멀티 로우 INSERT 빌더 (배치 처리용)
function buildBatchInsert(table, columns, rows, startIdx = 1) {
  const colCount = columns.length
  const valueClauses = []
  const params = []
  let idx = startIdx

  for (const row of rows) {
    const placeholders = row.map(() => `$${idx++}`)
    valueClauses.push(`(${placeholders.join(',')})`)
    params.push(...row)
  }

  const sql = `INSERT INTO ${table} (${columns.join(',')}) VALUES ${valueClauses.join(',')}`
  return { sql, params, nextIdx: idx }
}

// 배치 크기 (PostgreSQL 파라미터 한도 65535개 고려)
const BATCH_SIZE = 500

// 파싱된 강의 데이터를 DB에 저장 (DELETE + 배치 INSERT 패턴)
async function upsertLectures(lectures) {
  const semester = '2026-1'

  return await withTransaction(async (client) => {
    // 기존 데이터 삭제
    await client.query('DELETE FROM lecture_times')
    await client.query('DELETE FROM lectures')
    await client.query('DELETE FROM departments')

    // 1) 학과 일괄 삽입
    const deptSet = new Map()
    for (const lec of lectures) {
      const key = `${lec.department}||${lec.campus || 'H1'}`
      if (!deptSet.has(key)) {
        deptSet.set(key, [lec.department, lec.campus || 'H1'])
      }
    }

    const deptRows = [...deptSet.values()]
    for (let i = 0; i < deptRows.length; i += BATCH_SIZE) {
      const batch = deptRows.slice(i, i + BATCH_SIZE)
      const { sql, params } = buildBatchInsert('departments', ['name', 'campus'], batch)
      await client.query(sql + ' ON CONFLICT (name, campus) DO NOTHING', params)
    }

    // 학과 ID 맵 조회
    const deptResult = await client.query('SELECT id, name, campus FROM departments')
    const deptIdMap = {}
    for (const d of deptResult.rows) {
      deptIdMap[`${d.name}||${d.campus}`] = d.id
    }

    // 2) 강의 일괄 삽입
    const lecColumns = [
      'course_code', 'course_name', 'professor', 'credit', 'category',
      'year_level', 'department_id', 'capacity', 'enrolled', 'semester', 'gubun'
    ]

    for (let i = 0; i < lectures.length; i += BATCH_SIZE) {
      const batch = lectures.slice(i, i + BATCH_SIZE)
      const rows = batch.map(lec => {
        const deptId = deptIdMap[`${lec.department}||${lec.campus || 'H1'}`] || null
        return [
          lec.course_code, lec.course_name, lec.professor,
          lec.credit, lec.category, lec.year_level,
          deptId, lec.capacity, lec.enrolled, semester, lec.gubun || '1'
        ]
      })
      const { sql, params } = buildBatchInsert('lectures', lecColumns, rows)
      await client.query(sql + ' RETURNING id', params)
    }

    // 강의 ID 매핑
    const lecResult = await client.query('SELECT id, course_code, department_id, course_name FROM lectures')
    const lecIdList = lecResult.rows

    // 3) 시간 슬롯 일괄 삽입
    const timeColumns = ['lecture_id', 'day_of_week', 'start_time', 'end_time', 'room']
    const allTimeRows = []

    for (let i = 0; i < lectures.length; i++) {
      const lectureId = lecIdList[i]?.id
      if (!lectureId) continue
      for (const slot of lectures[i].times) {
        allTimeRows.push([lectureId, slot.day_of_week, slot.start_time, slot.end_time, slot.room])
      }
    }

    for (let i = 0; i < allTimeRows.length; i += BATCH_SIZE) {
      const batch = allTimeRows.slice(i, i + BATCH_SIZE)
      const { sql, params } = buildBatchInsert('lecture_times', timeColumns, batch)
      await client.query(sql, params)
    }

    return lectures.length
  })
}

// 시드 데이터를 DB에 로드 (폴백용)
async function loadSeedData() {
  const dataPath = path.join(process.cwd(), 'data', 'seed-lectures.json')

  if (!existsSync(dataPath)) {
    throw new Error('시드 데이터 파일을 찾을 수 없습니다.')
  }

  const data = JSON.parse(readFileSync(dataPath, 'utf-8'))
  const semester = '2026-1'

  return await withTransaction(async (client) => {
    await client.query('DELETE FROM lecture_times')
    await client.query('DELETE FROM lectures')
    await client.query('DELETE FROM departments')

    let totalLectures = 0
    const deptIdMap = {}

    for (const dept of data.departments) {
      const result = await client.query(
        'INSERT INTO departments (name, college) VALUES ($1, $2) RETURNING id',
        [dept.name, dept.college]
      )
      deptIdMap[dept.name] = result.rows[0].id
    }

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
        }
      }
    }

    return totalLectures
  })
}

// 최근 스크래핑 상태 조회
export async function getScrapeStatus() {
  return scrapeLogModel.findRecent(5)
}
