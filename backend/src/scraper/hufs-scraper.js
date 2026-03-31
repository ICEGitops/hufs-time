import axios from 'axios'
import { normalizeResponse } from './data-parser.js'

const BASE_URL = 'https://wis.hufs.ac.kr/hufs'

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// HUFS API에서 학과 목록 동적 수집
async function fetchDeptCodes(campus, year = '2026', sessn = '1') {
  const params = new URLSearchParams({
    mName: 'process3_1a',
    cName: 'hufs.stu1.STU1_C008',
    org_sect: 'A',
    ledg_year: year,
    ledg_sessn: sessn,
    campus
  })

  try {
    const response = await axios.post(BASE_URL, params.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 15000
    })

    const decoded = decodeURIComponent(response.data)
    const obj = JSON.parse(decoded)

    if (!obj.data) return []
    const data = Array.isArray(obj.data) ? obj.data : [obj.data]

    return data.map(d => ({
      value: d.hakkwaCode1,
      text: d.hakkwaName1
    }))
  } catch (error) {
    console.error(`Failed to fetch dept codes for ${campus}: ${error.message}`)
    return null
  }
}

// 서울캠퍼스 학과 코드 (폴백용)
export const SEOUL_DEPT_CODES = [
  { value: 'A4AB2', text: 'Business & AI 전공' },
  { value: 'A1CG1', text: 'ELLT학과' },
  { value: 'AAQ01', text: 'EU전공' },
  { value: 'AAMB1', text: 'FATI전공' },
  { value: 'A5A', text: 'KFL학부' },
  { value: 'A0A01', text: 'Language & AI융합전공' },
  { value: 'AKAA1', text: 'Language & Diplomacy전공' },
  { value: 'AKA', text: 'Language & Diplomacy학부' },
  { value: 'A2AA1', text: 'Language & Trade전공' },
  { value: 'A2A', text: 'Language & Trade학부' },
  { value: 'A0B01', text: 'Social Science & AI융합전공' },
  { value: 'ALAA1', text: '경영학전공' },
  { value: 'AEC', text: '경제학부' },
  { value: 'AECA1', text: '경제학전공' },
  { value: 'ACDD1', text: '광고·PR·브랜딩전공' },
  { value: 'AFF01', text: '교육학' },
  { value: 'ACAI1', text: '국가리더전공' },
  { value: 'AEAA1', text: '국제통상학과' },
  { value: 'AGA', text: '국제학부' },
  { value: 'AGAA1', text: '국제학전공' },
  { value: 'AAH01', text: '네덜란드어과' },
  { value: 'AAD01', text: '노어과' },
  { value: 'AAC01', text: '독일어과' },
  { value: 'ABP02', text: '동북아외교통상전공' },
  { value: 'ABC01', text: '말레이·인도네시아어과' },
  { value: 'ABJ01', text: '몽골어과' },
  { value: 'ANDD2', text: '문화콘텐츠학전공' },
  { value: 'ACD', text: '미디어커뮤니케이션학부' },
  { value: 'ACDE1', text: '방송·영상·뉴미디어전공' },
  { value: 'ABF01', text: '베트남어과' },
  { value: 'AAP01', text: '브릭스전공' },
  { value: 'ANDB2', text: '사학과' },
  { value: 'A4A04', text: '상담·UX심리전공' },
  { value: 'AANA1', text: '세계문화예술경영전공' },
  { value: 'AAI01', text: '스칸디나비아어과' },
  { value: 'AAE01', text: '스페인어과' },
  { value: 'ABD01', text: '아랍어과' },
  { value: 'ACDA1', text: '언론·정보전공' },
  { value: 'ANDC2', text: '언어인지과학과' },
  { value: 'A1CD1', text: '영미문학·문화학과' },
  { value: 'AFA01', text: '영어교육과' },
  { value: 'A1CE1', text: '영어통번역학과' },
  { value: 'AFJ02', text: '외국어교육학부(독일어교육전공)' },
  { value: 'AFJ03', text: '외국어교육학부(중국어교육전공)' },
  { value: 'AFJ01', text: '외국어교육학부(프랑스어교육전공)' },
  { value: 'A5A01', text: '외국어로서의한국어교육전공' },
  { value: 'A5A02', text: '외국어로서의한국어통번역전공' },
  { value: 'A4AB1', text: '융복합소프트웨어전공' },
  { value: 'AJDA1', text: '융합일본지역전공' },
  { value: 'AJD', text: '융합일본지역학부' },
  { value: 'AAF01', text: '이탈리아어과' },
  { value: 'ABG01', text: '인도어과' },
  { value: 'AJCA1', text: '일본언어문화전공' },
  { value: 'AJC', text: '일본언어문화학부' },
  { value: 'ACBA1', text: '정치외교학과' },
  { value: 'AICA1', text: '중국언어문화전공' },
  { value: 'AIC', text: '중국언어문화학부' },
  { value: 'AIDA1', text: '중국외교통상전공' },
  { value: 'AID', text: '중국외교통상학부' },
  { value: 'AICA2', text: '차이나데이터큐레이션전공' },
  { value: 'ANDA2', text: '철학과' },
  { value: 'ABE01', text: '태국학과' },
  { value: 'ABH11', text: '튀르키예·아제르바이잔학과' },
  { value: 'ABI01', text: '페르시아어·이란학과' },
  { value: 'AAK01', text: '포르투갈어과' },
  { value: 'AAMC1', text: '프랑스·EU전공' },
  { value: 'AAM', text: '프랑스어학부' },
  { value: 'AAMA1', text: '프랑스응용어문학전공' },
  { value: 'AFD01', text: '한국어교육과' },
  { value: 'ACBB1', text: '행정학과' }
]

// 글로벌캠퍼스 학과 코드 (폴백용)
export const GLOBAL_DEPT_CODES = [
  { value: 'A9A01', text: 'AI데이터융합전공' },
  { value: 'A4BA3', text: 'AI융합전공(Software&AI)' },
  { value: 'A4BB1', text: 'Business & AI 전공' },
  { value: 'A9B01', text: 'Finance & AI융합전공' },
  { value: 'ARDA1', text: 'Global Business & Technology전공' },
  { value: 'A6A92', text: 'ICT&AI세부모듈' },
  { value: 'AO1D2', text: 'TESOL영어학전공' },
  { value: 'A6A90', text: '게임한류문화산업세부모듈' },
  { value: 'ATZ', text: '공과대학(공통)' },
  { value: 'ACDD1', text: '광고·PR·브랜딩전공' },
  { value: 'AFF01', text: '교육학' },
  { value: 'ACAH1', text: '국가리더전공(글로벌)' },
  { value: 'ARCA1', text: '국제금융학과' },
  { value: 'APH02', text: '그리스·불가리아학과' },
  { value: 'AXB03', text: '글로벌e스포츠매니지먼트전공' },
  { value: 'AXB02', text: '글로벌스포츠산업전공' },
  { value: 'AXB', text: '글로벌스포츠산업학부' },
  { value: 'AMAA1', text: '기후변화융합전공' },
  { value: 'APK03', text: '남아프리카어전공' },
  { value: 'AOC02', text: '독일어통번역학과' },
  { value: 'APK01', text: '동아프리카어전공' },
  { value: 'AXC', text: '디지털콘텐츠학부' },
  { value: 'AQJ02', text: '러시아학과' },
  { value: 'APC02', text: '루마니아학과' },
  { value: 'AORI2', text: '말레이·인도네시아어통번역학과' },
  { value: 'ANDD2', text: '문화콘텐츠학전공' },
  { value: 'A6A84', text: '미국·영연방전략세부모듈' },
  { value: 'AYAA1', text: '바이오메디컬공학전공' },
  { value: 'ATN', text: '반도체전자공학부(반도체공학전공)' },
  { value: 'ATO', text: '반도체전자공학부(전자공학전공)' },
  { value: 'ACDE1', text: '방송·영상·뉴미디어전공' },
  { value: 'AQ202', text: '브라질학과' },
  { value: 'ANDB2', text: '사학과' },
  { value: 'ATB02', text: '산업경영공학과' },
  { value: 'ASJB2', text: '생명공학과' },
  { value: 'APK02', text: '서아프리카어전공' },
  { value: 'AOSA1', text: '세계문화예술경영전공' },
  { value: 'APF02', text: '세르비아·크로아티아학과' },
  { value: 'ASHA2', text: '수학과' },
  { value: 'AOD02', text: '스페인어통번역학과' },
  { value: 'A6A82', text: '아랍어통번역세부모듈' },
  { value: 'AORG2', text: '아랍어통번역학과' },
  { value: 'APK', text: '아프리카학부' },
  { value: 'ACDA1', text: '언론·정보전공' },
  { value: 'ANDC2', text: '언어인지과학과' },
  { value: 'AO1C2', text: '영미문학·번역전공' },
  { value: 'A6A81', text: '영어통번역세부모듈' },
  { value: 'AO1', text: '영어통번역학부' },
  { value: 'AO1A2', text: '영어통번역학전공' },
  { value: 'APG02', text: '우크라이나학과' },
  { value: 'A6A91', text: '융합비즈니스세부모듈' },
  { value: 'A6A', text: '융합인재학부' },
  { value: 'A6A85', text: '이탈리아·EU전략세부모듈' },
  { value: 'AOE02', text: '이탈리아어통번역학과' },
  { value: 'AQF02', text: '인도학과' },
  { value: 'AORB2', text: '일본어통번역학과' },
  { value: 'ASIB2', text: '전자물리학과' },
  { value: 'ATFB2', text: '정보통신공학과' },
  { value: 'ACBA1', text: '정치외교학과' },
  { value: 'A6A83', text: '중국어통번역세부모듈' },
  { value: 'AORA2', text: '중국어통번역학과' },
  { value: 'A6A86', text: '중동·이슬람전략세부모듈' },
  { value: 'API02', text: '중앙아시아학과' },
  { value: 'A6A87', text: '중화권전략세부모듈' },
  { value: 'ANDA2', text: '철학과' },
  { value: 'APD02', text: '체코·슬로바키아학과' },
  { value: 'ATJA1', text: '컴퓨터공학전공' },
  { value: 'AORE2', text: '태국어통번역학과' },
  { value: 'A6A88', text: '테크노미디어디자인세부모듈' },
  { value: 'ASHB2', text: '통계학과' },
  { value: 'AXD', text: '투어리즘 & 웰니스학부' },
  { value: 'A6A89', text: '패션관광문화산업세부모듈' },
  { value: 'APB02', text: '폴란드학과' },
  { value: 'AQ102', text: '프랑스학과' },
  { value: 'APJ02', text: '한국학과' },
  { value: 'ACBB1', text: '행정학과' },
  { value: 'APE02', text: '헝가리학과' },
  { value: 'ASJC2', text: '화학과' },
  { value: 'ASJA2', text: '환경학과' }
]

// 하위호환성
export const DEPT_CODES = SEOUL_DEPT_CODES

// 학과별 조회는 전공(gubun=1)만 유효, 교양/기초는 별도 영역 코드 사용
const DEPT_GUBUN_TYPES = ['1']

// 캠퍼스별 학과 코드 가져오기 (동적 + 폴백 병합)
async function getDeptCodes(campus, options = {}) {
  const { year = '2026', sessn = '1' } = options
  const fallback = campus === 'H1' ? SEOUL_DEPT_CODES : GLOBAL_DEPT_CODES
  const dynamic = await fetchDeptCodes(campus, year, sessn)

  if (!dynamic || dynamic.length === 0) {
    console.log(`[${campus}] API failed, using fallback list (${fallback.length})`)
    return fallback
  }

  // 동적 + 폴백 병합, value 기준 중복 제거
  const seen = new Set(dynamic.map(d => d.value))
  const merged = [...dynamic]
  for (const dept of fallback) {
    if (!seen.has(dept.value)) {
      merged.push(dept)
    }
  }

  console.log(`[${campus}] Merged: ${dynamic.length} from API + ${merged.length - dynamic.length} from fallback = ${merged.length} total`)
  return merged
}

// 단일 학과 + 단일 gubun 강의 데이터 요청
async function fetchLecturesByGubun(deptCode, gubun, options = {}) {
  const { year = '2026', sessn = '1', campus = 'H1' } = options

  const params = new URLSearchParams({
    mName: 'getDataLssnLista',
    cName: 'hufs.stu1.STU1_C009',
    org_sect: 'A',
    ledg_year: year,
    ledg_sessn: sessn,
    campus,
    crs_strct_cd: deptCode,
    gubun,
    subjt_nm: '',
    won: '',
    cyber: '',
    emp_nm: '',
    d1: 'N', d2: 'N', d3: 'N', d4: 'N', d5: 'N', d6: 'N',
    t1: 'N', t2: 'N', t3: 'N', t4: 'N', t5: 'N', t6: 'N',
    t7: 'N', t8: 'N', t9: 'N', t10: 'N', t11: 'N', t12: 'N'
  })

  try {
    const response = await axios.post(BASE_URL, params.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 15000
    })

    const decoded = decodeURIComponent(response.data)
    return JSON.parse(decoded)
  } catch (error) {
    console.error(`Failed to fetch lectures for ${deptCode} gubun=${gubun}: ${error.message}`)
    return { dataCount: 0 }
  }
}

// 단일 학과의 전공 강의 데이터 요청
export async function fetchLectures(deptCode, options = {}) {
  const all = []

  for (const gubun of DEPT_GUBUN_TYPES) {
    const response = await fetchLecturesByGubun(deptCode, gubun, options)
    const lectures = normalizeResponse(response)
    all.push(...lectures)
    if (lectures.length > 0) await delay(500)
  }

  return all
}

// 교양/기초 영역 코드 동적 수집
async function fetchAreaCodes(mName, campus, options = {}) {
  const { year = '2026', sessn = '1' } = options

  const params = new URLSearchParams({
    mName,
    cName: 'hufs.stu1.STU1_C008',
    ledg_year: year,
    ledg_sessn: sessn,
    campus
  })

  try {
    const response = await axios.post(BASE_URL, params.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 15000
    })

    const decoded = decodeURIComponent(response.data)
    const obj = JSON.parse(decoded)
    if (!obj.data) return []
    const data = Array.isArray(obj.data) ? obj.data : [obj.data]
    return data.map(d => ({
      value: d.fieldCode2,
      text: d.fieldName2,
      campus: d.campusCode2
    }))
  } catch (error) {
    console.error(`Failed to fetch area codes (${mName}): ${error.message}`)
    return []
  }
}

// 교양 + 기초 강의 수집
async function fetchGyoAndBasic(campus, options, allLectures) {
  // 교양 영역 코드 (process4_1a)
  const gyoCodes = await fetchAreaCodes('process4_1a', campus, options)
  console.log(`[${campus}] 교양 영역: ${gyoCodes.length}개`)

  for (const area of gyoCodes) {
    console.log(`[${campus}][교양] Fetching ${area.text} (${area.value})...`)
    try {
      const response = await fetchLecturesByGubun(area.value, '2', { ...options, campus })
      const lectures = normalizeResponse(response)
      for (const lecture of lectures) {
        allLectures.push({ ...lecture, _deptName: area.text, _campus: campus, _gubun: '2' })
      }
      console.log(`  → ${lectures.length} lectures found`)
    } catch (error) {
      console.error(`  → Error: ${error.message}`)
    }
    await delay(1500)
  }

  // 기초 영역 코드 (process4_1b: 서울, process4_1c: 글로벌)
  const basicMethod = campus === 'H1' ? 'process4_1b' : 'process4_1c'
  const basicCodes = await fetchAreaCodes(basicMethod, campus, options)
  console.log(`[${campus}] 기초 영역: ${basicCodes.length}개`)

  for (const area of basicCodes) {
    console.log(`[${campus}][기초] Fetching ${area.text} (${area.value})...`)
    try {
      const response = await fetchLecturesByGubun(area.value, '3', { ...options, campus })
      const lectures = normalizeResponse(response)
      for (const lecture of lectures) {
        allLectures.push({ ...lecture, _deptName: area.text, _campus: campus, _gubun: '3' })
      }
      console.log(`  → ${lectures.length} lectures found`)
    } catch (error) {
      console.error(`  → Error: ${error.message}`)
    }
    await delay(1500)
  }
}

// 캠퍼스별 학과 수집
async function fetchCampusDepartments(deptCodes, campus, options, allLectures) {
  for (const dept of deptCodes) {
    console.log(`[${campus}] Fetching ${dept.text} (${dept.value})...`)

    try {
      const lectures = await fetchLectures(dept.value, { ...options, campus })

      for (const lecture of lectures) {
        allLectures.push({ ...lecture, _deptName: dept.text, _campus: campus, _gubun: '1' })
      }

      console.log(`  → ${lectures.length} lectures found`)
    } catch (error) {
      console.error(`  → Error fetching ${dept.text}: ${error.message}`)
    }

    await delay(1500)
  }
}

// 전체 강의 수집 (전공 + 교양 + 기초, 서울 + 글로벌)
export async function fetchAllDepartments(options = {}) {
  const allLectures = []

  console.log('=== Seoul Campus (H1) - 전공 ===')
  const seoulDepts = await getDeptCodes('H1', options)
  await fetchCampusDepartments(seoulDepts, 'H1', options, allLectures)

  console.log('=== Seoul Campus (H1) - 교양/기초 ===')
  await fetchGyoAndBasic('H1', options, allLectures)

  console.log('=== Global Campus (H2) - 전공 ===')
  const globalDepts = await getDeptCodes('H2', options)
  await fetchCampusDepartments(globalDepts, 'H2', options, allLectures)

  console.log('=== Global Campus (H2) - 교양/기초 ===')
  await fetchGyoAndBasic('H2', options, allLectures)

  console.log(`Total: ${allLectures.length} lectures fetched`)
  return allLectures
}
