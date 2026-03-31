<script setup>
import { computed } from 'vue'
import { useTimetableStore } from '../stores/timetable.js'
import { getColor } from '../utils/colorAssigner.js'
import TimetableCell from './TimetableCell.vue'

const store = useTimetableStore()

const DAYS = ['월', '화', '수', '목', '금']
const DAY_LABELS = ['MON', 'TUE', 'WED', 'THU', 'FRI']
const START_HOUR = 8
const END_HOUR = 21
const HOURS = END_HOUR - START_HOUR
const SLOT_COUNT = HOURS * 2
const ROW_HEIGHT = 30
const BODY_HEIGHT = SLOT_COUNT * ROW_HEIGHT

const timeLabels = computed(() => {
  const labels = []
  for (let h = START_HOUR; h < END_HOUR; h++) {
    labels.push(`${String(h).padStart(2, '0')}:00`)
  }
  return labels
})

function timeToPx(timeStr) {
  const [h, m] = timeStr.split(':').map(Number)
  const slots = (h - START_HOUR) * 2 + m / 30
  return slots * ROW_HEIGHT
}

const dayBlocks = computed(() => {
  const result = {}
  for (const day of DAYS) result[day] = []

  for (const lecture of store.lectures) {
    const color = getColor(lecture.course_code)
    for (const t of lecture.times) {
      if (!result[t.day_of_week]) continue
      const top = timeToPx(t.start_time)
      const height = timeToPx(t.end_time) - top
      if (height <= 0) continue
      result[t.day_of_week].push({ lecture, time: t, color, top, height })
    }
  }
  return result
})

function handleRemove(lecture) {
  store.removeLecture(lecture.id)
}
</script>

<template>
  <div class="relative bg-white rounded-2xl shadow-card border border-gray-100 overflow-auto timetable-scroll" data-timetable-capture>
    <!-- 요일 헤더 -->
    <div class="grid timetable-cols sticky top-0 z-20 bg-white border-b border-gray-200">
      <div class="border-r border-gray-100" />
      <div
        v-for="(day, i) in DAYS"
        :key="day"
        class="text-center py-3 border-r border-gray-100 last:border-r-0"
      >
        <span class="text-sm font-bold text-hufs-navy">{{ day }}</span>
        <span class="text-[10px] text-gray-400 ml-1 hidden sm:inline">{{ DAY_LABELS[i] }}</span>
      </div>
    </div>

    <!-- 바디 -->
    <div class="grid timetable-cols" :style="{ height: `${BODY_HEIGHT}px` }">
      <!-- 시간 라벨 -->
      <div class="relative border-r border-gray-100">
        <div
          v-for="(label, idx) in timeLabels"
          :key="label"
          class="absolute right-0 pr-2 text-[11px] font-medium text-gray-300 -translate-y-1/2 leading-none select-none"
          :style="{ top: `${idx * ROW_HEIGHT * 2}px` }"
        >
          {{ label }}
        </div>
      </div>

      <!-- 요일 컬럼 -->
      <div
        v-for="day in DAYS"
        :key="day"
        class="relative border-r border-gray-100 last:border-r-0 group/col"
      >
        <!-- 줄무늬 배경 + 호버 -->
        <div
          v-for="slot in SLOT_COUNT"
          :key="slot"
          class="absolute left-0 right-0 border-t transition-colors"
          :class="[
            slot % 2 === 1 ? 'border-gray-100' : 'border-gray-50',
            slot % 2 === 0 ? 'bg-gray-50/30' : ''
          ]"
          :style="{ top: `${(slot - 1) * ROW_HEIGHT}px`, height: `${ROW_HEIGHT}px` }"
        />
        <div
          class="absolute left-0 right-0 border-t border-gray-100"
          :style="{ top: `${SLOT_COUNT * ROW_HEIGHT}px` }"
        />

        <!-- 컬럼 호버 하이라이트 -->
        <div class="absolute inset-0 bg-hufs-sky/[0.03] opacity-0 group-hover/col:opacity-100 transition-opacity pointer-events-none" />

        <!-- 강의 블록 -->
        <TransitionGroup name="cell">
          <TimetableCell
            v-for="(block, i) in dayBlocks[day]"
            :key="`${block.lecture.id}-${i}`"
            :lecture="block.lecture"
            :time="block.time"
            :color="block.color"
            :style="{
              top: `${block.top}px`,
              height: `${block.height}px`
            }"
            @click="handleRemove"
          />
        </TransitionGroup>
      </div>
    </div>

    <!-- 빈 상태 -->
    <div
      v-if="store.lectures.length === 0"
      class="absolute inset-0 flex items-center justify-center pointer-events-none"
      style="top: 48px;"
    >
      <div class="text-center">
        <svg class="w-12 h-12 mx-auto mb-3 text-gray-200" fill="none" stroke="currentColor" stroke-width="1.2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p class="text-sm text-gray-300 font-medium">강의를 추가해주세요</p>
        <p class="text-xs text-gray-200 mt-1">왼쪽 검색 패널에서 강의를 검색하세요</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.timetable-cols {
  grid-template-columns: 48px repeat(5, 1fr);
}

.timetable-scroll {
  max-height: calc(100vh - 120px);
}

@media (min-width: 768px) {
  .timetable-cols {
    grid-template-columns: 52px repeat(5, 1fr);
  }
}
</style>
