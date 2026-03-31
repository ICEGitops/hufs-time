import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/hufs-timetable-back'
})

export default api
