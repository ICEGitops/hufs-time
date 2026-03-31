export function errorHandler(err, req, res, next) {
  console.error(`[ERROR] ${err.message}`, err.stack)

  const status = err.status || 500
  res.status(status).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: err.message || '서버 오류가 발생했습니다.'
    }
  })
}
