import { Router } from 'express'
import * as lectureService from '../services/lecture-service.js'
import { getDatabase } from '../config/database.js'

const router = Router()

// GET /api/lectures/categories — gubun별 카테고리 목록
router.get('/categories', (req, res, next) => {
  try {
    const db = getDatabase()
    const { gubun } = req.query
    let query = 'SELECT DISTINCT category, gubun, COUNT(*) as cnt FROM lectures'
    const params = []
    if (gubun) {
      query += ' WHERE gubun = ?'
      params.push(gubun)
    }
    query += ' GROUP BY category, gubun ORDER BY cnt DESC'
    const rows = db.prepare(query).all(...params)
    res.json({ success: true, data: rows })
  } catch (error) {
    next(error)
  }
})

// GET /api/lectures/search — 키워드 통합 검색 (⚠️ :id보다 먼저 등록)
router.get('/search', (req, res, next) => {
  try {
    const { q, page, limit, my_department } = req.query
    const result = lectureService.searchLectures(q, page, limit, my_department)
    res.json({
      success: true,
      data: result.lectures,
      meta: { total: result.total, page: result.page, limit: result.limit }
    })
  } catch (error) {
    next(error)
  }
})

// GET /api/lectures — 전체 강의 목록 (필터링 + 페이지네이션)
router.get('/', (req, res, next) => {
  try {
    const result = lectureService.getLectures(req.query)
    res.json({
      success: true,
      data: result.lectures,
      meta: { total: result.total, page: result.page, limit: result.limit }
    })
  } catch (error) {
    next(error)
  }
})

// GET /api/lectures/:id — 단건 조회
router.get('/:id', (req, res, next) => {
  try {
    const lecture = lectureService.getLectureById(Number(req.params.id), req.query.my_department)
    res.json({ success: true, data: lecture })
  } catch (error) {
    next(error)
  }
})

export default router
