import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '../utils/api.js'
import { useUserSettingsStore } from './user-settings.js'

export const useLectureStore = defineStore('lectures', () => {
  const lectures = ref([])
  const departments = ref([])
  const loading = ref(false)
  const total = ref(0)
  const page = ref(1)
  const limit = ref(50)

  const userSettings = useUserSettingsStore()

  const filters = ref({
    gubun: '1',
    department: '',
    year: '',
    category: '',
    day: '',
    keyword: '',
    campus: userSettings.myCampus || 'H1'
  })

  // 학과 목록 로드
  async function fetchDepartments() {
    try {
      const params = {}
      if (filters.value.campus) params.campus = filters.value.campus
      const { data: res } = await api.get('/api/departments', { params })
      if (res.success) departments.value = res.data
    } catch (error) {
      console.error('Failed to fetch departments:', error)
    }
  }

  // 전공교류 강의 조회
  async function fetchCrossMajorLectures() {
    const dept = filters.value.department || userSettings.myDepartment
    if (!dept) {
      lectures.value = []
      total.value = 0
      return
    }

    loading.value = true
    page.value = 1
    try {
      const { data: res } = await api.get('/api/metadata/cross-major', {
        params: { department: dept }
      })
      if (res.success) {
        lectures.value = res.data.map(l => ({
          ...l,
          metadata: {
            isRequired: false,
            requiredNote: null,
            isCrossMajor: true,
            crossMajorNote: l.cross_note || null,
            crossMajorFrom: l.offering_department || null,
            isBanned: false
          }
        }))
        total.value = res.meta.total
      }
    } catch (error) {
      console.error('Failed to fetch cross-major lectures:', error)
      lectures.value = []
      total.value = 0
    } finally {
      loading.value = false
    }
  }

  // 강의 검색 (append=true이면 기존 결과에 추가)
  async function fetchLectures(newPage = 1) {
    // 전공교류 카테고리면 별도 API 호출
    if (filters.value.category === '전공교류') {
      return fetchCrossMajorLectures()
    }

    loading.value = true
    page.value = newPage

    try {
      const params = { page: newPage, limit: limit.value }
      if (filters.value.gubun) params.gubun = filters.value.gubun
      if (filters.value.department) params.department = filters.value.department
      if (filters.value.year) params.year = filters.value.year
      if (filters.value.category) params.category = filters.value.category
      if (filters.value.day) params.day = filters.value.day
      if (filters.value.keyword) params.keyword = filters.value.keyword

      if (userSettings.myDepartment) params.my_department = userSettings.myDepartment

      const { data: res } = await api.get('/api/lectures', { params })
      if (res.success) {
        let results = res.data
        let resultTotal = res.meta.total

        // "전체 구분" + 내 학과 설정 시, 교류 과목도 병합
        if (!filters.value.category && userSettings.myDepartment && newPage === 1) {
          try {
            const { data: crossRes } = await api.get('/api/metadata/cross-major', {
              params: { department: userSettings.myDepartment }
            })
            if (crossRes.success && crossRes.data.length > 0) {
              const existingIds = new Set(results.map(l => l.id))
              const crossOnly = crossRes.data
                .filter(l => !existingIds.has(l.id))
                .map(l => ({
                  ...l,
                  metadata: {
                    isRequired: false,
                    requiredNote: null,
                    isCrossMajor: true,
                    crossMajorNote: l.cross_note || null,
                    crossMajorFrom: l.offering_department || null,
                    isBanned: false
                  }
                }))
              results = [...results, ...crossOnly]
              resultTotal += crossOnly.length
            }
          } catch (e) {
            console.error('Failed to merge cross-major lectures:', e)
          }
        }

        if (newPage === 1) {
          lectures.value = results
        } else {
          lectures.value = [...lectures.value, ...results]
        }
        total.value = resultTotal
      }
    } catch (error) {
      console.error('Failed to fetch lectures:', error)
      if (newPage === 1) {
        lectures.value = []
        total.value = 0
      }
    } finally {
      loading.value = false
    }
  }

  const hasMore = computed(() => page.value * limit.value < total.value)

  function resetFilters() {
    const campus = filters.value.campus
    const gubun = filters.value.gubun
    filters.value = { gubun, department: '', year: '', category: '', day: '', keyword: '', campus }
  }

  return {
    lectures, departments, loading, total, page, limit, filters, hasMore,
    fetchDepartments, fetchLectures, resetFilters
  }
})
