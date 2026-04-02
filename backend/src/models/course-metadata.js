import { getAll } from '../config/database.js'

// 전공필수 교과목 코드 조회 (course_code 접두사 매칭)
export async function getRequiredCodes(department) {
  const rows = await getAll(
    'SELECT course_code, course_name, note FROM required_courses WHERE department = $1',
    [department]
  )

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
export async function getCrossMajorNames(department) {
  const rows = await getAll(
    'SELECT course_name, offering_department, note FROM cross_major_courses WHERE receiving_department = $1',
    [department]
  )

  const map = new Map()
  for (const r of rows) {
    map.set(r.course_name, { offering_department: r.offering_department, note: r.note })
  }
  return map
}

// 수강금지 교과목 조회 (course_name 기반)
export async function getBannedNames(department) {
  const rows = await getAll(
    'SELECT course_name FROM banned_courses WHERE department = $1',
    [department]
  )

  return new Set(rows.map(r => r.course_name))
}

// 전공교류 실제 개설 강의 조회 (cross_major_courses JOIN lectures)
export async function getCrossMajorLectures(department) {
  const crossRows = await getAll(
    'SELECT course_name, offering_department, note FROM cross_major_courses WHERE receiving_department = $1',
    [department]
  )

  if (crossRows.length === 0) return []

  const courseNames = crossRows.map(r => r.course_name)
  const namePlaceholders = courseNames.map((_, i) => `$${i + 1}`).join(',')
  const deptParam = `$${courseNames.length + 1}`

  const lectureRows = await getAll(`
    SELECT l.*, d.name as department_name
    FROM lectures l
    LEFT JOIN departments d ON l.department_id = d.id
    WHERE l.course_name IN (${namePlaceholders})
      AND (d.name IS NULL OR d.name != ${deptParam})
  `, [...courseNames, department])

  const crossMap = new Map()
  for (const r of crossRows) {
    crossMap.set(r.course_name, { offering_department: r.offering_department, note: r.note })
  }

  const results = []
  for (const lec of lectureRows) {
    const times = await getAll(
      'SELECT day_of_week, start_time, end_time, room FROM lecture_times WHERE lecture_id = $1',
      [lec.id]
    )
    const meta = crossMap.get(lec.course_name)
    results.push({
      ...lec,
      times,
      cross_major: true,
      offering_department: meta?.offering_department || '',
      cross_note: meta?.note || ''
    })
  }

  return results
}

// 모든 메타데이터를 한번에 조회
export async function getAllMetadata(department) {
  const [requiredList, crossMajor, banned] = await Promise.all([
    getRequiredCodes(department),
    getCrossMajorNames(department),
    getBannedNames(department)
  ])
  return { requiredList, crossMajor, banned }
}
