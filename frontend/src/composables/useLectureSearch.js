import { useLectureStore } from '../stores/lectures.js'

export function useLectureSearch() {
  const store = useLectureStore()
  let debounceTimer = null

  // 키워드 변경 시 debounce 300ms 후 검색
  function onKeywordChange(keyword) {
    store.filters.keyword = keyword
    clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      store.fetchLectures(1)
    }, 300)
  }

  // 필터 변경 시 즉시 검색
  function onFilterChange() {
    clearTimeout(debounceTimer)
    store.fetchLectures(1)
  }

  // 다음 페이지 (기존 결과에 추가)
  function loadMore() {
    if (store.hasMore && !store.loading) {
      store.fetchLectures(store.page + 1)
    }
  }

  return { onKeywordChange, onFilterChange, loadMore }
}
