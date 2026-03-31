import { getDatabase } from '../config/database.js'

// 전공필수 교과목 코드 조회 (course_code 접두사 매칭)
export function getRequiredCodes(department) {
  const db = getDatabase()
  const rows = db.prepare(
    'SELECT course_code, course_name, note FROM required_courses WHERE department = ?'
  ).all(department)

  // xls의 코드(V31201)가 실제 코드(V31201101)의 접두사
  return rows.map(r => ({
    code: r.course_code,
    course_name: r.course_name,
    note: r.note
  }))
}

// course_code가 required 목록의 접두사와 매칭되는지 확인
export function matchRequired(courseCode, requiredList) {
  return requiredList.find(r => courseCode.startsWith(r.code)) || null
}

// 전공교류 교과목 조회 (course_name 기반)
export function getCrossMajorNames(department) {
  const db = getDatabase()
  const rows = db.prepare(
    'SELECT course_name, offering_department, note FROM cross_major_courses WHERE receiving_department = ?'
  ).all(department)

  const map = new Map()
  for (const r of rows) {
    map.set(r.course_name, { offering_department: r.offering_department, note: r.note })
  }
  return map
}

// 수강금지 교과목 조회 (course_name 기반)
export function getBannedNames(department) {
  const db = getDatabase()
  const rows = db.prepare(
    'SELECT course_name FROM banned_courses WHERE department = ?'
  ).all(department)

  return new Set(rows.map(r => r.course_name))
}

// 전공교류 실제 개설 강의 조회 (cross_major_courses JOIN lectures)
export function getCrossMajorLectures(department) {
  const db = getDatabase()

  // 1) receiving_department가 내 학과인 전공교류 과목명 목록
  const crossRows = db.prepare(
    'SELECT course_name, offering_department, note FROM cross_major_courses WHERE receiving_department = ?'
  ).all(department)

  if (crossRows.length === 0) return []

  // 2) 과목명으로 실제 lectures에서 조회 (현재 학기 기준)
  const placeholders = crossRows.map(() => '?').join(',')
  const courseNames = crossRows.map(r => r.course_name)

  const lectureRows = db.prepare(`
    SELECT l.*, d.name as department_name
    FROM lectures l
    LEFT JOIN departments d ON l.department_id = d.id
    WHERE l.course_name IN (${placeholders})
      AND (d.name IS NULL OR d.name != ?)
  `).all(...courseNames, department)

  // 3) 각 강의에 시간 정보 + 전공교류 메타 추가
  const timeStmt = db.prepare(
    'SELECT day_of_week, start_time, end_time, room FROM lecture_times WHERE lecture_id = ?'
  )

  const crossMap = new Map()
  for (const r of crossRows) {
    crossMap.set(r.course_name, { offering_department: r.offering_department, note: r.note })
  }

  return lectureRows.map(lec => {
    const times = timeStmt.all(lec.id)
    const meta = crossMap.get(lec.course_name)
    return {
      ...lec,
      times,
      cross_major: true,
      offering_department: meta?.offering_department || '',
      cross_note: meta?.note || ''
    }
  })
}

// 모든 메타데이터를 한번에 조회
export function getAllMetadata(department) {
  return {
    requiredList: getRequiredCodes(department),
    crossMajor: getCrossMajorNames(department),
    banned: getBannedNames(department)
  }
}
