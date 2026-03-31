<script setup>
import { ref } from 'vue'
import { useTimetableStore } from '../stores/timetable.js'
import LectureSearchPanel from '../components/LectureSearchPanel.vue'
import TimetableGrid from '../components/TimetableGrid.vue'
import ExportButton from '../components/ExportButton.vue'

const store = useTimetableStore()

// 모바일 탭 전환
const activeTab = ref('timetable')

const showSaveDialog = ref(false)
const saveName = ref('')
const saveMessage = ref('')

function openSave() {
  saveName.value = store.currentName || ''
  saveMessage.value = ''
  showSaveDialog.value = true
}

function doSave() {
  if (!saveName.value.trim()) {
    saveMessage.value = '이름을 입력해주세요.'
    return
  }
  store.save(saveName.value)
  saveMessage.value = '저장 완료!'
  setTimeout(() => { showSaveDialog.value = false }, 600)
}
</script>

<template>
  <div>
    <!-- 헤더 -->
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-2">
        <h1 class="text-xl sm:text-2xl font-bold text-hufs-navy">시간표</h1>
        <span v-if="store.currentName" class="text-xs text-gray-400 hidden sm:inline">
          — {{ store.currentName }}
        </span>
      </div>
      <div class="flex items-center gap-2">
        <div class="hidden sm:flex items-center gap-1.5 mr-1 text-sm text-gray-400">
          <span class="font-bold text-hufs-navy text-base">{{ store.totalCredits }}</span>학점
          <span class="text-gray-200">|</span>
          {{ store.lectures.length }}과목
        </div>
        <ExportButton />
        <button
          class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg
                 bg-hufs-navy text-white hover:bg-hufs-dark
                 disabled:opacity-40 disabled:cursor-not-allowed
                 active:scale-95 transition-all duration-150 shadow-sm"
          :disabled="store.lectures.length === 0"
          @click="openSave"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 3v18l7-5 7 5V3z" />
          </svg>
          저장
        </button>
      </div>
    </div>

    <!-- 모바일: 학점 + 탭 -->
    <div class="sm:hidden mb-3">
      <div class="text-sm text-gray-400 mb-2 text-center">
        <span class="font-bold text-hufs-navy text-lg">{{ store.totalCredits }}</span>학점
        · {{ store.lectures.length }}과목
      </div>
      <div class="flex rounded-xl bg-gray-100 p-1">
        <button
          v-for="tab in [{ key: 'search', label: '검색' }, { key: 'timetable', label: '시간표' }]"
          :key="tab.key"
          class="flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-150"
          :class="activeTab === tab.key
            ? 'bg-white text-hufs-navy shadow-sm'
            : 'text-gray-400'"
          @click="activeTab = tab.key"
        >
          {{ tab.label }}
        </button>
      </div>
    </div>

    <!-- 데스크탑: 2컬럼 / 모바일: 탭 전환 -->
    <div class="flex gap-4 items-start home-layout">
      <div
        class="search-panel relative"
        :class="{ 'mobile-hidden': activeTab !== 'search' }"
      >
        <LectureSearchPanel />
      </div>
      <div
        class="timetable-panel"
        :class="{ 'mobile-hidden': activeTab !== 'timetable' }"
      >
        <TimetableGrid />
      </div>
    </div>

    <!-- 저장 다이얼로그 -->
    <Teleport to="body">
      <Transition name="page">
        <div v-if="showSaveDialog" class="fixed inset-0 z-50 flex items-center justify-center">
          <div class="absolute inset-0 bg-black/20 backdrop-blur-sm" @click="showSaveDialog = false" />
          <div class="relative bg-white rounded-2xl shadow-xl p-6 w-80 animate-slide-up">
            <h3 class="text-lg font-bold text-gray-800 mb-1">시간표 저장</h3>
            <p class="text-xs text-gray-400 mb-3">이름을 지정하여 시간표를 저장합니다.</p>
            <input
              v-model="saveName"
              type="text"
              placeholder="예: 3학년 1학기 A안"
              class="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl mb-2
                     focus:outline-none focus:ring-2 focus:ring-hufs-sky/30 focus:border-hufs-sky
                     transition-all"
              @keydown.enter="doSave"
            />
            <p v-if="saveMessage" class="text-xs mb-2"
               :class="saveMessage.includes('완료') ? 'text-green-600' : 'text-red-500'">
              {{ saveMessage }}
            </p>
            <div class="flex gap-2 mt-1">
              <button
                class="flex-1 py-2 text-sm font-medium rounded-xl border border-gray-200
                       text-gray-500 hover:bg-gray-50 transition-colors"
                @click="showSaveDialog = false"
              >
                취소
              </button>
              <button
                class="flex-1 py-2 text-sm font-semibold rounded-xl
                       bg-hufs-navy text-white hover:bg-hufs-dark transition-colors"
                @click="doSave"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.home-layout {
  min-height: calc(100vh - 120px);
}
.search-panel {
  width: 40%;
  min-width: 320px;
  max-height: calc(100vh - 120px);
}
.search-panel > :deep(*) {
  max-height: calc(100vh - 120px);
}
.timetable-panel {
  width: 60%;
  flex: 1;
  max-height: calc(100vh - 120px);
  overflow: hidden;
}

/* 태블릿: 시간표 스크롤 */
@media (min-width: 768px) and (max-width: 1023px) {
  .search-panel {
    width: 42%;
    min-width: 280px;
  }
  .timetable-panel {
    width: 58%;
    overflow-x: auto;
  }
}

/* 모바일: 탭 전환 */
@media (max-width: 767px) {
  .home-layout {
    display: block;
  }
  .search-panel,
  .timetable-panel {
    width: 100%;
    min-width: 0;
    max-height: none;
  }
  .search-panel > :deep(*) {
    max-height: calc(100vh - 220px);
  }
  .mobile-hidden {
    display: none;
  }
}
</style>
