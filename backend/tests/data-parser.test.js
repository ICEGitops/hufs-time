import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  parseTimeString,
  normalizeResponse,
  parseLecture,
  PERIOD_MAP
} from '../src/scraper/data-parser.js'

describe('parseTimeString', () => {
  it('월3,4(공B04) 수3(공B04) → 2슬롯', () => {
    const result = parseTimeString('월3,4(공B04) 수3(공B04)')
    assert.equal(result.length, 2)

    assert.deepEqual(result[0], {
      day_of_week: '월',
      start_time: '11:00',
      end_time: '12:50',
      room: '공B04'
    })
    assert.deepEqual(result[1], {
      day_of_week: '수',
      start_time: '11:00',
      end_time: '11:50',
      room: '공B04'
    })
  })

  it('화1,2,3(공B01) → 1슬롯 (09:00-11:50)', () => {
    const result = parseTimeString('화1,2,3(공B01)')
    assert.equal(result.length, 1)
    assert.deepEqual(result[0], {
      day_of_week: '화',
      start_time: '09:00',
      end_time: '11:50',
      room: '공B01'
    })
  })

  it('금3,4,5(공B04) → 1슬롯 (11:00-13:50)', () => {
    const result = parseTimeString('금3,4,5(공B04)')
    assert.equal(result.length, 1)
    assert.deepEqual(result[0], {
      day_of_week: '금',
      start_time: '11:00',
      end_time: '13:50',
      room: '공B04'
    })
  })

  it('월3,4 수3,4 (방 없음) → 2슬롯, room=null', () => {
    const result = parseTimeString('월3,4 수3,4')
    assert.equal(result.length, 2)
    assert.equal(result[0].room, null)
    assert.equal(result[1].room, null)
    assert.equal(result[0].day_of_week, '월')
    assert.equal(result[1].day_of_week, '수')
  })

  it('화9,10(공302) → 1슬롯 (17:00-18:50)', () => {
    const result = parseTimeString('화9,10(공302)')
    assert.equal(result.length, 1)
    assert.deepEqual(result[0], {
      day_of_week: '화',
      start_time: '17:00',
      end_time: '18:50',
      room: '공302'
    })
  })

  it('빈 문자열 → []', () => {
    assert.deepEqual(parseTimeString(''), [])
    assert.deepEqual(parseTimeString(null), [])
    assert.deepEqual(parseTimeString(undefined), [])
  })
})

describe('normalizeResponse', () => {
  it('dataCount "0" → []', () => {
    assert.deepEqual(normalizeResponse({ dataCount: '0', data: [] }), [])
  })

  it('dataCount "1" → [obj.data] (단일 객체를 배열로)', () => {
    const single = { lssnCd: 'G001', subjtNaKr: '테스트' }
    const result = normalizeResponse({ dataCount: '1', data: single })
    assert.deepEqual(result, [single])
  })

  it('dataCount "3" → obj.data (배열 그대로)', () => {
    const arr = [{ id: 1 }, { id: 2 }, { id: 3 }]
    const result = normalizeResponse({ dataCount: '3', data: arr })
    assert.deepEqual(result, arr)
  })

  it('null 입력 → []', () => {
    assert.deepEqual(normalizeResponse(null), [])
  })
})

describe('parseLecture', () => {
  it('HUFS API 형식 → DB 삽입 형식 변환', () => {
    const raw = {
      lssnCd: 'G01234',
      subjtNaKr: '데이터구조',
      subjtNaEng: 'Data Structures',
      empNm: '홍길동',
      unitNum: '3',
      comptFldNm: '전공선택',
      dstGrad: '3',
      crsNm: 'Language & AI융합전공',
      lectrConstNo: '50',
      lectrOffrNo: '45',
      dayTimeDisplay: '월5,6(본305) 수5(본305)'
    }

    const result = parseLecture(raw, '정보통신공학과')

    assert.equal(result.course_code, 'G01234')
    assert.equal(result.course_name, '데이터구조')
    assert.equal(result.professor, '홍길동')
    assert.equal(result.credit, 3)
    assert.equal(result.category, '전공선택')
    assert.equal(result.year_level, 3)
    assert.equal(result.department, '정보통신공학과')
    assert.equal(result.capacity, 50)
    assert.equal(result.enrolled, 45)
    assert.equal(result.times.length, 2)
    assert.equal(result.times[0].day_of_week, '월')
    assert.equal(result.times[0].start_time, '13:00')
    assert.equal(result.times[0].end_time, '14:50')
  })

  it('deptName 미지정 시 crsNm 사용', () => {
    const raw = {
      lssnCd: 'G999',
      subjtNaKr: '테스트과목',
      empNm: '',
      unitNum: '2',
      comptFldNm: '교양',
      dstGrad: '1',
      crsNm: '교양학부',
      lectrConstNo: '100',
      lectrOffrNo: '0',
      dayTimeDisplay: ''
    }

    const result = parseLecture(raw)
    assert.equal(result.department, '교양학부')
    assert.equal(result.times.length, 0)
  })
})
