/**
 * 认证相关 API
 * 对接后端 auth-backend (Spring Boot)
 */
import axios from 'axios'

const baseURL =
  (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:8080/api'

export const authApi = axios.create({
  baseURL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' }
})

// 请求拦截：自动携带 token
authApi.interceptors.request.use((config) => {
  try {
    const raw = localStorage.getItem('user_state')
    if (raw) {
      const state = JSON.parse(raw)
      if (state?.token) {
        config.headers.Authorization = `Bearer ${state.token}`
      }
    }
  } catch {}
  return config
})

export interface BackendUser {
  id: string
  username: string
  avatar?: string
  phone?: string
  userType: 'personal' | 'enterprise'
  companyName?: string
  contactName?: string
  contactPhone?: string
  createdAt: string
}

export interface AuthResult {
  token: string
  user: BackendUser
}

interface ApiResp<T> {
  code: number
  message: string
  data: T
}

function unwrap<T>(resp: { data: ApiResp<T> }): T {
  const body = resp.data
  if (body.code !== 200) {
    throw new Error(body.message || '请求失败')
  }
  return body.data
}

export const authService = {
  async login(username: string, password: string, rememberMe = false): Promise<AuthResult> {
    const resp = await authApi.post<ApiResp<AuthResult>>('/auth/login', {
      username,
      password,
      rememberMe
    })
    return unwrap(resp)
  },

  async registerPersonal(phone: string, password: string): Promise<AuthResult> {
    const resp = await authApi.post<ApiResp<AuthResult>>('/auth/register', {
      username: phone,
      password,
      phone,
      userType: 'personal'
    })
    return unwrap(resp)
  },

  async registerEnterprise(
    companyName: string,
    contactName: string,
    contactPhone: string,
    password: string
  ): Promise<AuthResult> {
    const resp = await authApi.post<ApiResp<AuthResult>>('/auth/register', {
      username: contactPhone,
      password,
      phone: contactPhone,
      userType: 'enterprise',
      companyName,
      contactName,
      contactPhone
    })
    return unwrap(resp)
  }
}
