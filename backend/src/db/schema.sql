-- 학과 테이블
CREATE TABLE IF NOT EXISTS departments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  college TEXT,
  campus TEXT DEFAULT 'H1',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(name, campus)
);

-- 강의 테이블
CREATE TABLE IF NOT EXISTS lectures (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  course_code TEXT NOT NULL,
  course_name TEXT NOT NULL,
  professor TEXT,
  credit INTEGER DEFAULT 3,
  category TEXT,
  year_level INTEGER,
  department_id INTEGER,
  capacity INTEGER,
  enrolled INTEGER DEFAULT 0,
  note TEXT,
  semester TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (department_id) REFERENCES departments(id)
);

-- 강의 시간 테이블
CREATE TABLE IF NOT EXISTS lecture_times (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lecture_id INTEGER NOT NULL,
  day_of_week TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  room TEXT,
  FOREIGN KEY (lecture_id) REFERENCES lectures(id) ON DELETE CASCADE
);

-- 스크래핑 로그
CREATE TABLE IF NOT EXISTS scrape_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  status TEXT DEFAULT 'running',
  total_count INTEGER DEFAULT 0,
  error_message TEXT
);

-- 전공필수 교과목 (수강유의 Sheet II)
CREATE TABLE IF NOT EXISTS required_courses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  department TEXT NOT NULL,
  major_code TEXT,
  course_code TEXT NOT NULL,
  course_name TEXT,
  note TEXT
);

-- 전공교류 교과목 (수강유의 Sheet III)
CREATE TABLE IF NOT EXISTS cross_major_courses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  receiving_department TEXT NOT NULL,
  offering_department TEXT,
  course_name TEXT NOT NULL,
  note TEXT
);

-- 수강금지 교양 교과목 (수강유의 Sheet IV)
CREATE TABLE IF NOT EXISTS banned_courses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  department TEXT NOT NULL,
  course_name TEXT NOT NULL
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_lectures_department ON lectures(department_id);
CREATE INDEX IF NOT EXISTS idx_lectures_category ON lectures(category);
CREATE INDEX IF NOT EXISTS idx_lectures_year ON lectures(year_level);
CREATE INDEX IF NOT EXISTS idx_lectures_semester ON lectures(semester);
CREATE INDEX IF NOT EXISTS idx_lecture_times_lecture ON lecture_times(lecture_id);
CREATE INDEX IF NOT EXISTS idx_lecture_times_day ON lecture_times(day_of_week);
CREATE INDEX IF NOT EXISTS idx_required_dept ON required_courses(department);
CREATE INDEX IF NOT EXISTS idx_required_code ON required_courses(course_code);
CREATE INDEX IF NOT EXISTS idx_cross_major_recv ON cross_major_courses(receiving_department);
CREATE INDEX IF NOT EXISTS idx_cross_major_name ON cross_major_courses(course_name);
CREATE INDEX IF NOT EXISTS idx_banned_dept ON banned_courses(department);
CREATE INDEX IF NOT EXISTS idx_banned_name ON banned_courses(course_name);
