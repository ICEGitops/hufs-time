import { Router } from 'express'
import { getCrossMajorLectures } from '../models/course-metadata.js'

const router = Router()

// GET /api/metadata/cross-major?department=정보통신공학과
router.get('/cross-major', async (req, res, next) => {
  try {
    const { department } = req.query
    if (!department) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_DEPARTMENT', message: '학과를 지정해주세요.' }
      })
    }

    const lectures = await getCrossMajorLectures(department)
    res.json({
      success: true,
      data: lectures,
      meta: { total: lectures.length }
    })
  } catch (error) {
    next(error)
  }
})

export default router
