/**
 * UI 状态管理
 */

import { defineStore } from 'pinia'
import { STORAGE_KEYS } from '@/utils/constants'

interface UIState {
  currentStep: number
  sidebarOpen: boolean
  theme: 'light' | 'dark'
  isOnline: boolean
}

export const useUIStore = defineStore('ui', {
  state: (): UIState => ({
    currentStep: 0,
    sidebarOpen: false,
    theme: 'light',
    isOnline: navigator.onLine
  }),

  getters: {
    isDarkTheme: (state) => state.theme === 'dark',
    isLightTheme: (state) => state.theme === 'light'
  },

  actions: {
    // 设置当前步骤
    setCurrentStep(step: number): void {
      this.currentStep = step
      this.saveToStorage()
    },

    // 下一步
    nextStep(): void {
      this.currentStep++
      this.saveToStorage()
    },

    // 上一步
    previousStep(): void {
      if (this.currentStep > 0) {
        this.currentStep--
        this.saveToStorage()
      }
    },

    // 重置步骤
    resetStep(): void {
      this.currentStep = 0
      this.saveToStorage()
    },

    // 切换侧边栏
    toggleSidebar(): void {
      this.sidebarOpen = !this.sidebarOpen
    },

    // 设置侧边栏状态
    setSidebarOpen(open: boolean): void {
      this.sidebarOpen = open
    },

    // 切换主题
    toggleTheme(): void {
      this.theme = this.theme === 'light' ? 'dark' : 'light'
      this.applyTheme()
      this.saveToStorage()
    },

    // 设置主题
    setTheme(theme: 'light' | 'dark'): void {
      this.theme = theme
      this.applyTheme()
      this.saveToStorage()
    },

    // 应用主题
    applyTheme(): void {
      document.documentElement.setAttribute('data-theme', this.theme)
    },

    // 设置在线状态
    setOnlineStatus(isOnline: boolean): void {
      this.isOnline = isOnline
    },

    // 保存到 localStorage
    saveToStorage(): void {
      try {
        const uiState = {
          currentStep: this.currentStep,
          theme: this.theme
        }
        localStorage.setItem(STORAGE_KEYS.UI_STATE, JSON.stringify(uiState))
      } catch (error) {
        console.error('保存 UI 状态失败:', error)
      }
    },

    // 从 localStorage 加载
    loadFromStorage(): void {
      try {
        const uiStateData = localStorage.getItem(STORAGE_KEYS.UI_STATE)
        if (uiStateData) {
          const uiState = JSON.parse(uiStateData)
          this.currentStep = uiState.currentStep || 0
          this.theme = uiState.theme || 'light'
          this.applyTheme()
        }
      } catch (error) {
        console.error('加载 UI 状态失败:', error)
      }
    }
  }
})
