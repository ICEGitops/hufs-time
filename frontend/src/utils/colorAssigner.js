// 파스텔 색상 팔레트 (16가지)
const PALETTE = [
  { bg: '#FECDD3', text: '#9F1239' }, // rose
  { bg: '#FED7AA', text: '#9A3412' }, // orange
  { bg: '#FDE68A', text: '#92400E' }, // amber
  { bg: '#BBF7D0', text: '#166534' }, // green
  { bg: '#A7F3D0', text: '#065F46' }, // emerald
  { bg: '#99F6E4', text: '#115E59' }, // teal
  { bg: '#BFDBFE', text: '#1E40AF' }, // blue
  { bg: '#C7D2FE', text: '#3730A3' }, // indigo
  { bg: '#DDD6FE', text: '#5B21B6' }, // violet
  { bg: '#F5D0FE', text: '#86198F' }, // fuchsia
  { bg: '#FBCFE8', text: '#9D174D' }, // pink
  { bg: '#D9F99D', text: '#3F6212' }, // lime
  { bg: '#BAE6FD', text: '#075985' }, // sky
  { bg: '#E9D5FF', text: '#6B21A8' }, // purple
  { bg: '#FECACA', text: '#991B1B' }, // red
  { bg: '#CFFAFE', text: '#155E75' }, // cyan
]

// 과목 코드 → 해시 → 팔레트 인덱스
function hashCode(str) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

const cache = new Map()

export function getColor(courseCode) {
  if (cache.has(courseCode)) return cache.get(courseCode)
  const index = hashCode(courseCode) % PALETTE.length
  const color = PALETTE[index]
  cache.set(courseCode, color)
  return color
}
