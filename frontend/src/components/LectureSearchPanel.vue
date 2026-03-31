<script setup>
import { ref, onMounted } from 'vue'
import { useLectureStore } from '../stores/lectures.js'
import { useTimetableStore } from '../stores/timetable.js'
import { useLectureSearch } from '../composables/useLectureSearch.js'
import FilterBar from './FilterBar.vue'
import LectureCard from './LectureCard.vue'

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
  if (!result.ok) showToast(result.reason)
}

function showToast(msg) {
  toast.value = msg
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toast.value = '' }, 2500)
}

onMounted(() => {
  lectureStore.fetchDepartments()
  lectureStore.fetchLectures(1)
})
</script>

<template>
  <div class="flex flex-col h-full bg-white rounded-2xl shadow-card border border-gray-100 relative">
    <!-- 헤더 -->
    <div class="p-3 pb-2 border-b border-gray-100">
      <!-- 검색 입력 -->
      <div class="relative mb-2">
        <input
          :value="keyword"
          type="text"
          placeholder="과목명 또는 교수명..."
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

      <!-- 필터 -->
      <FilterBar @change="onFilterChange" />
    </div>

    <!-- 결과 카운트 -->
    <div class="px-4 py-2 text-xs text-gray-400 border-b border-gray-50 bg-hufs-pale/30 flex justify-between">
      <span>
        검색 결과 <strong class="text-hufs-blue">{{ lectureStore.total }}</strong>건
      </span>
      <span v-if="lectureStore.loading" class="text-hufs-sky">
        <svg class="inline w-3 h-3 animate-spin mr-1" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24">
          <path d="M12 2a10 10 0 0110 10" stroke-linecap="round" />
        </svg>
        로딩 중
      </span>
    </div>

    <!-- 결과 목록 -->
    <div class="flex-1 overflow-y-auto p-3 space-y-2">
      <!-- 로딩 스켈레톤 -->
      <template v-if="lectureStore.loading && lectureStore.lectures.length === 0">
        <div v-for="n in 5" :key="n" class="p-3 rounded-xl border border-gray-50">
          <div class="skeleton h-4 w-3/4 mb-2" />
          <div class="skeleton h-3 w-1/2 mb-1.5" />
          <div class="skeleton h-3 w-2/3" />
        </div>
      </template>

      <!-- 결과 카드 -->
      <TransitionGroup v-else name="lecture-list">
        <LectureCard
          v-for="lec in lectureStore.lectures"
          :key="lec.id"
          :lecture="lec"
          @add="handleAdd"
        />
      </TransitionGroup>

      <!-- 빈 상태 -->
      <div
        v-if="!lectureStore.loading && lectureStore.lectures.length === 0"
        class="text-center py-10"
      >
        <svg class="w-10 h-10 mx-auto mb-2 text-gray-200" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.2-5.2M10 18a8 8 0 100-16 8 8 0 000 16z" />
        </svg>
        <p class="text-sm text-gray-300 font-medium">검색 결과가 없습니다</p>
        <p class="text-xs text-gray-200 mt-1">필터를 변경해보세요</p>
      </div>

      <!-- 더 보기 -->
      <button
        v-if="lectureStore.hasMore && !lectureStore.loading"
        class="w-full py-2.5 text-sm text-hufs-blue hover:text-hufs-navy font-semibold
               rounded-xl hover:bg-hufs-pale transition-all"
        @click="loadMore"
      >
        더 보기 ({{ lectureStore.total - lectureStore.page * lectureStore.limit }}건)
      </button>
    </div>

    <!-- 토스트 -->
    <Transition name="page">
      <div
        v-if="toast"
        class="absolute bottom-3 left-3 right-3 bg-red-500 text-white text-sm
               px-4 py-2.5 rounded-xl shadow-lg text-center font-medium animate-slide-up"
      >
        {{ toast }}
      </div>
    </Transition>
  </div>
</template>
