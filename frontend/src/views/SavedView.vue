<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useTimetableStore } from '../stores/timetable.js'
import TimetableMini from '../components/TimetableMini.vue'

const store = useTimetableStore()
const router = useRouter()
const savedList = ref([])
const confirmTarget = ref(null)

function refresh() {
  savedList.value = store.getSavedList()
}

function handleLoad(name) {
  store.load(name)
  router.push('/')
}

function handleDelete(name) {
  confirmTarget.value = name
}

function doDelete() {
  store.deleteSaved(confirmTarget.value)
  confirmTarget.value = null
  refresh()
}

function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

onMounted(refresh)
</script>

<template>
  <div>
    <h1 class="text-xl sm:text-2xl font-bold text-hufs-navy mb-6">저장된 시간표</h1>

    <!-- 빈 상태 -->
    <div v-if="savedList.length === 0" class="text-center py-20">
      <div class="w-16 h-16 mx-auto mb-4 rounded-2xl bg-hufs-pale flex items-center justify-center">
        <svg class="w-8 h-8 text-hufs-sky/50" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M5 3v18l7-5 7 5V3z" />
        </svg>
      </div>
      <p class="text-base text-gray-400 font-medium">저장된 시간표가 없습니다</p>
      <p class="text-sm text-gray-300 mt-1">시간표를 만들고 저장해보세요.</p>
      <button
        class="mt-4 px-4 py-2 text-sm font-semibold rounded-xl
               bg-hufs-navy text-white hover:bg-hufs-dark transition-colors"
        @click="router.push('/')"
      >
        시간표 만들기
      </button>
    </div>

    <!-- 카드 그리드 -->
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="item in savedList"
        :key="item.name"
        class="bg-white rounded-2xl border border-gray-100 shadow-card
               hover:shadow-card-hover transition-all duration-200
               overflow-hidden group"
      >
        <!-- 미니 시간표 -->
        <div class="p-3 pb-0">
          <TimetableMini :lectures="store.getSavedLectures(item.name)" />
        </div>

        <!-- 정보 -->
        <div class="p-4 pt-3">
          <h3 class="font-bold text-gray-800 truncate group-hover:text-hufs-navy transition-colors">
            {{ item.name }}
          </h3>
          <div class="flex items-center gap-2 mt-1.5">
            <span class="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-hufs-light text-hufs-blue">
              {{ item.totalCredits }}학점
            </span>
            <span class="text-xs text-gray-400">{{ item.lectureCount }}과목</span>
            <span v-if="item.savedAt" class="text-[10px] text-gray-300 ml-auto">
              {{ formatDate(item.savedAt) }}
            </span>
          </div>

          <!-- 버튼 -->
          <div class="flex gap-2 mt-3">
            <button
              class="flex-1 py-2 text-xs font-semibold rounded-xl
                     bg-hufs-navy text-white hover:bg-hufs-dark
                     active:scale-[0.98] transition-all duration-150 shadow-sm"
              @click="handleLoad(item.name)"
            >
              불러오기
            </button>
            <button
              class="px-3 py-2 text-xs font-medium rounded-xl
                     border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50
                     transition-all duration-150"
              @click="handleDelete(item.name)"
            >
              삭제
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 삭제 확인 -->
    <Teleport to="body">
      <Transition name="page">
        <div v-if="confirmTarget" class="fixed inset-0 z-50 flex items-center justify-center">
          <div class="absolute inset-0 bg-black/20 backdrop-blur-sm" @click="confirmTarget = null" />
          <div class="relative bg-white rounded-2xl shadow-xl p-6 w-80 animate-slide-up">
            <h3 class="text-lg font-bold text-gray-800 mb-2">시간표 삭제</h3>
            <p class="text-sm text-gray-500">
              "<strong class="text-gray-800">{{ confirmTarget }}</strong>"을(를) 삭제할까요?<br />
              <span class="text-xs text-gray-400">이 작업은 되돌릴 수 없습니다.</span>
            </p>
            <div class="flex gap-2 mt-4">
              <button
                class="flex-1 py-2 text-sm font-medium rounded-xl border border-gray-200
                       text-gray-500 hover:bg-gray-50 transition-colors"
                @click="confirmTarget = null"
              >
                취소
              </button>
              <button
                class="flex-1 py-2 text-sm font-semibold rounded-xl
                       bg-red-500 text-white hover:bg-red-600 transition-colors"
                @click="doDelete"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>
