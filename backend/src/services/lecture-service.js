import * as lectureModel from '../models/lecture.js'
import * as courseMetadata from '../models/course-metadata.js'

export async function getLectures(query = {}) {
  const page = Math.max(1, parseInt(query.page) || 1)
  const limit = Math.min(Math.max(1, parseInt(query.limit) || 50), 100)

  const result = await lectureModel.findAll({
    department: query.department || undefined,
    year: query.year || undefined,
    category: query.category || undefined,
    day: query.day || undefined,
    keyword: query.keyword || undefined,
    gubun: query.gubun || undefined,
    page,
    limit
  })

  if (query.my_department) {
    result.lectures = await annotateMetadata(result.lectures, query.my_department)
  }

  return result
}

export async function getLectureById(id, myDepartment) {
  const lecture = await lectureModel.findById(id)
  if (!lecture) {
    const error = new Error('해당 강의를 찾을 수 없습니다.')
    error.status = 404
    error.code = 'LECTURE_NOT_FOUND'
    throw error
  }

  if (myDepartment) {
    return (await annotateMetadata([lecture], myDepartment))[0]
  }
  return lecture
}

export async function searchLectures(q, page = 1, limit = 50, myDepartment) {
  page = Math.max(1, parseInt(page) || 1)
  limit = Math.min(Math.max(1, parseInt(limit) || 50), 100)

  if (!q || q.trim() === '') {
    return { lectures: [], total: 0, page, limit }
  }

  const result = await lectureModel.search(q.trim(), page, limit)

  if (myDepartment) {
    result.lectures = await annotateMetadata(result.lectures, myDepartment)
  }

  return result
}

async function annotateMetadata(lectures, department) {
  const { requiredList, crossMajor, banned } = await courseMetadata.getAllMetadata(department)

  return lectures.map(lecture => {
    const reqMatch = courseMetadata.matchRequired(lecture.course_code, requiredList)
    const crossInfo = crossMajor.get(lecture.course_name)
    const isBanned = banned.has(lecture.course_name)

    return {
      ...lecture,
      metadata: {
        isRequired: !!reqMatch,
        requiredNote: reqMatch?.note || null,
        isCrossMajor: !!crossInfo,
        crossMajorNote: crossInfo?.note || null,
        crossMajorFrom: crossInfo?.offering_department || null,
        isBanned
      }
    }
  })
}
