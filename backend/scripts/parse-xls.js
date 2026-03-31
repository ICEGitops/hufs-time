import { readFile, writeFile } from 'fs/promises'
import { read, utils } from 'xlsx'
import path from 'path'

const XLS_PATH = path.join(process.cwd(), '..', '2026-1학기 글로벌캠퍼스 수강유의교과목.xls')
const DATA_DIR = path.join(process.cwd(), 'data')

async function main() {
  const buf = await readFile(XLS_PATH)
  const wb = read(buf, { type: 'buffer' })

  console.log('Sheets:', wb.SheetNames)

  const required = parseRequiredCourses(wb)
  const crossMajor = parseCrossMajorCourses(wb)
  const banned = parseBannedCourses(wb)

  await writeFile(path.join(DATA_DIR, 'required-courses.json'), JSON.stringify(required, null, 2))
  console.log(`required-courses.json: ${required.length} entries`)

  await writeFile(path.join(DATA_DIR, 'cross-major-courses.json'), JSON.stringify(crossMajor, null, 2))
  console.log(`cross-major-courses.json: ${crossMajor.length} entries`)

  await writeFile(path.join(DATA_DIR, 'banned-courses.json'), JSON.stringify(banned, null, 2))
  console.log(`banned-courses.json: ${banned.length} entries`)
}

// Sheet II: 전공필수교과목
function parseRequiredCourses(wb) {
  const sheet = wb.Sheets[wb.SheetNames[1]]
  const rows = utils.sheet_to_json(sheet, { header: 1, defval: '' })
  const result = []

  for (const row of rows) {
    const no = row[0]
    // 데이터 행은 No.가 숫자인 행
    if (typeof no !== 'number' || no < 1) continue

    const college = String(row[1] || '').trim()
    const department = String(row[2] || '').trim()
    const majorCode = String(row[3] || '').trim()
    const courseCode = String(row[4] || '').trim()
    const courseName = String(row[5] || '').trim()
    const note = String(row[6] || '').trim()

    if (!courseCode || !courseName) continue
    // 폐지된 과목 제외
    if (note.includes('폐지')) continue

    result.push({
      college,
      department,
      major_code: majorCode,
      course_code: courseCode,
      course_name: courseName,
      note: note || null
    })
  }

  return result
}

// Sheet III: 전공교류교과목
function parseCrossMajorCourses(wb) {
  const sheet = wb.Sheets[wb.SheetNames[2]]
  const rows = utils.sheet_to_json(sheet, { header: 1, defval: '' })
  const result = []
  let currentReceiver = ''
  let currentNote = ''

  for (const row of rows) {
    const col0 = String(row[0] || '').trim()
    const col1 = String(row[1] || '').trim()
    const col2 = String(row[2] || '').trim()
    const col3 = String(row[3] || '').trim()

    // 헤더/설명 행 스킵
    if (!col2 || col2 === '교과목명') continue
    // ● 주석 행 스킵
    if (col0.startsWith('●')) continue

    // 새 수신 학과가 있으면 업데이트
    if (col0) {
      currentReceiver = col0
      currentNote = col3
    }

    result.push({
      receiving_department: currentReceiver,
      offering_department: col1 || null,
      course_name: col2,
      note: (col3 || currentNote || '').trim() || null
    })
  }

  return result
}

// Sheet IV: 수강금지 교양교과목
function parseBannedCourses(wb) {
  const sheet = wb.Sheets[wb.SheetNames[3]]
  const rows = utils.sheet_to_json(sheet, { header: 1, defval: '' })
  const result = []
  let currentDepts = []

  for (let i = 0; i < rows.length; i++) {
    const col0 = String(rows[i][0] || '').trim()
    const col1 = String(rows[i][1] || '').trim()

    // 헤더 행 스킵
    if (!col1 || col1 === '수강금지 교양 교과목') continue
    if (col0.startsWith('●') || col0.startsWith('IV')) continue

    // 새 학과 그룹
    if (col0) {
      // 학과명이 줄바꿈으로 여러 개 나열될 수 있음
      currentDepts = col0.split('\n').map(d => d.trim()).filter(Boolean)
    }

    if (!col1 || currentDepts.length === 0) continue

    // 과목명에서 "1,2" 패턴 분리: "대학(교양)영어1,2" → "대학(교양)영어1", "대학(교양)영어2"
    const courseNames = expandCourseNames(col1)

    for (const dept of currentDepts) {
      for (const name of courseNames) {
        result.push({ department: dept, course_name: name })
      }
    }
  }

  return result
}

// "대학(교양)영어1,2," → ["대학(교양)영어1", "대학(교양)영어2"]
// "HUFS Survival English 1,2" → ["HUFS Survival English 1", "HUFS Survival English 2"]
// "독일어의이해1,2(실외(선))" → ["독일어의이해1", "독일어의이해2"]
function expandCourseNames(raw) {
  // 끝의 쉼표 제거
  let name = raw.replace(/,\s*$/, '').trim()
  // "(실외)" 등 괄호 주석 제거
  name = name.replace(/\(실외(\([^)]*\))?\)/, '').trim()

  // "1,2" 패턴 찾기
  const match = name.match(/^(.+?)(\d+)\s*,\s*(\d+)$/)
  if (match) {
    return [`${match[1]}${match[2]}`, `${match[1]}${match[3]}`]
  }

  return [name]
}

main().catch(err => {
  console.error('Parse failed:', err.message)
  process.exit(1)
})
