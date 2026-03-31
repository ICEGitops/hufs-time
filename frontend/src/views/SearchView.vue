<script setup>
import { ref, onMounted } from 'vue'
import { useLectureStore } from '../stores/lectures.js'
import { useTimetableStore } from '../stores/timetable.js'
import { useLectureSearch } from '../composables/useLectureSearch.js'
import FilterBar from '../components/FilterBar.vue'
import LectureCard from '../components/LectureCard.vue'

const lectureStore = useLectureStore()
const timetableStore = useTimetableStore()
const { onKeywordChange, onFilterChange, loadMore } = useLectureSearch()

const keyword = ref('')
const toast = ref('')
let toastTimer = null

function onInput(e) {
  keyword.value = e.target.value
  onKeywordChange(keyword.value)
}

function handleAdd(lecture) {
  const result = timetableStore.addLecture(lecture)
  if (!result.ok) {
    toast.value = result.reason
    clearTimeout(toastTimer)
    toastTimer = setTimeout(() => { toast.value = '' }, 2500)
  }
}

onMounted(() => {
  lectureStore.fetchDepartments()
  if (lectureStore.lectures.length === 0) lectureStore.fetchLectures(1)
})
</script>

<template>
  <div>
    <h1 class="text-xl sm:text-2xl font-bold text-hufs-navy mb-5">강의 검색</h1>

    <!-- 검색 + 필터 -->
    <div class="bg-white rounded-2xl shadow-card border border-gray-100 p-4 mb-4">
      <div class="relative mb-3">
        <input
          :value="keyword"
          type="text"
          placeholder="과목명, 교수명으로 검색..."
          class="w-full pl-10 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl
                 bg-hufs-pale/50 placeholder-gray-300
                 focus:outline-none focus:ring-2 focus:ring-hufs-sky/30 focus:border-hufs-sky focus:bg-white
                 transition-all"
          @input="onInput"
        />
        <svg class="absolute left-3 top-3 w-4 h-4 text-gray-300" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" stroke-linecap="round" />
        </svg>
      </div>
      <FilterBar @change="onFilterChange" />
    </div>

    <!-- 결과 카운트 -->
    <div class="flex items-center justify-between mb-3 px-1">
      <span class="text-sm text-gray-400">
        검색 결과 <strong class="text-hufs-blue">{{ lectureStore.total }}</strong>건
      </span>
      <span v-if="lectureStore.loading" class="text-xs text-hufs-sky">
        <svg class="inline w-3 h-3 animate-spin mr-1" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24">
          <path d="M12 2a10 10 0 0110 10" stroke-linecap="round" />
        </svg>
        로딩 중
      </span>
    </div>

    <!-- 결과 그리드 -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      <!-- 스켈레톤 -->
      <template v-if="lectureStore.loading && lectureStore.lectures.length === 0">
        <div v-for="n in 6" :key="n" class="p-3 rounded-xl border border-gray-50 bg-white">
          <div class="skeleton h-4 w-3/4 mb-2" />
          <div class="skeleton h-3 w-1/2 mb-1.5" />
          <div class="skeleton h-3 w-2/3" />
        </div>
      </template>

      <TransitionGroup v-else name="lecture-list">
        <LectureCard
          v-for="lec in lectureStore.lectures"
          :key="lec.id"
          :lecture="lec"
          @add="handleAdd"
        />
      </TransitionGroup>
    </div>

    <!-- 빈 상태 -->
    <div v-if="!lectureStore.loading && lectureStore.lectures.length === 0" class="text-center py-16">
      <svg class="w-10 h-10 mx-auto mb-2 text-gray-200" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.2-5.2M10 18a8 8 0 100-16 8 8 0 000 16z" />
      </svg>
      <p class="text-sm text-gray-300 font-medium">검색 결과가 없습니다</p>
    </div>

    <!-- 더 보기 -->
    <div v-if="lectureStore.hasMore && !lectureStore.loading" class="text-center mt-4">
      <button
        class="px-6 py-2.5 text-sm font-semibold rounded-xl
               border border-gray-200 text-hufs-blue hover:bg-hufs-pale transition-all"
        @click="loadMore"
      >
        더 보기
      </button>
    </div>

    <!-- 토스트 -->
    <Transition name="page">
      <div
        v-if="toast"
        class="fixed bottom-6 left-1/2 -translate-x-1/2 z-50
               bg-red-500 text-white text-sm px-5 py-2.5 rounded-xl shadow-lg font-medium
               animate-slide-up"
      >
        {{ toast }}
      </div>
    </Transition>
  </div>
</template>
