import { readFileSync, existsSync } from 'fs'
import path from 'path'
import { initDatabase, getDatabase } from '../config/database.js'

function seedMetadata() {
  initDatabase()
  const db = getDatabase()
  const dataDir = path.join(process.cwd(), 'data')

  const requiredPath = path.join(dataDir, 'required-courses.json')
  const crossMajorPath = path.join(dataDir, 'cross-major-courses.json')
  const bannedPath = path.join(dataDir, 'banned-courses.json')

  for (const p of [requiredPath, crossMajorPath, bannedPath]) {
    if (!existsSync(p)) {
      console.error(`File not found: ${p}`)
      console.error('Run "npm run parse-xls" first')
      process.exit(1)
    }
  }

  const required = JSON.parse(readFileSync(requiredPath, 'utf-8'))
  const crossMajor = JSON.parse(readFileSync(crossMajorPath, 'utf-8'))
  const banned = JSON.parse(readFileSync(bannedPath, 'utf-8'))

  const insertRequired = db.prepare(`
    INSERT INTO required_courses (department, major_code, course_code, course_name, note)
    VALUES (?, ?, ?, ?, ?)
  `)
  const insertCrossMajor = db.prepare(`
    INSERT INTO cross_major_courses (receiving_department, offering_department, course_name, note)
    VALUES (?, ?, ?, ?)
  `)
  const insertBanned = db.prepare(`
    INSERT INTO banned_courses (department, course_name) VALUES (?, ?)
  `)

  const doSeed = db.transaction(() => {
    db.exec('DELETE FROM required_courses')
    db.exec('DELETE FROM cross_major_courses')
    db.exec('DELETE FROM banned_courses')

    for (const r of required) {
      insertRequired.run(r.department, r.major_code, r.course_code, r.course_name, r.note)
    }

    for (const c of crossMajor) {
      insertCrossMajor.run(c.receiving_department, c.offering_department, c.course_name, c.note)
    }

    for (const b of banned) {
      insertBanned.run(b.department, b.course_name)
    }
  })

  doSeed()

  // 검증
  const rCount = db.prepare('SELECT COUNT(*) as cnt FROM required_courses').get().cnt
  const cCount = db.prepare('SELECT COUNT(*) as cnt FROM cross_major_courses').get().cnt
  const bCount = db.prepare('SELECT COUNT(*) as cnt FROM banned_courses').get().cnt

  console.log(`Metadata seeded:`)
  console.log(`  required_courses: ${rCount}`)
  console.log(`  cross_major_courses: ${cCount}`)
  console.log(`  banned_courses: ${bCount}`)

  // 샘플
  const reqDepts = db.prepare('SELECT DISTINCT department FROM required_courses LIMIT 5').all()
  console.log(`\nRequired course departments (sample): ${reqDepts.map(d => d.department).join(', ')}`)

  const crossDepts = db.prepare('SELECT DISTINCT receiving_department FROM cross_major_courses LIMIT 5').all()
  console.log(`Cross-major departments (sample): ${crossDepts.map(d => d.receiving_department).join(', ')}`)

  const banDepts = db.prepare('SELECT DISTINCT department FROM banned_courses LIMIT 5').all()
  console.log(`Banned course departments (sample): ${banDepts.map(d => d.department).join(', ')}`)

  db.close()
}

seedMetadata()
