<script setup>
import { ref } from 'vue'
import html2canvas from 'html2canvas'
import { useTimetableStore } from '../stores/timetable.js'

const store = useTimetableStore()
const exporting = ref(false)

async function exportPng() {
  const el = document.querySelector('[data-timetable-capture]')
  if (!el) return

  exporting.value = true
  try {
    const canvas = await html2canvas(el, {
      scale: 2,
      backgroundColor: '#ffffff',
      useCORS: true
    })
    const link = document.createElement('a')
    link.download = `${store.currentName || '시간표'}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  } catch (error) {
    console.error('Export failed:', error)
  } finally {
    exporting.value = false
  }
}
</script>

<template>
  <button
    class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg
           border border-gray-200 text-gray-500
           hover:border-hufs-sky/40 hover:text-hufs-blue hover:bg-hufs-pale
           disabled:opacity-40 disabled:cursor-not-allowed
           transition-all duration-150"
    :disabled="exporting || store.lectures.length === 0"
    @click="exportPng"
  >
    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
    </svg>
    {{ exporting ? '내보내는 중...' : 'PNG' }}
  </button>
</template>
