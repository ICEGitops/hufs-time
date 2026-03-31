import Database from 'better-sqlite3'
import { readFileSync } from 'fs'
import path from 'path'

const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), 'data', 'timetable.db')

let db

export function getDatabase() {
  if (!db) {
    db = new Database(DB_PATH)
    db.pragma('journal_mode = WAL')
    db.pragma('foreign_keys = ON')
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
  runMigrations(database)
  console.log('Database initialized')
}

function runMigrations(database) {
  // departments 테이블에 campus 컬럼 추가 + UNIQUE 제약 변경
  const columns = database.pragma('table_info(departments)')
  const hasCampus = columns.some(col => col.name === 'campus')
  if (!hasCampus) {
    // FK 제약 임시 해제 후 테이블 재구성
    database.pragma('foreign_keys = OFF')
    database.exec(`
      DROP TABLE IF EXISTS departments_new;
      CREATE TABLE departments_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        college TEXT,
        campus TEXT DEFAULT 'H1',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(name, campus)
      );
      INSERT INTO departments_new (id, name, college, created_at)
        SELECT id, name, college, created_at FROM departments;
      DROP TABLE departments;
      ALTER TABLE departments_new RENAME TO departments;
    `)
    database.pragma('foreign_keys = ON')
    console.log('Migration: rebuilt departments table with campus column')
  }

  // lectures 테이블에 gubun 컬럼 추가
  const lecCols = database.pragma('table_info(lectures)')
  const hasGubun = lecCols.some(col => col.name === 'gubun')
  if (!hasGubun) {
    database.exec("ALTER TABLE lectures ADD COLUMN gubun TEXT DEFAULT '1'")
    database.exec('CREATE INDEX IF NOT EXISTS idx_lectures_gubun ON lectures(gubun)')
    console.log('Migration: added gubun column to lectures')
  }
}
