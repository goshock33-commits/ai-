/**
 * 用户状态管理（对接后端 auth-backend）
 */

import { defineStore } from 'pinia'
import { authService } from '@/services/authService'

interface User {
  id: string
  username: string
  avatar?: string
  phone?: string
  userType: 'personal' | 'enterprise'
  // 企业用户额外字段
  companyName?: string
  contactName?: string
  contactPhone?: string
  createdAt: string
}

interface UserState {
  user: User | null
  isLoggedIn: boolean
  token: string | null
  rememberMe: boolean
}

const STORAGE_KEY = 'user_state'

function generateAvatar(identifier: string): string {
  if (!identifier || identifier.length === 0) identifier = 'U'
  const firstLetter = identifier.charAt(0).toUpperCase()
  const colors = ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1', '#13c2c2']
  const color = colors[identifier.length % colors.length]
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
    <rect width="100" height="100" fill="${color}"/>
    <text x="50" y="50" font-size="40" fill="white" text-anchor="middle" dominant-baseline="central" font-family="Arial, sans-serif" font-weight="bold">${firstLetter}</text>
  </svg>`
  return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)))
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    user: null,
    isLoggedIn: false,
    token: null,
    rememberMe: false
  }),

  getters: {
    username: (state) => state.user?.username || '',
    avatar: (state) => state.user?.avatar || '',
    phone: (state) => state.user?.phone || '',
    loggedIn: (state) => state.isLoggedIn && state.user !== null,
    userId: (state) => state.user?.id || ''
  },

  actions: {
    // 登录（调用后端 /auth/login）
    async login(username: string, password: string, remember: boolean = false): Promise<boolean> {
      try {
        const result = await authService.login(username, password, remember)
        this.applyAuthResult(result, remember)
        return true
      } catch (err: any) {
        console.error('❌ 登录失败:', err?.response?.data?.message || err?.message)
        return false
      }
    },

    // 注册（个人用户）
    async register(phone: string, password: string): Promise<{ success: boolean; message: string }> {
      try {
        const result = await authService.registerPersonal(phone, password)
        this.applyAuthResult(result, false)
        return { success: true, message: '注册成功' }
      } catch (err: any) {
        const msg = err?.response?.data?.message || err?.message || '注册失败'
        return { success: false, message: msg }
      }
    },

    // 注册（企业用户）
    async registerEnterprise(
      companyName: string,
      contactName: string,
      contactPhone: string,
      password: string
    ): Promise<{ success: boolean; message: string }> {
      try {
        const result = await authService.registerEnterprise(
          companyName,
          contactName,
          contactPhone,
          password
        )
        this.applyAuthResult(result, false)
        return { success: true, message: '注册成功' }
      } catch (err: any) {
        const msg = err?.response?.data?.message || err?.message || '注册失败'
        return { success: false, message: msg }
      }
    },

    // 将后端登录结果写入 state
    applyAuthResult(result: { token: string; user: any }, remember: boolean): void {
      const u = result.user || {}
      this.user = {
        id: String(u.id),
        username: u.username,
        avatar: u.avatar || generateAvatar(u.username || u.phone || 'U'),
        phone: u.phone,
        userType: (u.userType as 'personal' | 'enterprise') || 'personal',
        companyName: u.companyName,
        contactName: u.contactName,
        contactPhone: u.contactPhone,
        createdAt: u.createdAt || new Date().toISOString()
      }
      this.isLoggedIn = true
      this.token = result.token
      this.rememberMe = remember
      this.saveToStorage()
    },

    // 登出
    logout(): void {
      this.user = null
      this.isLoggedIn = false
      this.token = null
      this.rememberMe = false
      localStorage.removeItem(STORAGE_KEY)
    },

    // 更新用户信息（仅本地）
    updateUser(userData: Partial<User>): void {
      if (this.user) {
        this.user = { ...this.user, ...userData }
        this.saveToStorage()
      }
    },

    // 保存到 LocalStorage
    saveToStorage(): void {
      try {
        const userState = {
          user: this.user,
          isLoggedIn: this.isLoggedIn,
          token: this.token,
          rememberMe: this.rememberMe
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(userState))
      } catch (error) {
        console.error('❌ 保存用户状态失败:', error)
      }
    },

    // 从 LocalStorage 加载
    loadFromStorage(): void {
      try {
        const userStateData = localStorage.getItem(STORAGE_KEY)
        if (!userStateData) return
        const userState = JSON.parse(userStateData)
        // 只要有 token 就恢复（后端 JWT 过期由请求时 401 处理）
        if (userState.token) {
          this.user = userState.user
          this.isLoggedIn = !!userState.isLoggedIn
          this.token = userState.token
          this.rememberMe = !!userState.rememberMe
        }
      } catch (error) {
        console.error('❌ 加载用户状态失败:', error)
      }
    }
  }
})
