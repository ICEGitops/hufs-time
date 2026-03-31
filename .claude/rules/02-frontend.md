# 02 - 프론트엔드 규칙 (Vue 3 + Vite)

## 기술 스택
- Vue 3 (Composition API only, Options API 사용 금지)
- Vite 5 (번들러)
- Vue Router 4 (SPA 라우팅)
- Pinia (상태 관리)
- Axios (HTTP 클라이언트)
- Tailwind CSS (스타일링)

## 컴포넌트 작성 규칙

### SFC 구조
모든 Vue 컴포넌트는 아래 순서를 따른다:
```vue
<script setup>
// 1. imports
// 2. props/emits 정의
// 3. reactive state (ref, reactive)
// 4. computed
// 5. watch
// 6. functions
// 7. lifecycle hooks (onMounted 등)
</script>

<template>
  <!-- HTML -->
</template>

<style scoped>
/* 컴포넌트 전용 스타일 (Tailwind로 부족할 때만) */
</style>
```

### Props & Emits
```js
// 반드시 타입과 기본값 명시
const props = defineProps({
  lecture: {
    type: Object,
    required: true
  },
  isSelected: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['select', 'remove'])
```

### 상태 관리 (Pinia)
```js
// stores/lectures.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useLectureStore = defineStore('lectures', () => {
  const lectures = ref([])
  const filters = ref({ department: '', year: '', keyword: '' })
  
  const filteredLectures = computed(() => { ... })
  
  async function fetchLectures() { ... }
  
  return { lectures, filters, filteredLectures, fetchLectures }
})
```

## API 통신

### Axios 인스턴스
```js
// utils/api.js
import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/hufs-timetable-back'
})

export default api
```

### 환경변수
```
# .env.development (로컬)
VITE_API_URL=http://localhost:8080

# .env.production (배포)
VITE_API_URL=/hufs-timetable-back
```

## 시간표 그리드 설계

### 그리드 구조
- X축: 월, 화, 수, 목, 금 (5일)
- Y축: 09:00 ~ 21:00 (30분 단위 = 24 슬롯)
- 각 셀은 30분 단위
- 강의 카드는 시간에 맞게 높이 조절 (CSS Grid 또는 absolute position)

### 색상 배정
- 과목별 고유 색상 자동 배정
- 파스텔 톤 팔레트 12~16가지 준비
- 동일 과목은 항상 같은 색상

### 충돌 감지
- 강의 추가 시 기존 시간표와 시간 겹침 체크
- 충돌 시 빨간 테두리 + 경고 토스트 메시지
- 충돌 강의는 추가 불가

## 라우팅
```
/                → HomeView (메인 시간표 편집)
/search          → SearchView (강의 검색 전용)
/saved           → SavedView (저장된 시간표 목록)
```

## Vite 설정
```js
// vite.config.js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  base: '/hufs-timetable/',  // ← 배포 base path 필수!
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true
      }
    }
  }
})
```

## 디자인 가이드라인

### 전체 톤
- 깔끔하고 모던한 대학생 대상 UI
- 밝은 배경 + 파스텔 색상 카드
- 그림자와 둥근 모서리로 카드 느낌
- 다크 모드는 나중에 추가 (Phase 8)

### 반응형
- 데스크탑 우선 (시간표는 넓은 화면에 최적화)
- 태블릿: 시간표 축소 + 스크롤
- 모바일: 세로 스크롤 가능한 리스트 형태로 대체

### 핵심 인터랙션
- 강의 카드 클릭 → 시간표에 추가 (애니메이션)
- 시간표 내 카드 클릭 → 상세 정보 팝업 + 제거 옵션
- 검색 필터 변경 → 즉시 결과 갱신 (debounce 300ms)
