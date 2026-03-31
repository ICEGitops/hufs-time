<script setup>
import { computed, ref, onMounted, watch } from 'vue'
import { useLectureStore } from '../stores/lectures.js'
import { useUserSettingsStore } from '../stores/user-settings.js'
import api from '../utils/api.js'

const store = useLectureStore()
const userSettings = useUserSettingsStore()
const emit = defineEmits(['change'])
const dbCategories = ref([])

const CAMPUSES = [
  { value: 'H1', label: '서울' },
  { value: 'H2', label: '글로벌' }
]

const GUBUN_TABS = [
  { value: '1', label: '전공/부전공' },
  { value: '2', label: '교양' },
  { value: '3', label: '기초' }
]

const YEARS = [
  { value: '', label: '전체 학년' },
  { value: '1', label: '1학년' },
  { value: '2', label: '2학년' },
  { value: '3', label: '3학년' },
  { value: '4', label: '4학년' }
]

const DAYS = ['월', '화', '수', '목', '금']

// 현재 gubun에 맞는 카테고리 목록
const categories = computed(() => {
  const cats = [{ value: '', label: '전체 영역' }]
  for (const c of dbCategories.value) {
    if (c.category && c.gubun === store.filters.gubun) {
      cats.push({ value: c.category, label: c.category })
    }
  }
  // 전공 탭 + 내 학과 설정 시 전공교류 추가
  if (store.filters.gubun === '1' && userSettings.myDepartment) {
    cats.push({ value: '전공교류', label: '전공교류' })
  }
  return cats
})

// 전공 탭이면 학과 드롭다운, 교양/기초면 영역 드롭다운
const showDeptFilter = computed(() => store.filters.gubun === '1')

onMounted(fetchCategories)

async function fetchCategories() {
  try {
    const { data: res } = await api.get('/api/lectures/categories')
    if (res.success) dbCategories.value = res.data
  } catch (e) {
    console.error('Failed to fetch categories:', e)
  }
}

function onCampusClick(campus) {
  store.filters.campus = campus
  userSettings.setMyCampus(campus)
  store.filters.department = ''
  userSettings.setMyDepartment('')
  store.fetchDepartments()
  emit('change')
}

function onGubunClick(gubun) {
  store.filters.gubun = gubun
  store.filters.category = ''
  store.filters.department = ''
  store.filters.year = ''
  emit('change')
}

function onMyDeptChange() {
  store.filters.department = userSettings.myDepartment
  emit('change')
}

function onSelect() {
  emit('change')
}

function onDayClick(day) {
  store.filters.day = store.filters.day === day ? '' : day
  emit('change')
}
</script>

<template>
  <div class="space-y-2.5">
    <!-- 캠퍼스 선택 -->
    <div class="flex gap-1.5">
      <button
        v-for="c in CAMPUSES"
        :key="c.value"
        class="flex-1 py-1.5 text-xs font-semibold rounded-xl border-2 transition-all duration-150"
        :class="store.filters.campus === c.value
          ? 'bg-hufs-blue text-white border-hufs-blue shadow-sm scale-[1.02]'
          : 'bg-white text-gray-500 border-gray-200 hover:border-hufs-sky/40 hover:text-hufs-blue'"
        @click="onCampusClick(c.value)"
      >
        {{ c.label }}
      </button>
    </div>

    <!-- gubun 3탭: 전공/부전공 | 교양 | 기초 -->
    <div class="flex gap-1 bg-gray-100 p-1 rounded-xl">
      <button
        v-for="g in GUBUN_TABS"
        :key="g.value"
        class="flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150"
        :class="store.filters.gubun === g.value
          ? 'bg-white text-hufs-navy shadow-sm'
          : 'text-gray-400 hover:text-gray-600'"
        @click="onGubunClick(g.value)"
      >
        {{ g.label }}
      </button>
    </div>

    <!-- 내 학과 설정 (전공 탭에서만) -->
    <div v-if="showDeptFilter" class="relative">
      <select
        :value="userSettings.myDepartment"
        class="w-full px-3 py-2 text-sm border-2 rounded-xl bg-hufs-pale/50
               focus:outline-none focus:ring-2 focus:ring-hufs-blue/30 focus:border-hufs-blue
               transition-all appearance-none cursor-pointer"
        :class="userSettings.myDepartment
          ? 'border-hufs-blue/40 text-hufs-navy font-semibold'
          : 'border-gray-200 text-gray-400'"
        @change="userSettings.setMyDepartment($event.target.value); onMyDeptChange()"
      >
        <option value="">🎓 내 학과 설정</option>
        <option v-for="dept in store.departments" :key="'my-' + dept.id" :value="dept.name">
          {{ dept.name }}
        </option>
      </select>
    </div>

    <!-- 학과 선택 (전공 탭) -->
    <select
      v-if="showDeptFilter"
      v-model="store.filters.department"
      class="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white
             focus:outline-none focus:ring-2 focus:ring-hufs-sky/30 focus:border-hufs-sky
             transition-all appearance-none cursor-pointer"
      @change="onSelect"
    >
      <option value="">전체 학과</option>
      <option v-for="dept in store.departments" :key="dept.id" :value="dept.name">
        {{ dept.name }}
      </option>
    </select>

    <!-- 학년 + 카테고리(영역) -->
    <div class="flex gap-2">
      <select
        v-if="showDeptFilter"
        v-model="store.filters.year"
        class="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white
               focus:outline-none focus:ring-2 focus:ring-hufs-sky/30 focus:border-hufs-sky
               transition-all appearance-none cursor-pointer"
        @change="onSelect"
      >
        <option v-for="y in YEARS" :key="y.value" :value="y.value">{{ y.label }}</option>
      </select>
      <select
        v-model="store.filters.category"
        class="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white
               focus:outline-none focus:ring-2 focus:ring-hufs-sky/30 focus:border-hufs-sky
               transition-all appearance-none cursor-pointer"
        :class="{ 'w-full': !showDeptFilter }"
        @change="onSelect"
      >
        <option v-for="c in categories" :key="c.value" :value="c.value">{{ c.label }}</option>
      </select>
    </div>

    <!-- 요일 칩 -->
    <div class="flex gap-1.5">
      <button
        v-for="day in DAYS"
        :key="day"
        class="flex-1 py-1.5 text-xs font-semibold rounded-xl border-2 transition-all duration-150"
        :class="store.filters.day === day
          ? 'bg-hufs-navy text-white border-hufs-navy shadow-sm scale-[1.02]'
          : 'bg-white text-gray-500 border-gray-200 hover:border-hufs-sky/40 hover:text-hufs-blue'"
        @click="onDayClick(day)"
      >
        {{ day }}
      </button>
    </div>
  </div>
</template>
