<script setup>
import { ref } from 'vue'

const props = defineProps({
  lecture: { type: Object, required: true },
  time: { type: Object, required: true },
  color: { type: Object, required: true }
})

const emit = defineEmits(['click'])
const showDetail = ref(false)

function close() {
  showDetail.value = false
}
</script>

<template>
  <div
    class="absolute inset-x-1 rounded-lg px-1.5 py-1 cursor-pointer
           overflow-hidden text-left leading-tight
           shadow-sm hover:shadow-md
           transition-all duration-150 hover:-translate-y-px
           border border-black/[0.04]"
    :style="{ backgroundColor: color.bg, color: color.text }"
    @click.stop="showDetail = !showDetail"
  >
    <p class="font-bold text-[11px] truncate">{{ lecture.course_name }}</p>
    <p class="text-[10px] truncate opacity-75 mt-px">{{ lecture.professor }}</p>
    <p class="text-[9px] truncate opacity-60">{{ time.room || '' }}</p>

    <!-- 상세 팝업 -->
    <Teleport to="body">
      <Transition name="page">
        <div
          v-if="showDetail"
          class="fixed inset-0 z-[60] flex items-center justify-center"
        >
          <div class="absolute inset-0 bg-black/20 backdrop-blur-sm" @click="close" />
          <div class="relative bg-white rounded-2xl shadow-xl p-5 w-72 animate-slide-up">
            <div
              class="w-full h-1.5 rounded-full mb-4"
              :style="{ backgroundColor: color.bg }"
            />
            <h3 class="font-bold text-base text-gray-800">{{ lecture.course_name }}</h3>
            <p class="text-xs text-gray-400 mt-0.5">{{ lecture.course_code }}</p>

            <div class="mt-3 space-y-1.5 text-sm text-gray-600">
              <div class="flex justify-between">
                <span class="text-gray-400">교수</span>
                <span class="font-medium">{{ lecture.professor || '-' }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-400">학점</span>
                <span class="font-medium">{{ lecture.credit }}학점</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-400">구분</span>
                <span class="font-medium">{{ lecture.category || '-' }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-400">강의실</span>
                <span class="font-medium">{{ time.room || '-' }}</span>
              </div>
            </div>

            <div class="flex gap-2 mt-4">
              <button
                class="flex-1 py-2 rounded-xl text-sm font-medium
                       border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
                @click="close"
              >
                닫기
              </button>
              <button
                class="flex-1 py-2 rounded-xl text-sm font-medium
                       bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                @click="emit('click', lecture); close()"
              >
                제거
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>
