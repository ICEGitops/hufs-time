import { Router } from 'express'
import * as departmentService from '../services/department-service.js'

const router = Router()

// GET /api/departments — 학과 목록
router.get('/', async (req, res, next) => {
  try {
    const departments = await departmentService.getDepartments(req.query.campus)
    res.json({ success: true, data: departments })
  } catch (error) {
    next(error)
  }
})

export default router
