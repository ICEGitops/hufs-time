# 03 - 백엔드 규칙 (Express.js)

## 기술 스택
- Node.js 20+
- Express.js 4
- better-sqlite3 (SQLite 드라이버)
- cors, helmet (보안)
- cheerio + axios (스크래핑)

## 아키텍처

### 레이어 구조
```
Route (라우터) → Service (비즈니스 로직) → Model (DB 접근)
```
- Route: HTTP 요청 수신, 파라미터 검증, 응답 포맷팅
- Service: 비즈니스 로직 처리
- Model: SQL 쿼리 실행, 데이터 변환

### 디렉토리 구조
```
backend/src/
├── index.js           # 앱 시작점
├── config/
│   └── database.js    # DB 연결 및 초기화
├── routes/            # Express 라우터
├── services/          # 비즈니스 로직
├── models/            # DB 쿼리 함수
├── scraper/           # 크롤러
├── middleware/         # 공통 미들웨어
└── db/
    └── schema.sql     # DDL
```

## Express 설정

### 앱 초기화 (index.js)
```js
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { initDatabase } from './config/database.js'
import lectureRoutes from './routes/lectures.js'
import departmentRoutes from './routes/departments.js'
import scraperRoutes from './routes/scraper.js'
import { errorHandler } from './middleware/errorHandler.js'

const app = express()
const PORT = process.env.PORT || 8080
const BASE_PATH = process.env.BASE_PATH || ''

// 미들웨어
app.use(helmet())
app.use(cors())
app.use(express.json())

// 라우트 (BASE_PATH prefix 적용)
app.use(`${BASE_PATH}/api/lectures`, lectureRoutes)
app.use(`${BASE_PATH}/api/departments`, departmentRoutes)
app.use(`${BASE_PATH}/api/scraper`, scraperRoutes)

// 에러 핸들러 (항상 마지막)
app.use(errorHandler)

// DB 초기화 후 서버 시작
initDatabase()
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
```

## API 응답 형식

### 성공 응답
```json
{
  "success": true,
  "data": [ ... ],
  "meta": {
    "total": 150,
    "page": 1,
    "limit": 50
  }
}
```

### 에러 응답
```json
{
  "success": false,
  "error": {
    "code": "LECTURE_NOT_FOUND",
    "message": "해당 강의를 찾을 수 없습니다."
  }
}
```

## 에러 처리

### 중앙 에러 핸들러
```js
// middleware/errorHandler.js
export function errorHandler(err, req, res, next) {
  console.error(`[ERROR] ${err.message}`, err.stack)
  
  const status = err.status || 500
  res.status(status).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: err.message || '서버 오류가 발생했습니다.'
    }
  })
}
```

### 라우트에서 에러 전파
```js
// 항상 try-catch + next(error)
router.get('/', async (req, res, next) => {
  try {
    const lectures = lectureService.getAll(req.query)
    res.json({ success: true, data: lectures })
  } catch (error) {
    next(error)
  }
})
```

## 모듈 시스템
- ESM 사용 (`"type": "module"` in package.json)
- import/export 구문 사용 (require 사용 금지)

## 배포 시 Base Path
- 환경변수 `BASE_PATH=/hufs-timetable-back` 으로 설정
- 모든 라우트에 prefix 적용
- 로컬 개발 시에는 빈 문자열

## CORS 설정
- 개발: 모든 origin 허용
- 배포: `https://iceweb.hufs.ac.kr` 만 허용

## 보안
- helmet 기본 설정 적용
- SQL Injection 방지: prepared statement만 사용 (문자열 보간 SQL 금지)
- Rate limiting: express-rate-limit 적용 (스크래퍼 엔드포인트에 특히)
