<script setup>
import { computed } from 'vue'
import { useTimetableStore } from '../stores/timetable.js'

const props = defineProps({
  lecture: { type: Object, required: true }
})

const emit = defineEmits(['add'])
const timetableStore = useTimetableStore()

const isAdded = computed(() =>
  timetableStore.lectures.some(l => l.id === props.lecture.id)
)

const timeText = computed(() =>
  props.lecture.times.map(t =>
    `${t.day_of_week} ${t.start_time}-${t.end_time}${t.room ? ' ' + t.room : ''}`
  ).join(' | ')
)

const meta = computed(() => props.lecture.metadata || null)
const isBanned = computed(() => meta.value?.isBanned)
</script>

<template>
  <div
    class="p-3 rounded-xl border transition-all duration-150 relative"
    :class="[
      isBanned
        ? 'border-red-200 bg-red-50/50 opacity-75'
        : isAdded
          ? 'border-hufs-sky/30 bg-hufs-light/50'
          : 'border-gray-100 bg-white hover:shadow-card hover:border-gray-200'
    ]"
  >
    <div class="flex items-start justify-between gap-2">
      <div class="flex-1 min-w-0">
        <p class="font-bold text-sm text-gray-800 truncate">
          {{ lecture.course_name }}
        </p>
        <div class="flex items-center gap-1.5 mt-1 flex-wrap">
          <span class="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-hufs-light text-hufs-blue">
            {{ lecture.credit }}학점
          </span>
          <span v-if="lecture.category" class="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-gray-100 text-gray-500">
            {{ lecture.category }}
          </span>
          <!-- 전공필수 뱃지 -->
          <span
            v-if="meta?.isRequired"
            class="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-orange-100 text-orange-600"
            :title="meta.requiredNote || '전공필수 교과목'"
          >
            필수
          </span>
          <!-- 전공교류 뱃지 -->
          <span
            v-if="meta?.isCrossMajor"
            class="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-purple-100 text-purple-600"
            :title="meta.crossMajorNote || '전공교류 교과목'"
          >
            전공교류
          </span>
          <!-- 수강금지 뱃지 -->
          <span
            v-if="isBanned"
            class="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-red-100 text-red-600"
          >
            수강금지
          </span>
          <span class="text-xs text-gray-400">{{ lecture.professor || '-' }}</span>
        </div>
        <!-- 전공교류 출처 -->
        <p v-if="meta?.isCrossMajor && meta.crossMajorFrom" class="text-[10px] text-purple-400 mt-0.5">
          ← {{ meta.crossMajorFrom }}
        </p>
        <p class="text-[11px] text-gray-400 mt-1.5 truncate leading-relaxed">
          {{ timeText }}
        </p>
      </div>
      <!-- 수강금지 시 비활성 버튼 -->
      <button
        v-if="isBanned"
        disabled
        class="shrink-0 w-14 py-1.5 text-xs font-bold rounded-lg
               bg-red-100 text-red-400 cursor-not-allowed"
      >
        금지
      </button>
      <button
        v-else-if="!isAdded"
        class="shrink-0 w-14 py-1.5 text-xs font-bold rounded-lg
               bg-hufs-navy text-white hover:bg-hufs-dark
               active:scale-95 transition-all duration-150 shadow-sm"
        @click="emit('add', lecture)"
      >
        추가
      </button>
      <span
        v-else
        class="shrink-0 w-14 py-1.5 text-xs font-medium rounded-lg text-center
               bg-hufs-light text-hufs-sky"
      >
        완료
      </span>
    </div>
  </div>
</template>
