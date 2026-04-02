import { Router } from 'express'
import * as scraperService from '../services/scraper-service.js'

const router = Router()

// POST /api/scraper/run — 스크래핑 실행
router.post('/run', async (req, res, next) => {
  try {
    const { mode } = req.body || {}
    const result = await scraperService.runScrape({ mode })
    res.json({ success: true, data: result })
  } catch (error) {
    next(error)
  }
})

// GET /api/scraper/status — 최근 스크래핑 상태
router.get('/status', async (req, res, next) => {
  try {
    const logs = await scraperService.getScrapeStatus()
    res.json({ success: true, data: logs })
  } catch (error) {
    next(error)
  }
})

export default router
