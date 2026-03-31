<script setup>
import { RouterLink, RouterView } from 'vue-router'
import { useTimetableStore } from './stores/timetable.js'

const store = useTimetableStore()
</script>

<template>
  <div class="min-h-screen bg-hufs-pale">
    <!-- 네비게이션 -->
    <nav class="bg-hufs-navy text-white shadow-lg sticky top-0 z-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <RouterLink to="/" class="text-lg font-bold tracking-tight hover:text-hufs-light transition-colors">
            HUFS 시간표
          </RouterLink>
          <Transition name="page">
            <span
              v-if="store.currentName"
              class="text-[11px] bg-white/15 px-2.5 py-0.5 rounded-full hidden sm:inline-block"
            >
              {{ store.currentName }}
            </span>
          </Transition>
        </div>
        <div class="flex items-center gap-1">
          <RouterLink
            v-for="link in [
              { to: '/', label: '시간표', icon: 'M3 5h18v14H3z' },
              { to: '/search', label: '검색', icon: 'M21 21l-4.3-4.3M11 19a8 8 0 100-16 8 8 0 000 16z' },
              { to: '/saved', label: '저장목록', icon: 'M5 3v18l7-5 7 5V3z' },
            ]"
            :key="link.to"
            :to="link.to"
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm
                   text-white/70 hover:text-white hover:bg-white/10 transition-all"
            active-class="!text-white !bg-white/15 font-semibold"
          >
            <svg class="w-4 h-4 hidden sm:block" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" :d="link.icon" />
            </svg>
            {{ link.label }}
          </RouterLink>
        </div>
      </div>
    </nav>

    <!-- 메인 컨텐츠 -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 py-5">
      <RouterView v-slot="{ Component }">
        <Transition name="page" mode="out-in">
          <component :is="Component" />
        </Transition>
      </RouterView>
    </main>
  </div>
</template>
