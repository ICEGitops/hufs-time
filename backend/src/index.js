import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { initDatabase } from './config/database.js'
import lectureRoutes from './routes/lectures.js'
import departmentRoutes from './routes/departments.js'
import scraperRoutes from './routes/scraper.js'
import metadataRoutes from './routes/metadata.js'
import { errorHandler } from './middleware/error-handler.js'

const app = express()
const PORT = process.env.PORT || 8080
const BASE_PATH = process.env.BASE_PATH || ''

// 미들웨어
app.use(helmet())
app.use(cors())
app.use(express.json())

// Health check
app.get(`${BASE_PATH}/api/health`, (req, res) => {
  res.json({ success: true, data: { status: 'ok' } })
})

// 라우트
app.use(`${BASE_PATH}/api/lectures`, lectureRoutes)
app.use(`${BASE_PATH}/api/departments`, departmentRoutes)
app.use(`${BASE_PATH}/api/scraper`, scraperRoutes)
app.use(`${BASE_PATH}/api/metadata`, metadataRoutes)

// 에러 핸들러
app.use(errorHandler)

// DB 초기화 후 서버 시작
initDatabase()
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
