# 05 - 스크래퍼 규칙 (HUFS 강의 데이터 수집) — 실제 API 분석 완료

## 실제 API 구조 (2026년 3월 분석)

### 엔드포인트
```
POST https://wis.hufs.ac.kr/hufs
Content-Type: application/x-www-form-urlencoded
```

### 요청 파라미터
| 파라미터 | 설명 | 값 예시 |
|---------|------|--------|
| `mName` | 메서드명 (고정) | `getDataLssnLista` |
| `cName` | 클래스명 (고정) | `hufs.stu1.STU1_C009` |
| `org_sect` | 소속 구분 | `A` (학부) |
| `ledg_year` | 연도 | `2026` |
| `ledg_sessn` | 학기 | `1` (1학기), `2` (여름), `3` (2학기), `4` (겨울) |
| `campus` | 캠퍼스 | `H1` (서울), `H2` (글로벌) |
| `crs_strct_cd` | 학과/전공 코드 | `A0A01` |
| `gubun` | 구분 | `1` (전공), `2` (교양), `3` (기초) |
| `subjt_nm` | 교과목명 검색 | `""` (빈 문자열 = 전체) |
| `won` | 원어강의 필터 | `""` 또는 `"Y"` |
| `cyber` | 온라인 필터 | `""` 또는 `"Y"` |
| `emp_nm` | 교수명 검색 | `""` (빈 문자열 = 전체) |
| `d1`~`d6` | 요일 필터 (월~토) | `"N"` |
| `t1`~`t12` | 교시 필터 (1~12교시) | `"N"` |

### 응답 구조 (URL-encoded JSON)
응답은 `encodeURIComponent`로 인코딩된 JSON 문자열.
`decodeURIComponent()` 후 `JSON.parse()` 필요.

```json
{
  "dataCount": "15",
  "data": [
    {
      "comptFldNm": "전공선택",
      "comptFldNaEng": "Elective",
      "dstGrad": "3",
      "lssnCd": "G01234",
      "subjtNaKr": "데이터구조",
      "subjtNaEng": "Data Structures",
      "empNm": "홍길동",
      "empNmEng": "Hong Gildong",
      "unitNum": "3",
      "realLssnNum": "3",
      "dayTimeDisplay": "월5,6(본305) 수5(본305)",
      "dayTimeDisplayE": "Mon5,6(Main305) Wed5(Main305)",
      "lectrOffrNo": "45",
      "lectrConstNo": "50",
      "etc": "",
      "encessFlag": "N",
      "cyberFlag": "N",
      "wongangFlag": "N",
      "syllabusFlag": "Y",
      "eval": "0",
      "lang": "",
      "ttFlag": "",
      "ledgYear": "2026",
      "ledgSessn": "1",
      "orgSect": "A",
      "crsStrctCd": "A0A01",
      "crsNm": "Language & AI융합전공",
      "basketCnt": "12",
      "preFlag": "Y"
    }
  ]
}
```

### ⚠️ dataCount 분기 처리 (매우 중요!)
- `"0"` → 결과 없음
- `"1"` → **data가 배열이 아닌 단일 객체!**
- `"2"` 이상 → data가 배열

```js
function normalizeData(obj) {
  if (obj.dataCount === '0') return []
  if (obj.dataCount === '1') return [obj.data]
  return obj.data
}
```

---

## 학과 코드 목록 (서울캠퍼스, 학부, 70개)

```json
[
  {"value":"A4AB2","text":"Business & AI 전공"},
  {"value":"A1CG1","text":"ELLT학과"},
  {"value":"AAQ01","text":"EU전공"},
  {"value":"AAMB1","text":"FATI전공"},
  {"value":"A5A","text":"KFL학부"},
  {"value":"A0A01","text":"Language & AI융합전공"},
  {"value":"AKAA1","text":"Language & Diplomacy전공"},
  {"value":"AKA","text":"Language & Diplomacy학부"},
  {"value":"A2AA1","text":"Language & Trade전공"},
  {"value":"A2A","text":"Language & Trade학부"},
  {"value":"A0B01","text":"Social Science & AI융합전공"},
  {"value":"ALAA1","text":"경영학전공"},
  {"value":"AEC","text":"경제학부"},
  {"value":"AECA1","text":"경제학전공"},
  {"value":"ACDD1","text":"광고·PR·브랜딩전공"},
  {"value":"AFF01","text":"교육학"},
  {"value":"ACAI1","text":"국가리더전공"},
  {"value":"AEAA1","text":"국제통상학과"},
  {"value":"AGA","text":"국제학부"},
  {"value":"AGAA1","text":"국제학전공"},
  {"value":"AAH01","text":"네덜란드어과"},
  {"value":"AAD01","text":"노어과"},
  {"value":"AAC01","text":"독일어과"},
  {"value":"ABP02","text":"동북아외교통상전공"},
  {"value":"ABC01","text":"말레이.인도네시아어과"},
  {"value":"ABJ01","text":"몽골어과"},
  {"value":"ANDD2","text":"문화콘텐츠학전공"},
  {"value":"ACD","text":"미디어커뮤니케이션학부"},
  {"value":"ACDE1","text":"방송·영상·뉴미디어전공"},
  {"value":"ABF01","text":"베트남어과"}
]
```
> 나머지 40개는 페이지 select에서 동적 수집 또는 하드코딩 추가

---

## 소속 구분 코드

| 코드 | 명칭 |
|------|------|
| A | 학부 |
| B | 대학원 |
| D | 통번역대학원 |
| E | 교육대학원 |
| G | 글로벌공공리더십대학원 |
| H | 국제지역대학원 |
| I | 경영대학원(주간) |
| J | 경영대학원(야간) |
| L | 법학전문대학원 |
| M | TESOL대학원 |
| T | TESOL 전문교육원 |
| U | KFL대학원 |
| V | 글로벌미디어커뮤니케이션대학원 |

---

## 스크래핑 구현 예시

```js
import axios from 'axios'

const BASE_URL = 'https://wis.hufs.ac.kr/hufs'

async function fetchLectures(deptCode, year = '2026', sessn = '1') {
  const params = new URLSearchParams({
    mName: 'getDataLssnLista',
    cName: 'hufs.stu1.STU1_C009',
    org_sect: 'A',
    ledg_year: year,
    ledg_sessn: sessn,
    campus: 'H1',
    crs_strct_cd: deptCode,
    gubun: '1',
    subjt_nm: '',
    won: '',
    cyber: '',
    emp_nm: '',
    d1: 'N', d2: 'N', d3: 'N', d4: 'N', d5: 'N', d6: 'N',
    t1: 'N', t2: 'N', t3: 'N', t4: 'N', t5: 'N', t6: 'N',
    t7: 'N', t8: 'N', t9: 'N', t10: 'N', t11: 'N', t12: 'N'
  })

  const response = await axios.post(BASE_URL, params.toString(), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  })

  const decoded = decodeURIComponent(response.data)
  const obj = JSON.parse(decoded)

  // dataCount 분기 처리
  if (obj.dataCount === '0') return []
  if (obj.dataCount === '1') return [obj.data]
  return obj.data
}
```

---

## dayTimeDisplay 파싱

### 형식 예시
```
"월5,6(본305) 수5(본305)"
"화1,2,3(공B04)"
"목7,8,9(본215)"
```

### 정규식
```js
/([월화수목금토])([0-9A-C,]+)(?:\(([^)]+)\))?/g
```

### 교시 → 시간 매핑
```
1: 09:00~09:50    7: 15:00~15:50
2: 10:00~10:50    8: 16:00~16:50
3: 11:00~11:50    9: 17:00~17:50
4: 12:00~12:50   10: 18:00~18:50
5: 13:00~13:50   11: 19:00~19:50
6: 14:00~14:50   12: 20:00~20:50
```

---

## 주의사항
- 요청 간 **1~2초 딜레이** 필수
- 동시 요청 금지 (순차 처리)
- lssnCd가 여러 학과에서 중복 가능 → UPSERT 사용
- dataCount="1" 일 때 data가 배열이 아닌 단일 객체인 점 반드시 처리
