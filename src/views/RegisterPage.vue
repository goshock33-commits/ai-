<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import NavigationBar from '@/components/NavigationBar.vue'
import { useUserStore } from '@/stores'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

// 当前模式：login 或 register
const mode = ref<'login' | 'register'>('login')

// 注册类型：personal 或 enterprise
const registerType = ref<'personal' | 'enterprise'>('personal')

// 加载状态
const loading = ref(false)

// 协议同意状态
const agreeToTerms = ref(false)
const showTermsDialog = ref(false)

// 密码显示状态
const showLoginPassword = ref(false)
const showRegisterPassword = ref(false)
const showRegisterConfirmPassword = ref(false)

// 登录表单
const loginForm = ref({
  username: '',
  password: '',
  remember: false
})

// 通用注册表单（用于个人注册的简化版本）
const registerForm = ref({
  phone: '',
  password: '',
  confirmPassword: '',
  inviteCode: '' // 邀请码（选填）
})

// 个人注册表单
const personalRegisterForm = ref({
  phone: '',
  password: '',
  confirmPassword: '',
  smsCode: '',
  inviteCode: '' // 邀请码（选填）
})

// 企业注册表单
const enterpriseRegisterForm = ref({
  companyName: '',
  contactName: '',
  contactPhone: '',
  password: '',
  confirmPassword: '',
  smsCode: '',
  inviteCode: '' // 邀请码（选填）
})

// 短信验证码
const smsCodeSent = ref(false)
const smsCountdown = ref(0)
let smsTimer: number | null = null

// 表单验证错误
const errors = ref({
  login: {
    username: '',
    password: ''
  },
  register: {
    phone: '',
    password: '',
    confirmPassword: ''
  },
  personalRegister: {
    phone: '',
    password: '',
    confirmPassword: '',
    smsCode: ''
  },
  enterpriseRegister: {
    companyName: '',
    contactName: '',
    contactPhone: '',
    password: '',
    confirmPassword: '',
    smsCode: ''
  }
})

// 根据路由设置初始模式
onMounted(() => {
  if (route.path === '/register') {
    mode.value = 'register'
  } else if (route.path === '/login') {
    mode.value = 'login'
  }
})

// 切换模式
const switchMode = (newMode: 'login' | 'register') => {
  mode.value = newMode
  // 清空表单和错误
  clearForms()
  // 更新路由但不刷新页面
  if (newMode === 'login') {
    router.replace('/login')
  } else {
    router.replace('/register')
  }
}

// 切换注册类型
const switchRegisterType = (type: 'personal' | 'enterprise') => {
  registerType.value = type
  clearForms()
}

// 清空表单
const clearForms = () => {
  loginForm.value = { username: '', password: '', remember: false }
  registerForm.value = { phone: '', password: '', confirmPassword: '', inviteCode: '' }
  personalRegisterForm.value = { phone: '', password: '', confirmPassword: '', smsCode: '', inviteCode: '' }
  enterpriseRegisterForm.value = { companyName: '', contactName: '', contactPhone: '', password: '', confirmPassword: '', smsCode: '', inviteCode: '' }
  errors.value = {
    login: { username: '', password: '' },
    register: { phone: '', password: '', confirmPassword: '' },
    personalRegister: { phone: '', password: '', confirmPassword: '', smsCode: '' },
    enterpriseRegister: { companyName: '', contactName: '', contactPhone: '', password: '', confirmPassword: '', smsCode: '' }
  }
  // 重置密码显示状态
  showLoginPassword.value = false
  showRegisterPassword.value = false
  showRegisterConfirmPassword.value = false
  // 重置短信验证码状态
  smsCodeSent.value = false
  smsCountdown.value = 0
  if (smsTimer) {
    clearInterval(smsTimer)
    smsTimer = null
  }
}

// 切换密码显示
const togglePasswordVisibility = (field: 'login' | 'register' | 'confirm') => {
  if (field === 'login') {
    showLoginPassword.value = !showLoginPassword.value
  } else if (field === 'register') {
    showRegisterPassword.value = !showRegisterPassword.value
  } else if (field === 'confirm') {
    showRegisterConfirmPassword.value = !showRegisterConfirmPassword.value
  }
}

// 验证登录表单
const validateLoginForm = (): boolean => {
  errors.value.login = { username: '', password: '' }
  let isValid = true

  if (!loginForm.value.username.trim()) {
    errors.value.login.username = '请输入手机号'
    isValid = false
  } else if (!/^1[3-9]\d{9}$/.test(loginForm.value.username)) {
    errors.value.login.username = '请输入正确的手机号'
    isValid = false
  }

  if (!loginForm.value.password) {
    errors.value.login.password = '请输入密码'
    isValid = false
  } else if (loginForm.value.password.length < 6) {
    errors.value.login.password = '密码至少6位'
    isValid = false
  }

  if (!agreeToTerms.value) {
    ElMessage.warning('请阅读并同意服务协议')
    isValid = false
  }

  return isValid
}

// 验证通用注册表单
const validateRegisterForm = (): boolean => {
  errors.value.register = { phone: '', password: '', confirmPassword: '' }
  let isValid = true

  if (!registerForm.value.phone.trim()) {
    errors.value.register.phone = '请输入手机号'
    isValid = false
  } else if (!/^1[3-9]\d{9}$/.test(registerForm.value.phone)) {
    errors.value.register.phone = '请输入正确的手机号'
    isValid = false
  }

  if (!registerForm.value.password) {
    errors.value.register.password = '请输入密码'
    isValid = false
  } else if (registerForm.value.password.length < 6) {
    errors.value.register.password = '密码至少6位'
    isValid = false
  } else if (registerForm.value.password.length > 20) {
    errors.value.register.password = '密码最多20位'
    isValid = false
  }

  if (!registerForm.value.confirmPassword) {
    errors.value.register.confirmPassword = '请确认密码'
    isValid = false
  } else if (registerForm.value.password !== registerForm.value.confirmPassword) {
    errors.value.register.confirmPassword = '两次密码输入不一致'
    isValid = false
  }

  if (!agreeToTerms.value) {
    ElMessage.warning('请阅读并同意服务协议')
    isValid = false
  }

  return isValid
}

// 验证个人注册表单
const validatePersonalRegisterForm = (): boolean => {
  errors.value.personalRegister = { phone: '', password: '', confirmPassword: '', smsCode: '' }
  let isValid = true

  if (!personalRegisterForm.value.phone.trim()) {
    errors.value.personalRegister.phone = '请输入手机号'
    isValid = false
  } else if (!/^1[3-9]\d{9}$/.test(personalRegisterForm.value.phone)) {
    errors.value.personalRegister.phone = '请输入正确的手机号'
    isValid = false
  }

  if (!personalRegisterForm.value.password) {
    errors.value.personalRegister.password = '请输入密码'
    isValid = false
  } else if (personalRegisterForm.value.password.length < 6) {
    errors.value.personalRegister.password = '密码至少6位'
    isValid = false
  } else if (personalRegisterForm.value.password.length > 20) {
    errors.value.personalRegister.password = '密码最多20位'
    isValid = false
  }

  if (!personalRegisterForm.value.confirmPassword) {
    errors.value.personalRegister.confirmPassword = '请确认密码'
    isValid = false
  } else if (personalRegisterForm.value.password !== personalRegisterForm.value.confirmPassword) {
    errors.value.personalRegister.confirmPassword = '两次密码输入不一致'
    isValid = false
  }

  return isValid
}

// 验证企业注册表单
const validateEnterpriseRegisterForm = (): boolean => {
  errors.value.enterpriseRegister = { companyName: '', contactName: '', contactPhone: '', password: '', confirmPassword: '', smsCode: '' }
  let isValid = true

  if (!enterpriseRegisterForm.value.companyName.trim()) {
    errors.value.enterpriseRegister.companyName = '请输入公司名称'
    isValid = false
  }

  if (!enterpriseRegisterForm.value.contactName.trim()) {
    errors.value.enterpriseRegister.contactName = '请输入联系人姓名'
    isValid = false
  }

  if (!enterpriseRegisterForm.value.contactPhone.trim()) {
    errors.value.enterpriseRegister.contactPhone = '请输入联系电话'
    isValid = false
  } else if (!/^1[3-9]\d{9}$/.test(enterpriseRegisterForm.value.contactPhone)) {
    errors.value.enterpriseRegister.contactPhone = '请输入正确的手机号'
    isValid = false
  }

  if (!enterpriseRegisterForm.value.smsCode.trim()) {
    errors.value.enterpriseRegister.smsCode = '请输入验证码'
    isValid = false
  }

  if (!enterpriseRegisterForm.value.password) {
    errors.value.enterpriseRegister.password = '请输入密码'
    isValid = false
  } else if (enterpriseRegisterForm.value.password.length < 6) {
    errors.value.enterpriseRegister.password = '密码至少6位'
    isValid = false
  } else if (enterpriseRegisterForm.value.password.length > 20) {
    errors.value.enterpriseRegister.password = '密码最多20位'
    isValid = false
  }

  if (!enterpriseRegisterForm.value.confirmPassword) {
    errors.value.enterpriseRegister.confirmPassword = '请确认密码'
    isValid = false
  } else if (enterpriseRegisterForm.value.password !== enterpriseRegisterForm.value.confirmPassword) {
    errors.value.enterpriseRegister.confirmPassword = '两次密码输入不一致'
    isValid = false
  }

  return isValid
}

// 处理登录
const handleLogin = async () => {
  if (!validateLoginForm()) {
    return
  }

  loading.value = true

  try {
    console.log('🔐 尝试登录，记住我：', loginForm.value.remember)
    
    const success = await userStore.login(
      loginForm.value.username,
      loginForm.value.password,
      loginForm.value.remember
    )

    if (success) {
      ElMessage.success('登录成功')
      // 跳转到首页
      setTimeout(() => {
        router.push('/home')
      }, 500)
    } else {
      ElMessage.error('手机号或密码错误')
    }
  } catch (error) {
    ElMessage.error('登录失败，请重试')
  } finally {
    loading.value = false
  }
}

// 处理注册
const handleRegister = async () => {
  // 个人注册使用简单逻辑（兼容模板）
  if (!validateRegisterForm()) {
    return
  }

  loading.value = true

  try {
    const result = await userStore.register(
      registerForm.value.phone,
      registerForm.value.password
    )

    if (result.success) {
      ElMessage.success('注册成功，正在跳转...')
      setTimeout(() => {
        router.push('/home')
      }, 500)
    } else {
      ElMessage.error(result.message)
    }
  } catch (error) {
    ElMessage.error('注册失败，请重试')
  } finally {
    loading.value = false
  }
}

// 处理个人注册
const handlePersonalRegister = async () => {
  if (!validatePersonalRegisterForm()) {
    return
  }

  loading.value = true

  try {
    const result = await userStore.register(
      personalRegisterForm.value.phone,
      personalRegisterForm.value.password
    )

    if (result.success) {
      ElMessage.success('注册成功，正在跳转...')
      // 跳转到首页
      setTimeout(() => {
        router.push('/home')
      }, 500)
    } else {
      ElMessage.error(result.message)
    }
  } catch (error) {
    ElMessage.error('注册失败，请重试')
  } finally {
    loading.value = false
  }
}

// 处理企业注册
const handleEnterpriseRegister = async () => {
  if (!validateEnterpriseRegisterForm()) {
    return
  }

  loading.value = true

  try {
    const result = await userStore.registerEnterprise(
      enterpriseRegisterForm.value.companyName,
      enterpriseRegisterForm.value.contactName,
      enterpriseRegisterForm.value.contactPhone,
      enterpriseRegisterForm.value.password
    )

    if (result.success) {
      ElMessage.success('注册成功，正在跳转...')
      // 跳转到首页
      setTimeout(() => {
        router.push('/home')
      }, 500)
    } else {
      ElMessage.error(result.message)
    }
  } catch (error) {
    ElMessage.error('注册失败，请重试')
  } finally {
    loading.value = false
  }
}

// 发送短信验证码
const sendSmsCode = async () => {
  const phone = registerType.value === 'personal' 
    ? personalRegisterForm.value.phone 
    : enterpriseRegisterForm.value.contactPhone

  if (!phone) {
    ElMessage.error('请输入手机号')
    return
  }

  if (!/^1[3-9]\d{9}$/.test(phone)) {
    ElMessage.error('请输入正确的手机号')
    return
  }

  if (smsCodeSent.value && smsCountdown.value > 0) {
    return
  }

  try {
    // 模拟发送短信验证码
    await new Promise(resolve => setTimeout(resolve, 500))
    
    ElMessage.success('验证码已发送')
    smsCodeSent.value = true
    smsCountdown.value = 60

    // 倒计时
    smsTimer = window.setInterval(() => {
      smsCountdown.value--
      if (smsCountdown.value <= 0) {
        smsCodeSent.value = false
        if (smsTimer) {
          clearInterval(smsTimer)
          smsTimer = null
        }
      }
    }, 1000)
  } catch (error) {
    ElMessage.error('发送失败，请重试')
  }
}

// 忘记密码
const handleForgotPassword = () => {
  ElMessage.info('请联系客服重置密码：meijiameihu@yatianshare.cn')
}


</script>

<template>
  <div class="auth-page">
    <NavigationBar />
    
    <div class="auth-container">
      <div class="auth-card">
        <!-- 标签切换 -->
        <div class="auth-tabs">
          <button 
            class="tab-btn" 
            :class="{ active: mode === 'login' }"
            @click="switchMode('login')"
          >
            登录
          </button>
          <button 
            class="tab-btn" 
            :class="{ active: mode === 'register' }"
            @click="switchMode('register')"
          >
            注册
          </button>
        </div>

        <!-- 登录表单 -->
        <div v-if="mode === 'login'" class="auth-form-container">
          <div class="form-header">
            <h1>欢迎回来</h1>
            <p class="subtitle">登录您的账号，继续使用美家美户</p>
          </div>

          <form class="auth-form" @submit.prevent="handleLogin">
            <div class="form-group" :class="{ 'has-error': errors.login.username }">
              <label>
                <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
                  <line x1="12" y1="18" x2="12.01" y2="18"></line>
                </svg>
                手机号
              </label>
              <input 
                v-model="loginForm.username" 
                type="tel" 
                placeholder="请输入手机号" 
                autocomplete="username"
                :disabled="loading"
              />
              <span v-if="errors.login.username" class="error-message">{{ errors.login.username }}</span>
            </div>

            <div class="form-group" :class="{ 'has-error': errors.login.password }">
              <label>
                <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                密码
              </label>
              <div class="password-input-wrapper">
                <input 
                  v-model="loginForm.password" 
                  :type="showLoginPassword ? 'text' : 'password'" 
                  placeholder="请输入密码"
                  autocomplete="current-password"
                  :disabled="loading"
                />
                <button 
                  type="button"
                  class="password-toggle"
                  @click="togglePasswordVisibility('login')"
                  :disabled="loading"
                >
                  <svg v-if="!showLoginPassword" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                  <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                </button>
              </div>
              <span v-if="errors.login.password" class="error-message">{{ errors.login.password }}</span>
            </div>

            <div class="form-options">
              <span class="forgot-link" @click="handleForgotPassword">忘记密码？</span>
            </div>

            <div class="terms-agreement">
              <label class="checkbox-label">
                <input type="checkbox" v-model="agreeToTerms" />
                <span>已阅读并同意</span>
                <a href="javascript:void(0)" @click.prevent="showTermsDialog = true" class="terms-link">《美家美户AI付费服务协议》</a>
              </label>
            </div>

            <button type="submit" class="submit-btn" :disabled="loading">
              <span v-if="!loading" class="btn-content">
                <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                  <polyline points="10 17 15 12 10 7"></polyline>
                  <line x1="15" y1="12" x2="3" y2="12"></line>
                </svg>
                登录
              </span>
              <span v-else class="btn-loading">
                <span class="spinner"></span>
                登录中...
              </span>
            </button>
          </form>
        </div>

        <!-- 注册表单 -->
        <div v-if="mode === 'register'" class="auth-form-container">
          <div class="form-header">
            <h1>创建账号</h1>
            <p class="subtitle">开启您的 AI 家居设计之旅</p>
          </div>

          <!-- 用户类型选择 -->
          <div class="user-type-tabs">
            <button 
              type="button"
              class="type-tab" 
              :class="{ active: registerType === 'personal' }"
              @click="switchRegisterType('personal')"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              个人用户
            </button>
            <button 
              type="button"
              class="type-tab" 
              :class="{ active: registerType === 'enterprise' }"
              @click="switchRegisterType('enterprise')"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="7" height="7"></rect>
                <rect x="14" y="3" width="7" height="7"></rect>
                <rect x="14" y="14" width="7" height="7"></rect>
                <rect x="3" y="14" width="7" height="7"></rect>
              </svg>
              企业用户
            </button>
          </div>

          <!-- 个人用户注册表单 -->
          <form v-if="registerType === 'personal'" class="auth-form" @submit.prevent="handleRegister">
            <div class="form-group" :class="{ 'has-error': errors.register.phone }">
              <label>
                <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
                  <line x1="12" y1="18" x2="12.01" y2="18"></line>
                </svg>
                手机号
              </label>
              <input 
                v-model="registerForm.phone" 
                type="tel" 
                placeholder="请输入手机号"
                :disabled="loading"
              />
              <span v-if="errors.register.phone" class="error-message">{{ errors.register.phone }}</span>
            </div>

            <div class="form-group" :class="{ 'has-error': errors.register.password }">
              <label>
                <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                密码
              </label>
              <div class="password-input-wrapper">
                <input 
                  v-model="registerForm.password" 
                  :type="showRegisterPassword ? 'text' : 'password'" 
                  placeholder="请输入密码（6-20位）"
                  autocomplete="new-password"
                  :disabled="loading"
                />
                <button 
                  type="button"
                  class="password-toggle"
                  @click="togglePasswordVisibility('register')"
                  :disabled="loading"
                >
                  <svg v-if="!showRegisterPassword" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                  <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                </button>
              </div>
              <span v-if="errors.register.password" class="error-message">{{ errors.register.password }}</span>
            </div>

            <div class="form-group" :class="{ 'has-error': errors.register.confirmPassword }">
              <label>
                <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                确认密码
              </label>
              <div class="password-input-wrapper">
                <input 
                  v-model="registerForm.confirmPassword" 
                  :type="showRegisterConfirmPassword ? 'text' : 'password'" 
                  placeholder="请再次输入密码"
                  autocomplete="new-password"
                  :disabled="loading"
                />
                <button 
                  type="button"
                  class="password-toggle"
                  @click="togglePasswordVisibility('confirm')"
                  :disabled="loading"
                >
                  <svg v-if="!showRegisterConfirmPassword" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                  <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                </button>
              </div>
              <span v-if="errors.register.confirmPassword" class="error-message">{{ errors.register.confirmPassword }}</span>
            </div>

            <div class="form-group">
              <label>
                <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"></path>
                </svg>
                邀请码（选填）
              </label>
              <input 
                v-model="registerForm.inviteCode" 
                type="text" 
                placeholder="如有邀请码请输入"
                :disabled="loading"
              />
            </div>

            <div class="terms-agreement">
              <label class="checkbox-label">
                <input type="checkbox" v-model="agreeToTerms" />
                <span>已阅读并同意</span>
                <a href="javascript:void(0)" @click.prevent="showTermsDialog = true" class="terms-link">《美家美户AI付费服务协议》</a>
              </label>
            </div>

            <button type="submit" class="submit-btn" :disabled="loading">
              <span v-if="!loading" class="btn-content">
                <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="8.5" cy="7" r="4"></circle>
                  <line x1="20" y1="8" x2="20" y2="14"></line>
                  <line x1="23" y1="11" x2="17" y2="11"></line>
                </svg>
                登录
              </span>
              <span v-else class="btn-loading">
                <span class="spinner"></span>
                登录中...
              </span>
            </button>
          </form>

          <!-- 企业用户注册表单 -->
          <form v-else class="auth-form" @submit.prevent="handleEnterpriseRegister">
            <div class="form-group" :class="{ 'has-error': errors.enterpriseRegister.companyName }">
              <label>
                <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="3" width="7" height="7"></rect>
                  <rect x="14" y="3" width="7" height="7"></rect>
                  <rect x="14" y="14" width="7" height="7"></rect>
                  <rect x="3" y="14" width="7" height="7"></rect>
                </svg>
                公司名称
              </label>
              <input 
                v-model="enterpriseRegisterForm.companyName" 
                type="text" 
                placeholder="请输入公司名称"
                :disabled="loading"
              />
              <span v-if="errors.enterpriseRegister.companyName" class="error-message">{{ errors.enterpriseRegister.companyName }}</span>
            </div>

            <div class="form-group" :class="{ 'has-error': errors.enterpriseRegister.contactName }">
              <label>
                <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                联系人姓名
              </label>
              <input 
                v-model="enterpriseRegisterForm.contactName" 
                type="text" 
                placeholder="请输入联系人姓名"
                :disabled="loading"
              />
              <span v-if="errors.enterpriseRegister.contactName" class="error-message">{{ errors.enterpriseRegister.contactName }}</span>
            </div>

            <div class="form-group" :class="{ 'has-error': errors.enterpriseRegister.contactPhone }">
              <label>
                <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
                  <line x1="12" y1="18" x2="12.01" y2="18"></line>
                </svg>
                联系电话
              </label>
              <input 
                v-model="enterpriseRegisterForm.contactPhone" 
                type="tel" 
                placeholder="请输入手机号"
                :disabled="loading"
              />
              <span v-if="errors.enterpriseRegister.contactPhone" class="error-message">{{ errors.enterpriseRegister.contactPhone }}</span>
            </div>

            <div class="form-group" :class="{ 'has-error': errors.enterpriseRegister.smsCode }">
              <label>
                <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="2" y="4" width="20" height="16" rx="2"></rect>
                  <path d="M22 6l-10 7L2 6"></path>
                </svg>
                短信验证码
              </label>
              <div class="sms-input-wrapper">
                <input 
                  v-model="enterpriseRegisterForm.smsCode" 
                  type="text" 
                  placeholder="请输入验证码"
                  :disabled="loading"
                />
                <button 
                  type="button"
                  class="sms-btn"
                  @click="sendSmsCode"
                  :disabled="loading || (smsCodeSent && smsCountdown > 0)"
                >
                  {{ smsCodeSent && smsCountdown > 0 ? `${smsCountdown}秒后重试` : '发送验证码' }}
                </button>
              </div>
              <span v-if="errors.enterpriseRegister.smsCode" class="error-message">{{ errors.enterpriseRegister.smsCode }}</span>
            </div>

            <div class="form-group" :class="{ 'has-error': errors.enterpriseRegister.password }">
              <label>
                <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                密码
              </label>
              <div class="password-input-wrapper">
                <input 
                  v-model="enterpriseRegisterForm.password" 
                  :type="showRegisterPassword ? 'text' : 'password'" 
                  placeholder="请输入密码（6-20位）"
                  autocomplete="new-password"
                  :disabled="loading"
                />
                <button 
                  type="button"
                  class="password-toggle"
                  @click="togglePasswordVisibility('register')"
                  :disabled="loading"
                >
                  <svg v-if="!showRegisterPassword" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                  <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                </button>
              </div>
              <span v-if="errors.enterpriseRegister.password" class="error-message">{{ errors.enterpriseRegister.password }}</span>
            </div>

            <div class="form-group" :class="{ 'has-error': errors.enterpriseRegister.confirmPassword }">
              <label>
                <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                确认密码
              </label>
              <div class="password-input-wrapper">
                <input 
                  v-model="enterpriseRegisterForm.confirmPassword" 
                  :type="showRegisterConfirmPassword ? 'text' : 'password'" 
                  placeholder="请再次输入密码"
                  autocomplete="new-password"
                  :disabled="loading"
                />
                <button 
                  type="button"
                  class="password-toggle"
                  @click="togglePasswordVisibility('confirm')"
                  :disabled="loading"
                >
                  <svg v-if="!showRegisterConfirmPassword" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                  <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                </button>
              </div>
              <span v-if="errors.enterpriseRegister.confirmPassword" class="error-message">{{ errors.enterpriseRegister.confirmPassword }}</span>
            </div>

            <div class="form-group">
              <label>
                <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"></path>
                </svg>
                邀请码（选填）
              </label>
              <input 
                v-model="enterpriseRegisterForm.inviteCode" 
                type="text" 
                placeholder="如有邀请码请输入"
                :disabled="loading"
              />
            </div>

            <div class="terms-agreement">
              <label class="checkbox-label">
                <input type="checkbox" v-model="agreeToTerms" />
                <span>已阅读并同意</span>
                <a href="javascript:void(0)" @click.prevent="showTermsDialog = true" class="terms-link">《美家美户AI付费服务协议》</a>
              </label>
            </div>

            <button type="submit" class="submit-btn" :disabled="loading">
              <span v-if="!loading" class="btn-content">
                <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="3" width="7" height="7"></rect>
                  <rect x="14" y="3" width="7" height="7"></rect>
                  <rect x="14" y="14" width="7" height="7"></rect>
                  <rect x="3" y="14" width="7" height="7"></rect>
                </svg>
                登录
              </span>
              <span v-else class="btn-loading">
                <span class="spinner"></span>
                登录中...
              </span>
            </button>
          </form>
        </div>

      </div>
    </div>

    <!-- 服务协议弹窗 -->
    <div v-if="showTermsDialog" class="terms-dialog-overlay" @click="showTermsDialog = false">
      <div class="terms-dialog" @click.stop>
        <div class="terms-header">
          <h2>美家美户AI付费服务协议</h2>
          <button class="close-btn" @click="showTermsDialog = false">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div class="terms-content">
          <p><strong>更新日期：</strong>2026年1月16日</p>
          <p><strong>生效日期：</strong>2026年1月16日</p>
          
          <p>欢迎您使用美家美户AI付费服务！本服务为付费服务。您可以先注册或登录"美家美户AI"后，再进行付费服务的购买、使用；也可以游客身份购买使用，但因未绑定信息则切换手机号后无法继续使用。</p>
          
          <p>为使用付费服务，您应当阅读并遵守"美家美户AI"《付费服务协议》（以下简称"本协议"）、"美家美户AI"《用户协议》、《隐私政策》和产品页面提示说明等协议及规则（以下统称"服务协议及规则"）。</p>
          
          <p>您在申请开通付费服务并进入购买程序前，请您务必审慎阅读、充分理解各服务协议及规则，特别是免除或限制责任条款、法律适用和争议解决条款以及购买或使用某项服务的单独协议和/或规则。</p>
          
          <p>如果您因年龄、智力等因素而不具有完全民事行为能力，请在监护人的陪同下阅读并判断是否同意本协议，并特别注意服务协议及规则中的未成年人使用条款。</p>
          
          <p>如果您不同意本协议或其中任何条款，请您立即停止开通服务。当您按照服务开通页面提示阅读并同意本协议、点击"同意"或"下一步"或"确认支付"等按钮、完成全部开通程序或使用本服务，即表示您已充分阅读、理解、接受本协议的全部内容并完成本协议的签署，也即，您与本服务提供方针对服务的购买和提供达成一致约定，本协议即在您与公司之间产生法律效力，成为对双方均具有约束力的法律文件。</p>
          
          <h3>一、定义及适用范围</h3>
          <p>1. 本协议是您与我们之间就您购买使用付费服务或会员、算力等服务所订立的协议。</p>
          <p>2. 本协议的有效组成部分也包括我们已经发布及后续可能不断发布的关于服务的相关协议、规则、产品页面说明和提示等内容。</p>
          <p>3. 美家美户AI付费服务权益（"付费权益"）：指用户基于本协议完成服务的购买后所享有的权益内容。</p>
          <p>4. 算力：指用户在"美家美户AI"中购买和使用的一种兑换增值服务的工具。</p>
          
          <h3>二、服务开通、权益内容、服务期限及收费标准</h3>
          <p>1. 您在开通付费服务前，需要先注册或登录美家美户AI，请您务必注意，为确保您所购买的权益和功能的正常实现，您须绑定手机号登录美家美户AI。</p>
          <p>2. 您可通过各种已有和未来新增的支付渠道或公司指定的方式完成付费服务的购买。</p>
          <p>3. 您开通的服务包括的实际权益可能会根据公司业务发展和安排出现新增或减少，请您以实际购买服务时的页面展示权益为准。</p>
          <p>4. 付费服务的服务期限以您自行选择并支付的服务费用所对应的服务期限为准。</p>
          <p>5. 基于权益调整、市场与业务的发展，公司可能会调整本服务开通所需服务费用。</p>
          <p>6. 公司仅提供相关的网络服务，除此之外与相关网络服务有关的设备及所需的费用均应由您自行负担。</p>
          <p>7. 自您成功开通本服务之日起，您可登录美家美户AI帐号相关页面查询您的付费权益、算力信息。</p>
          <p>8. 由于本服务付费权益为虚拟内容消费，除法律法规另有规定外，完成支付和购买后，不可进行退款和转让。</p>
          
          <h3>三、服务使用</h3>
          <p>1. 付费权益仅限您本人通过您注册的美家美户AI帐号使用。未经公司书面同意，禁止以任何形式赠与、借用、出租、转让、售卖或者其他方式许可他人使用该帐号及帐号项下的服务/付费权益。</p>
          <p>2. 如您存在违法/不当使用本服务的情形，公司有权取消/作废您的付费权益且您不应要求公司退还您所支付的本服务费用。</p>
          <p>3. 如您通过任何不正当手段或以违反诚实信用原则的方式开通本服务的，公司有权拒绝您的开通申请、终止已开通的本服务。</p>
          <p>4. 您知悉并同意，为保证您充分享受本服务、避免您错过优质付费权益，公司可能通过消息、通知、短信等形式，向您提供付费权益相关信息。</p>
          
          <h3>四、付费权益充值规范</h3>
          <p>1. 您只能通过"美家美户AI"认可的渠道和方式，通过自己的支付账户为自己的账号进行付费权益或算力充值。</p>
          <p>2. 您在每次进行充值操作前，务必仔细确认充值需求、充值金额、充值帐户、操作系统与渠道等信息是否准确无误。</p>
          <p>3. 如用户在充值过程中存在违反法律法规规定或相关协议、本条款中约定的行为的，违规的充值额将被扣除。</p>
          <p>4. 充值成功后的使用行为，应符合"美家美户AI"相关功能界面的说明和指引。您应确认，任何付费权益均不支持提现、转帐等流通，也不支持转移、赠送操作。</p>
          
          <h3>五、服务中止、终止及变更</h3>
          <p>1. 本服务的中止或终止包含如下情况：您主动中止或终止；因为您的违约行为，公司主动中止或终止服务的；因国家或相关政府监管部门要求或发生不可抗力事件时，公司中止或终止服务的；其他根据法律法规应中止或终止服务的。</p>
          <p>2. 您知悉并确认，您开通本服务后，如您中途主动取消本服务、放弃付费权益或终止付费权益用户资格，或公司根据法律法规、本协议或其他服务协议及规则注销您的帐号、终止您的付费权益用户资格的，您不应要求退还对应服务费用的部分或全部。</p>
          <p>3. 本协议终止后，您无权要求公司继续提供任何服务或履行任何其他义务。</p>
          <p>4. 由于互联网高速发展，公司可根据国家法律法规变化、业务实际变更需求、保护用户权益的需要等，不时修改本协议。</p>
          
          <h3>六、知识产权</h3>
          <p>1. 公司在本协议项下所提供的服务及内容的知识产权均归属于公司和/或公司的关联方。</p>
          <p>2. 未经公司和/或相关权利人的授权许可，任何人不得擅自将本服务项下的产品/服务/资料/内容等用于任何商业或非商业目的。</p>
          <p>3. 未经公司和/或相关权利人的授权许可，用户不得以获取直接或间接经济利益为目的，采用收费或免费的方式，复制、编辑、翻拍、翻制、修改、转载、出版、汇编、发表、引用、传播本服务项下的模板的任何信息内容。</p>
          
          <h3>七、未成年人使用</h3>
          <p>1. 若您是未满18周岁的未成年人，您应在监护人监护、指导并获得监护人同意情况下认真阅读本协议和使用本服务。</p>
          <p>2. 未成年用户应理解如因您违反法律法规、本协议内容，则您及您的监护人应依照法律规定承担由此可能引发的全部法律责任及后果。</p>
          <p>3. 监护人特别提示：如您的被监护人使用美家美户AI服务的，您作为监护人应指导并监督被监护人的注册和使用行为。</p>
          
          <h3>八、其他</h3>
          <p>1. 本协议任一条款被视为废止、无效或不可执行，并不影响本协议其余条款的有效性及可执行性。</p>
          <p>2. 本协议的成立、生效、履行、解释及争议的解决均应适用中华人民共和国法律。</p>
          <p>3. 本协议的签订地为中华人民共和国北京市。若因本协议发生任何争议，双方应尽量友好协商解决；如协商不成的，您同意将相关争议提交至本协议签订地的人民法院诉讼解决。</p>
          <p>4. 本协议与其他服务协议及规则就同一事项有冲突约定的，应以本协议约定为准。</p>
          <p>5. 如您在使用本服务过程中有任何疑问、意见或建议，请联系官方客服进行反馈或通过美家美户AI官方邮箱meijiameihu@yatianshare.cn联系我们进行反馈。</p>
        </div>
        <div class="terms-footer">
          <button class="agree-btn" @click="agreeToTerms = true; showTermsDialog = false">同意并继续</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.auth-page {
  min-height: 100vh;
  background: linear-gradient(to bottom, 
    #f0f4ff 0%, 
    #e8f0ff 30%, 
    #f5f7fa 60%, 
    #f5f7fa 100%
  );
  padding-top: 70px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding-bottom: 2rem;
}

.auth-container {
  width: 100%;
  max-width: 480px;
  padding: 2rem;
}

.auth-card {
  background: white;
  border-radius: 2rem;
  padding: 2.5rem;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1), 0 2px 8px rgba(0, 0, 0, 0.06);
  animation: slideUp 0.5s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// 标签切换
.auth-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 2rem;
  background: #f5f7fa;
  padding: 0.375rem;
  border-radius: 1rem;

  .tab-btn {
    flex: 1;
    padding: 0.75rem 1.5rem;
    border: none;
    background: transparent;
    border-radius: 0.75rem;
    font-size: 1rem;
    font-weight: 600;
    color: #718096;
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover {
      color: #1890ff;
    }

    &.active {
      background: white;
      color: #1890ff;
      box-shadow: 0 2px 8px rgba(24, 144, 255, 0.15);
    }
  }
}

// 用户类型选择
.user-type-tabs {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 2rem;

  .type-tab {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    padding: 1rem;
    border: 2px solid #e2e8f0;
    background: white;
    border-radius: 0.75rem;
    font-size: 0.9375rem;
    font-weight: 500;
    color: #4a5568;
    cursor: pointer;
    transition: all 0.3s ease;

    svg {
      width: 24px;
      height: 24px;
      stroke: #718096;
      transition: all 0.3s ease;
    }

    &:hover {
      border-color: #1890ff;
      color: #1890ff;

      svg {
        stroke: #1890ff;
      }
    }

    &.active {
      border-color: #1890ff;
      background: rgba(24, 144, 255, 0.05);
      color: #1890ff;
      box-shadow: 0 0 0 3px rgba(24, 144, 255, 0.1);

      svg {
        stroke: #1890ff;
      }
    }
  }
}

// 表单容器
.auth-form-container {
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.form-header {
  text-align: center;
  margin-bottom: 2rem;

  h1 {
    font-size: 1.875rem;
    font-weight: 700;
    color: #1a1a1a;
    margin-bottom: 0.5rem;
  }

  .subtitle {
    color: #718096;
    font-size: 0.9375rem;
  }
}

// 表单样式
.auth-form {
  .form-group {
    margin-bottom: 1.25rem;
    position: relative;

    &.has-error {
      input {
        border-color: #f5222d;
        
        &:focus {
          border-color: #f5222d;
          box-shadow: 0 0 0 3px rgba(245, 34, 45, 0.1);
        }
      }
    }

    label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      font-weight: 600;
      color: #2d3748;
      margin-bottom: 0.5rem;

      .input-icon {
        width: 16px;
        height: 16px;
        stroke: #718096;
      }
    }

    input {
      width: 100%;
      padding: 0.875rem 1rem;
      border: 2px solid #e2e8f0;
      border-radius: 0.75rem;
      font-size: 0.9375rem;
      transition: all 0.3s ease;
      background: #fafafa;

      &:focus {
        outline: none;
        border-color: #1890ff;
        background: white;
        box-shadow: 0 0 0 3px rgba(24, 144, 255, 0.1);
      }

      &:disabled {
        background: #f5f5f5;
        cursor: not-allowed;
        opacity: 0.6;
      }

      &::placeholder {
        color: #cbd5e0;
      }
    }

    // 密码输入框容器
    .password-input-wrapper {
      position: relative;
      display: flex;
      align-items: center;

      input {
        padding-right: 3rem;
      }

      .password-toggle {
        position: absolute;
        right: 0.75rem;
        top: 50%;
        transform: translateY(-50%);
        background: transparent;
        border: none;
        padding: 0.375rem;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 0.375rem;
        transition: all 0.2s ease;

        svg {
          width: 20px;
          height: 20px;
          stroke: #718096;
          transition: all 0.2s ease;
        }

        &:hover:not(:disabled) {
          background: rgba(24, 144, 255, 0.08);

          svg {
            stroke: #1890ff;
          }
        }

        &:disabled {
          cursor: not-allowed;
          opacity: 0.5;
        }
      }
    }

    // 短信验证码输入框容器
    .sms-input-wrapper {
      position: relative;
      display: flex;
      gap: 0.5rem;

      input {
        flex: 1;
      }

      .sms-btn {
        padding: 0.875rem 1rem;
        background: white;
        color: #1890ff;
        border: 2px solid #1890ff;
        border-radius: 0.75rem;
        font-size: 0.875rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
        white-space: nowrap;

        &:hover:not(:disabled) {
          background: #1890ff;
          color: white;
        }

        &:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          background: #f5f5f5;
          color: #999;
          border-color: #e2e8f0;
        }
      }
    }

    .error-message {
      display: block;
      margin-top: 0.375rem;
      font-size: 0.8125rem;
      color: #f5222d;
      animation: slideDown 0.3s ease;
    }
  }

  .form-options {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    margin-bottom: 1.5rem;

    .forgot-link {
      font-size: 0.875rem;
      color: #1890ff;
      font-weight: 500;
      cursor: pointer;

      &:hover {
        text-decoration: underline;
      }
    }
  }

  .submit-btn {
    width: 100%;
    padding: 1rem;
    background: linear-gradient(135deg, #1890ff 0%, #1890ff 100%);
    color: white;
    border: none;
    border-radius: 0.75rem;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    box-shadow: 0 4px 12px rgba(24, 144, 255, 0.3);

    .btn-content,
    .btn-loading {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .btn-icon {
      width: 20px;
      height: 20px;
    }

    .spinner {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    &:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(24, 144, 255, 0.4);
    }

    &:active:not(:disabled) {
      transform: translateY(0);
    }

    &:disabled {
      opacity: 0.7;
      cursor: not-allowed;
      transform: none;
    }
  }
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

// 分割线
.divider {
  position: relative;
  text-align: center;
  margin: 2rem 0 1.5rem;

  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    height: 1px;
    background: #e2e8f0;
  }

  span {
    position: relative;
    display: inline-block;
    padding: 0 1rem;
    background: white;
    color: #a0aec0;
    font-size: 0.875rem;
  }
}

// 社交登录
.social-login {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;

  .social-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.875rem 1rem;
    border: 2px solid #e2e8f0;
    background: white;
    border-radius: 0.75rem;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;

    svg {
      width: 20px;
      height: 20px;
    }

    &:hover {
      border-color: #cbd5e0;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    }

    &.wechat {
      color: #09bb07;

      &:hover {
        border-color: #09bb07;
        background: rgba(9, 187, 7, 0.05);
      }
    }

    &.phone {
      color: #1890ff;

      &:hover {
        border-color: #1890ff;
        background: rgba(24, 144, 255, 0.05);
      }
    }
  }
}

// 响应式
@media (max-width: 640px) {
  .auth-container {
    padding: 1rem;
  }

  .auth-card {
    padding: 2rem 1.5rem;
  }

  .form-header h1 {
    font-size: 1.5rem;
  }

  .social-login {
    grid-template-columns: 1fr;
  }
}

// 登录模态框
.login-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  animation: fadeIn 0.3s ease;
  padding: 1rem;
}

.modal-content {
  position: relative;
  background: white;
  border-radius: 1.5rem;
  padding: 2.5rem 2rem;
  max-width: 480px;
  width: 100%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.3s ease;
}

.modal-close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: transparent;
  border: none;
  color: #999;
  font-size: 1.8rem;
  cursor: pointer;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  border-radius: 50%;
  
  &:hover {
    background: #f5f5f5;
    color: #333;
  }
}

.modal-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1a1a1a;
  text-align: center;
  margin-bottom: 0.5rem;
}

.modal-subtitle {
  text-align: center;
  color: #718096;
  font-size: 0.9375rem;
  margin-bottom: 2rem;
}

// 微信登录
.wechat-login-content {
  text-align: center;
}

.qrcode-container {
  display: flex;
  justify-content: center;
  margin-bottom: 1.5rem;
  
  .qrcode-image {
    width: 240px;
    height: 240px;
    border: 2px solid #e8e8e8;
    border-radius: 1rem;
    padding: 1rem;
    background: #fafafa;
  }
}

.qrcode-tips {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  color: #09bb07;
  font-size: 0.9375rem;
  margin-bottom: 1rem;
  
  svg {
    width: 20px;
    height: 20px;
  }
}

.auto-register-tip {
  text-align: center;
  color: #999;
  font-size: 0.8125rem;
  margin-top: 1rem;
}

// 手机号登录
.phone-login-content {
  .modal-subtitle {
    margin-bottom: 2rem;
  }
}

.phone-login-form {
  .form-group {
    margin-bottom: 1.25rem;

    &.has-error {
      input {
        border-color: #f5222d;
      }
    }

    label {
      display: block;
      font-size: 0.875rem;
      font-weight: 600;
      color: #2d3748;
      margin-bottom: 0.5rem;
    }

    input {
      width: 100%;
      padding: 0.875rem 1rem;
      border: 2px solid #e2e8f0;
      border-radius: 0.75rem;
      font-size: 0.9375rem;
      transition: all 0.3s ease;
      background: #fafafa;

      &:focus {
        outline: none;
        border-color: #1890ff;
        background: white;
        box-shadow: 0 0 0 3px rgba(24, 144, 255, 0.1);
      }

      &:disabled {
        background: #f5f5f5;
        cursor: not-allowed;
        opacity: 0.6;
      }
    }

    .error-message {
      display: block;
      margin-top: 0.375rem;
      font-size: 0.8125rem;
      color: #f5222d;
    }
  }

  .code-input-wrapper {
    display: flex;
    gap: 0.5rem;

    input {
      flex: 1;
    }

    .send-code-btn {
      padding: 0.875rem 1rem;
      background: white;
      color: #1890ff;
      border: 2px solid #1890ff;
      border-radius: 0.75rem;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.3s ease;
      white-space: nowrap;

      &:hover:not(:disabled) {
        background: #1890ff;
        color: white;
      }

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        background: #f5f5f5;
        color: #999;
        border-color: #e2e8f0;
      }
    }
  }
}

.phone-login-btn {
  width: 100%;
  padding: 1rem;
  background: linear-gradient(135deg, #1890ff 0%, #1890ff 100%);
  color: white;
  border: none;
  border-radius: 0.75rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;

  svg {
    width: 20px;
    height: 20px;
  }

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(24, 144, 255, 0.4);
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
  }

  .btn-loading {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
}

@media (max-width: 640px) {
  .modal-content {
    padding: 2rem 1.5rem;
    margin: 0 1rem;
  }

  .qrcode-container .qrcode-image {
    width: 200px;
    height: 200px;
  }
}

// 协议同意样式
.terms-agreement {
  margin: 1.5rem 0;
  
  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    color: #666;
    cursor: pointer;
    user-select: none;
    
    input[type="checkbox"] {
      width: 18px;
      height: 18px;
      cursor: pointer;
      margin: 0;
      flex-shrink: 0;
      accent-color: #1890ff;
      
      // 自定义复选框样式
      appearance: none;
      -webkit-appearance: none;
      border: 2px solid #d0d0d0;
      border-radius: 4px;
      background: white;
      position: relative;
      transition: all 0.3s ease;
      
      &:hover {
        border-color: #1890ff;
      }
      
      &:checked {
        background: #1890ff;
        border-color: #1890ff;
        
        &::after {
          content: '';
          position: absolute;
          left: 5px;
          top: 2px;
          width: 4px;
          height: 8px;
          border: solid white;
          border-width: 0 2px 2px 0;
          transform: rotate(45deg);
        }
      }
    }
    
    span {
      flex-shrink: 0;
    }
    
    .terms-link {
      color: #1890ff;
      text-decoration: none;
      flex-shrink: 0;
      
      &:hover {
        text-decoration: underline;
      }
    }
  }
}

// 协议弹窗样式
.terms-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 1rem;
}

.terms-dialog {
  background: white;
  border-radius: 1rem;
  max-width: 800px;
  width: 100%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.terms-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #e8e8e8;
  
  h2 {
    font-size: 1.25rem;
    font-weight: 600;
    color: #1a1a1a;
    margin: 0;
  }
  
  .close-btn {
    width: 32px;
    height: 32px;
    border: none;
    background: transparent;
    color: #666;
    cursor: pointer;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
    
    svg {
      width: 20px;
      height: 20px;
    }
    
    &:hover {
      background: #f5f5f5;
      color: #1a1a1a;
    }
  }
}

.terms-content {
  flex: 1;
  overflow-y: auto;
  padding: 2rem;
  
  p {
    margin-bottom: 1rem;
    line-height: 1.6;
    color: #333;
    font-size: 0.875rem;
  }
  
  h3 {
    font-size: 1rem;
    font-weight: 600;
    color: #1a1a1a;
    margin: 1.5rem 0 1rem;
  }
  
  strong {
    font-weight: 600;
    color: #1a1a1a;
  }
}

.terms-footer {
  padding: 1.5rem 2rem;
  border-top: 1px solid #e8e8e8;
  display: flex;
  justify-content: center;
  
  .agree-btn {
    padding: 0.75rem 2rem;
    background: linear-gradient(135deg, #1890ff 0%, #1890ff 100%);
    color: white;
    border: none;
    border-radius: 9999px;
    font-size: 0.9375rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 30px rgba(24, 144, 255, 0.4);
    }
  }
}
</style>

