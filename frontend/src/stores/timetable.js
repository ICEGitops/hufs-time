import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const STORAGE_KEY = 'hufs-timetables'

export const useTimetableStore = defineStore('timetable', () => {
  const lectures = ref([])
  const currentName = ref('')

  // 총 학점
  const totalCredits = computed(() =>
    lectures.value.reduce((sum, l) => sum + (l.credit || 0), 0)
  )

  // 시간 충돌 검사
  function hasConflict(newLecture) {
    for (const existing of lectures.value) {
      for (const et of existing.times) {
        for (const nt of newLecture.times) {
          if (et.day_of_week === nt.day_of_week) {
            if (nt.start_time < et.end_time && nt.end_time > et.start_time) {
              return existing
            }
          }
        }
      }
    }
    return null
  }

  function addLecture(lecture) {
    if (lecture.metadata?.isBanned) {
      return { ok: false, reason: '해당 학과 학생은 이 교과목을 수강할 수 없습니다.' }
    }
    if (lectures.value.some(l => l.id === lecture.id)) {
      return { ok: false, reason: '이미 추가된 강의입니다.' }
    }
    const conflict = hasConflict(lecture)
    if (conflict) {
      return { ok: false, reason: `"${conflict.course_name}"과(와) 시간이 겹칩니다.` }
    }
    lectures.value.push(lecture)
    return { ok: true }
  }

  function removeLecture(lectureId) {
    lectures.value = lectures.value.filter(l => l.id !== lectureId)
  }

  function clear() {
    lectures.value = []
    currentName.value = ''
  }

  // --- LocalStorage 저장/불러오기/삭제 ---

  function _readAll() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    } catch {
      return {}
    }
  }

  function getSavedList() {
    const all = _readAll()
    return Object.entries(all).map(([name, data]) => ({
      name,
      lectureCount: data.lectures.length,
      totalCredits: data.lectures.reduce((s, l) => s + (l.credit || 0), 0),
      savedAt: data.savedAt
    })).sort((a, b) => (b.savedAt || '').localeCompare(a.savedAt || ''))
  }

  function save(name) {
    if (!name || !name.trim()) return false
    const trimmed = name.trim()
    const all = _readAll()
    all[trimmed] = {
      lectures: lectures.value,
      savedAt: new Date().toISOString()
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
    currentName.value = trimmed
    return true
  }

  function load(name) {
    const all = _readAll()
    const data = all[name]
    if (!data) return false
    lectures.value = data.lectures || []
    currentName.value = name
    return true
  }

  function deleteSaved(name) {
    const all = _readAll()
    delete all[name]
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
    if (currentName.value === name) currentName.value = ''
  }

  function getSavedLectures(name) {
    const all = _readAll()
    return all[name]?.lectures || []
  }

  return {
    lectures, currentName, totalCredits,
    hasConflict, addLecture, removeLecture, clear,
    getSavedList, save, load, deleteSaved, getSavedLectures
  }
})
