# 04 - 데이터베이스 규칙 (SQLite)

## 드라이버
- **better-sqlite3** 사용 (동기 API, Node.js에서 가장 빠름)
- sqlite3 패키지 사용하지 않음

## DB 파일 위치
- 개발: `backend/data/timetable.db`
- 배포: `/app/data/timetable.db` (Docker 컨테이너 내부)
- `.gitignore`에 `*.db` 추가

## 스키마 (schema.sql)

```sql
-- 학과 테이블
CREATE TABLE IF NOT EXISTS departments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,          -- 학과명 (예: 정보통신공학과)
  college TEXT,                        -- 단과대학 (예: 공과대학)
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 강의 테이블
CREATE TABLE IF NOT EXISTS lectures (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  course_code TEXT NOT NULL,           -- 과목코드
  course_name TEXT NOT NULL,           -- 과목명
  professor TEXT,                      -- 교수명
  credit INTEGER DEFAULT 3,           -- 학점
  category TEXT,                       -- 구분 (전공필수/전공선택/교양 등)
  year_level INTEGER,                  -- 대상학년 (1,2,3,4)
  department_id INTEGER,               -- 소속 학과 FK
  capacity INTEGER,                    -- 수강 정원
  enrolled INTEGER DEFAULT 0,          -- 현재 수강 인원
  note TEXT,                           -- 비고
  semester TEXT,                        -- 학기 (예: 2025-1)
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (department_id) REFERENCES departments(id)
);

-- 강의 시간 테이블 (1강의 = N개의 시간 슬롯)
CREATE TABLE IF NOT EXISTS lecture_times (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lecture_id INTEGER NOT NULL,
  day_of_week TEXT NOT NULL,           -- 월,화,수,목,금
  start_time TEXT NOT NULL,            -- HH:MM (예: 09:00)
  end_time TEXT NOT NULL,              -- HH:MM (예: 10:30)
  room TEXT,                           -- 강의실 (예: 공학관 301)
  FOREIGN KEY (lecture_id) REFERENCES lectures(id) ON DELETE CASCADE
);

-- 스크래핑 로그
CREATE TABLE IF NOT EXISTS scrape_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  status TEXT DEFAULT 'running',       -- running, success, failed
  total_count INTEGER DEFAULT 0,
  error_message TEXT
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_lectures_department ON lectures(department_id);
CREATE INDEX IF NOT EXISTS idx_lectures_category ON lectures(category);
CREATE INDEX IF NOT EXISTS idx_lectures_year ON lectures(year_level);
CREATE INDEX IF NOT EXISTS idx_lectures_semester ON lectures(semester);
CREATE INDEX IF NOT EXISTS idx_lecture_times_lecture ON lecture_times(lecture_id);
CREATE INDEX IF NOT EXISTS idx_lecture_times_day ON lecture_times(day_of_week);
```

## DB 초기화

```js
// config/database.js
import Database from 'better-sqlite3'
import { readFileSync } from 'fs'
import path from 'path'

const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), 'data', 'timetable.db')

let db

export function getDatabase() {
  if (!db) {
    db = new Database(DB_PATH)
    db.pragma('journal_mode = WAL')      // 성능 향상
    db.pragma('foreign_keys = ON')        // FK 제약 활성화
  }
  return db
}

export function initDatabase() {
  const database = getDatabase()
  const schema = readFileSync(
    path.join(process.cwd(), 'src', 'db', 'schema.sql'),
    'utf-8'
  )
  database.exec(schema)
  console.log('Database initialized')
}
```

## 쿼리 작성 규칙

### 반드시 Prepared Statement 사용
```js
// ✅ 올바른 방법
const stmt = db.prepare('SELECT * FROM lectures WHERE department_id = ?')
const lectures = stmt.all(departmentId)

// ❌ 절대 금지 (SQL Injection 취약)
const lectures = db.exec(`SELECT * FROM lectures WHERE department_id = ${departmentId}`)
```

### 트랜잭션 사용
```js
// 여러 INSERT를 한 번에 처리할 때
const insertMany = db.transaction((lectures) => {
  const stmt = db.prepare('INSERT INTO lectures (...) VALUES (...)')
  for (const lecture of lectures) {
    stmt.run(lecture)
  }
})
insertMany(lectureArray)
```

### 페이지네이션
```js
// LIMIT + OFFSET 패턴
const page = parseInt(req.query.page) || 1
const limit = Math.min(parseInt(req.query.limit) || 50, 100) // 최대 100
const offset = (page - 1) * limit

const lectures = db.prepare(
  'SELECT * FROM lectures LIMIT ? OFFSET ?'
).all(limit, offset)

const total = db.prepare(
  'SELECT COUNT(*) as count FROM lectures'
).get().count
```

## 데이터 유실 대비
- SQLite는 컨테이너 재시작 시 유실될 수 있음
- 스크래퍼를 통해 언제든 재수집 가능하도록 설계
- 사용자 시간표 데이터는 프론트엔드 LocalStorage에 저장
- 서버에는 강의 데이터만 저장 (유실되어도 재수집 가능)
