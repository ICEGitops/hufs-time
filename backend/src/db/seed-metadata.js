import { readFileSync, existsSync } from 'fs'
import path from 'path'
import { initDatabase, withTransaction, getOne, getAll, closePool } from '../config/database.js'

async function seedMetadata() {
  await initDatabase()
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

  await withTransaction(async (client) => {
    await client.query('DELETE FROM required_courses')
    await client.query('DELETE FROM cross_major_courses')
    await client.query('DELETE FROM banned_courses')

    for (const r of required) {
      await client.query(
        'INSERT INTO required_courses (department, major_code, course_code, course_name, note) VALUES ($1, $2, $3, $4, $5)',
        [r.department, r.major_code, r.course_code, r.course_name, r.note]
      )
    }

    for (const c of crossMajor) {
      await client.query(
        'INSERT INTO cross_major_courses (receiving_department, offering_department, course_name, note) VALUES ($1, $2, $3, $4)',
        [c.receiving_department, c.offering_department, c.course_name, c.note]
      )
    }

    for (const b of banned) {
      await client.query(
        'INSERT INTO banned_courses (department, course_name) VALUES ($1, $2)',
        [b.department, b.course_name]
      )
    }
  })

  const rCount = await getOne('SELECT COUNT(*) as cnt FROM required_courses')
  const cCount = await getOne('SELECT COUNT(*) as cnt FROM cross_major_courses')
  const bCount = await getOne('SELECT COUNT(*) as cnt FROM banned_courses')

  console.log(`Metadata seeded:`)
  console.log(`  required_courses: ${rCount.cnt}`)
  console.log(`  cross_major_courses: ${cCount.cnt}`)
  console.log(`  banned_courses: ${bCount.cnt}`)

  const reqDepts = await getAll('SELECT DISTINCT department FROM required_courses LIMIT 5')
  console.log(`\nRequired course departments (sample): ${reqDepts.map(d => d.department).join(', ')}`)

  const crossDepts = await getAll('SELECT DISTINCT receiving_department FROM cross_major_courses LIMIT 5')
  console.log(`Cross-major departments (sample): ${crossDepts.map(d => d.receiving_department).join(', ')}`)

  const banDepts = await getAll('SELECT DISTINCT department FROM banned_courses LIMIT 5')
  console.log(`Banned course departments (sample): ${banDepts.map(d => d.department).join(', ')}`)

  await closePool()
}

seedMetadata().catch(err => {
  console.error(err)
  process.exit(1)
})
