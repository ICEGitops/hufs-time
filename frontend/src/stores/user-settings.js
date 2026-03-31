import { defineStore } from 'pinia'
import { ref } from 'vue'

const STORAGE_KEY = 'hufs-my-department'
const CAMPUS_KEY = 'hufs-my-campus'

export const useUserSettingsStore = defineStore('userSettings', () => {
  const myDepartment = ref(localStorage.getItem(STORAGE_KEY) || '')
  const myCampus = ref(localStorage.getItem(CAMPUS_KEY) || 'H1')

  function setMyDepartment(dept) {
    myDepartment.value = dept
    if (dept) {
      localStorage.setItem(STORAGE_KEY, dept)
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  }

  function setMyCampus(campus) {
    myCampus.value = campus
    localStorage.setItem(CAMPUS_KEY, campus)
  }

  return { myDepartment, setMyDepartment, myCampus, setMyCampus }
})
