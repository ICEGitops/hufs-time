// 교시 → 시간 매핑
export const PERIOD_MAP = {
  '1': ['09:00', '09:50'],
  '2': ['10:00', '10:50'],
  '3': ['11:00', '11:50'],
  '4': ['12:00', '12:50'],
  '5': ['13:00', '13:50'],
  '6': ['14:00', '14:50'],
  '7': ['15:00', '15:50'],
  '8': ['16:00', '16:50'],
  '9': ['17:00', '17:50'],
  '10': ['18:00', '18:50'],
  '11': ['19:00', '19:50'],
  '12': ['20:00', '20:50']
}

// "월 1 금 1 2 (5213)" 또는 "월3,4(공B04) 수3(공B04)" → [{ day_of_week, start_time, end_time, room }]
export function parseTimeString(timeStr) {
  if (!timeStr || timeStr.trim() === '') return []

  // 괄호 안 강의실 추출 후 제거
  let room = null
  const roomMatch = timeStr.match(/\(([^)]+)\)/)
  if (roomMatch) room = roomMatch[1]
  const stripped = timeStr.replace(/\([^)]*\)/g, '').trim()

  // 기존 형식 감지: "월3,4" (요일 바로 뒤에 숫자)
  if (/[월화수목금토]\d/.test(stripped)) {
    return parseLegacyFormat(stripped, room)
  }

  // 새 형식: "월 1 금 1 2" (공백으로 분리)
  return parseSpacedFormat(stripped, room)
}

// 기존 형식: "월3,4(공B04) 수3(공B04)"
function parseLegacyFormat(timeStr, defaultRoom) {
  const slots = []
  const pattern = /([월화수목금토])([0-9A-C,]+)(?:\(([^)]+)\))?/g
  let match

  while ((match = pattern.exec(timeStr)) !== null) {
    const day = match[1]
    const periods = match[2].split(',').map(Number).sort((a, b) => a - b)
    const room = match[3] || defaultRoom

    mergeAndPush(slots, day, periods, room)
  }

  return slots
}

// 새 형식: "월 1 금 1 2 (5213)"
function parseSpacedFormat(stripped, room) {
  const slots = []
  const tokens = stripped.split(/\s+/)
  const days = '월화수목금토'

  let currentDay = null
  let currentPeriods = []

  for (const token of tokens) {
    if (days.includes(token)) {
      // 이전 요일 데이터 저장
      if (currentDay && currentPeriods.length > 0) {
        mergeAndPush(slots, currentDay, currentPeriods, room)
      }
      currentDay = token
      currentPeriods = []
    } else {
      const num = Number(token)
      if (!isNaN(num) && PERIOD_MAP[num]) {
        currentPeriods.push(num)
      }
    }
  }

  // 마지막 요일 처리
  if (currentDay && currentPeriods.length > 0) {
    mergeAndPush(slots, currentDay, currentPeriods, room)
  }

  return slots
}

// 연속 교시를 병합하여 슬롯 추가
function mergeAndPush(slots, day, periods, room) {
  periods.sort((a, b) => a - b)
  let groupStart = periods[0]
  let groupEnd = periods[0]

  for (let i = 1; i <= periods.length; i++) {
    if (i < periods.length && periods[i] === groupEnd + 1) {
      groupEnd = periods[i]
    } else {
      slots.push({
        day_of_week: day,
        start_time: PERIOD_MAP[groupStart][0],
        end_time: PERIOD_MAP[groupEnd][1],
        room
      })
      if (i < periods.length) {
        groupStart = periods[i]
        groupEnd = periods[i]
      }
    }
  }
}

// HUFS API 응답의 dataCount 분기 처리
export function normalizeResponse(obj) {
  if (!obj) return []
  const count = Number(obj.dataCount)
  if (!count || count === 0) return []
  if (count === 1) return Array.isArray(obj.data) ? obj.data : [obj.data]
  return Array.isArray(obj.data) ? obj.data : []
}

// HUFS API 응답 단일 레코드 → DB 삽입용 객체 변환
export function parseLecture(raw, deptName) {
  const times = parseTimeString(raw.dayTimeDisplay || '')

  return {
    course_code: raw.lssnCd || '',
    course_name: raw.subjtNaKr || '',
    course_name_eng: raw.subjtNaEng || '',
    professor: raw.empNm || '',
    credit: Number(raw.unitNum) || 3,
    category: raw.comptFldNm || '',
    year_level: Number(raw.dstGrad) || null,
    department: deptName || raw.crsNm || '',
    capacity: Number(raw.lectrConstNo) || 0,
    enrolled: Number(raw.lectrOffrNo) || 0,
    times
  }
}
