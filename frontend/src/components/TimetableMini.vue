<script setup>
import { computed } from 'vue'
import { getColor } from '../utils/colorAssigner.js'

const props = defineProps({
  lectures: { type: Array, required: true }
})

const DAYS = ['월', '화', '수', '목', '금']
const START_HOUR = 9
const END_HOUR = 21
const SLOT_COUNT = (END_HOUR - START_HOUR) * 2

function timeToPercent(timeStr) {
  const [h, m] = timeStr.split(':').map(Number)
  const slots = (h - START_HOUR) * 2 + m / 30
  return (slots / SLOT_COUNT) * 100
}

const dayBlocks = computed(() => {
  const result = {}
  for (const day of DAYS) result[day] = []

  for (const lecture of props.lectures) {
    const color = getColor(lecture.course_code)
    for (const t of lecture.times) {
      if (!result[t.day_of_week]) continue
      const top = timeToPercent(t.start_time)
      const height = timeToPercent(t.end_time) - top
      if (height <= 0) continue
      result[t.day_of_week].push({ color, top, height, name: lecture.course_name })
    }
  }
  return result
})
</script>

<template>
  <div class="grid grid-cols-5 gap-px bg-gray-200 rounded-xl overflow-hidden h-28">
    <div
      v-for="day in DAYS"
      :key="day"
      class="relative bg-hufs-pale/50"
    >
      <div
        v-for="(block, i) in dayBlocks[day]"
        :key="i"
        class="absolute left-0.5 right-0.5 rounded-sm shadow-sm"
        :style="{
          top: `${block.top}%`,
          height: `${block.height}%`,
          backgroundColor: block.color.bg
        }"
        :title="block.name"
      />
    </div>
  </div>
</template>
