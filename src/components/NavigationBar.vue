<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores'

const router = useRouter()
const userStore = useUserStore()
const activeDropdown = ref<string | null>(null)
let closeTimer: number | null = null

const isLoggedIn = computed(() => userStore.loggedIn)
const avatar = computed(() => userStore.avatar)

// 合伙人弹窗状态（保留用于可能的其他用途）
const showPartnerDialog = ref(false)

const showDropdown = (menu: string) => {
  if (closeTimer) {
    clearTimeout(closeTimer)
    closeTimer = null
  }
  activeDropdown.value = menu
}

const hideDropdown = () => {
  closeTimer = window.setTimeout(() => {
    activeDropdown.value = null
  }, 200)
}

// 需要登录的路由列表
const protectedRoutes = [
  '/upload',
  '/interior-history',
  '/furniture-placement',
  '/furniture-history',
  '/video-generation',
  '/video-history',
  '/digital-human',
  '/digital-human-history'
]

const navigateTo = (path: string) => {
  activeDropdown.value = null
  
  // 检查是否需要登录
  if (protectedRoutes.includes(path)) {
    if (!userStore.isLoggedIn) {
      ElMessage.warning('请先登录后再使用此功能')
      setTimeout(() => {
        router.push('/login')
      }, 1500)
      return
    }
  }
  
  router.push(path)
}

const handleLogout = () => {
  userStore.logout()
  activeDropdown.value = null
  router.push('/login')
}
</script>

<template>
  <nav class="navigation-bar">
    <div class="nav-container">
      <div class="nav-logo" @click="navigateTo('/')">
        <img src="/images/logo.png" alt="美家美户" class="logo-image" />
      </div>

      <div class="nav-menu">
        <div class="nav-item" @click="navigateTo('/home')">
          <span>首页</span>
        </div>

        <div 
          class="nav-item has-dropdown"
          @mouseenter="showDropdown('interior')"
          @mouseleave="hideDropdown"
        >
          <span>装修装饰</span>
          <svg class="dropdown-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M6 9l6 6 6-6"/>
          </svg>
          
          <div 
            v-show="activeDropdown === 'interior'" 
            class="dropdown-menu"
            @mouseenter="showDropdown('interior')"
            @mouseleave="hideDropdown"
          >
            <div class="dropdown-item" @click="navigateTo('/upload')">
              开始设计
            </div>
            <div class="dropdown-item" @click="navigateTo('/interior-history')">
              历史记录
            </div>
          </div>
        </div>

        <div 
          class="nav-item has-dropdown"
          @mouseenter="showDropdown('furniture')"
          @mouseleave="hideDropdown"
        >
          <span>软装布置</span>
          <svg class="dropdown-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M6 9l6 6 6-6"/>
          </svg>
          
          <div 
            v-show="activeDropdown === 'furniture'" 
            class="dropdown-menu"
            @mouseenter="showDropdown('furniture')"
            @mouseleave="hideDropdown"
          >
            <div class="dropdown-item" @click="navigateTo('/furniture-placement')">
              开始设计
            </div>
            <div class="dropdown-item" @click="navigateTo('/furniture-history')">
              历史记录
            </div>
          </div>
        </div>

        <div 
          class="nav-item has-dropdown"
          @mouseenter="showDropdown('video')"
          @mouseleave="hideDropdown"
        >
          <span>宣传视频</span>
          <svg class="dropdown-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M6 9l6 6 6-6"/>
          </svg>
          
          <div 
            v-show="activeDropdown === 'video'" 
            class="dropdown-menu"
            @mouseenter="showDropdown('video')"
            @mouseleave="hideDropdown"
          >
            <div class="dropdown-item" @click="navigateTo('/video-generation')">
              宣传视频
            </div>
            <div class="dropdown-item" @click="navigateTo('/video-history')">
              历史记录
            </div>
          </div>
        </div>

        <div 
          class="nav-item has-dropdown"
          @mouseenter="showDropdown('digital')"
          @mouseleave="hideDropdown"
        >
          <span>数字人</span>
          <svg class="dropdown-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M6 9l6 6 6-6"/>
          </svg>
          
          <div 
            v-show="activeDropdown === 'digital'" 
            class="dropdown-menu"
            @mouseenter="showDropdown('digital')"
            @mouseleave="hideDropdown"
          >
            <div class="dropdown-item" @click="navigateTo('/digital-human')">
              数字人制作
            </div>
            <div class="dropdown-item" @click="navigateTo('/digital-human-history')">
              历史记录
            </div>
          </div>
        </div>

        <!-- 合伙人菜单 -->
        <div 
          class="nav-item has-dropdown"
          @mouseenter="showDropdown('partner')"
          @mouseleave="hideDropdown"
        >
          <span>合伙人</span>
          <svg class="dropdown-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M6 9l6 6 6-6"/>
          </svg>
          
          <div 
            v-show="activeDropdown === 'partner'" 
            class="dropdown-menu"
            @mouseenter="showDropdown('partner')"
            @mouseleave="hideDropdown"
          >
            <div class="dropdown-item" @click="navigateTo('/partner')">
              立即加入
            </div>
          </div>
        </div>

        <div class="nav-item" @click="navigateTo('/about')">
          <span>关于我们</span>
        </div>

        <div v-if="isLoggedIn" 
          class="nav-item has-dropdown user-menu"
          @mouseenter="showDropdown('user')"
          @mouseleave="hideDropdown"
        >
          <div class="user-info">
            <img :src="avatar" alt="头像" class="user-avatar" />
          </div>
          
          <div 
            v-show="activeDropdown === 'user'" 
            class="dropdown-menu user-dropdown"
            @mouseenter="showDropdown('user')"
            @mouseleave="hideDropdown"
          >
            <div class="dropdown-item" @click="navigateTo('/settings')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
              设置
            </div>
            <div class="dropdown-divider"></div>
            <div class="dropdown-item logout-item" @click="handleLogout">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              退出登录
            </div>
          </div>
        </div>

        <template v-else>
          <div class="nav-item nav-register">
            <button class="register-btn" @click="navigateTo('/login')">
              登录
            </button>
          </div>
        </template>
      </div>
    </div>
  </nav>
</template>

<style lang="scss" scoped>
.navigation-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px);
  box-shadow: 0 1px 10px rgba(0, 0, 0, 0.03);
}

.nav-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 70px;
}

.nav-logo {
  display: flex;
  align-items: center;
  cursor: pointer;
  transition: opacity 0.2s ease;

  &:hover {
    opacity: 0.8;
  }

  .logo-image {
    height: 50px;
    width: auto;
    object-fit: contain;
  }
}

.nav-menu {
  display: flex;
  align-items: center;
  gap: 2.5rem;
}

.nav-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 16px;
  font-weight: 400;
  color: #333333;
  cursor: pointer;
  transition: color 0.2s ease;
  padding: 0.5rem 0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
  letter-spacing: 0.3px;

  &:hover {
    color: #1890ff;
  }

  &.has-dropdown {
    .dropdown-icon {
      width: 12px;
      height: 12px;
      transition: transform 0.2s ease;
      opacity: 0.6;
    }

    &:hover .dropdown-icon {
      transform: rotate(180deg);
      opacity: 1;
    }
  }
}

.user-menu {
  .user-info {
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;

    .user-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      object-fit: cover;
      border: 2px solid #e2e8f0;
      transition: all 0.3s ease;

      &:hover {
        border-color: #1890ff;
        box-shadow: 0 0 0 3px rgba(24, 144, 255, 0.1);
      }
    }
  }

  .user-dropdown {
    min-width: 160px;
  }
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-top: 0.75rem;
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  padding: 0.25rem;
  min-width: 140px;
  animation: dropdownFadeIn 0.2s ease;
}

.dropdown-item {
  padding: 0.75rem 1rem;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 14px;
  color: #333333;
  font-weight: 400;
  text-align: center;
  letter-spacing: 0.3px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.625rem;

  svg {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
  }

  &:hover {
    background: rgba(24, 144, 255, 0.08);
    color: #1890ff;

    svg {
      stroke: #1890ff;
    }
  }

  &.logout-item {
    color: #f5222d;

    svg {
      stroke: #f5222d;
    }

    &:hover {
      background: rgba(245, 34, 45, 0.08);
      color: #f5222d;

      svg {
        stroke: #f5222d;
      }
    }
  }
}

.dropdown-divider {
  height: 1px;
  background: #e2e8f0;
  margin: 0.25rem 0;
}

.nav-login {
  .login-btn {
    padding: 0.625rem 1.75rem;
    background: white;
    color: #1890ff;
    border: 2px solid #1890ff;
    border-radius: 20px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    letter-spacing: 0.3px;

    &:hover {
      background: #1890ff;
      color: white;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(24, 144, 255, 0.35);
    }

    &:active {
      transform: translateY(0);
    }
  }
}

.nav-register {
  .register-btn {
    padding: 0.625rem 1.75rem;
    background: linear-gradient(135deg, #1890ff 0%, #1890ff 100%);
    color: white;
    border: none;
    border-radius: 20px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: 0 2px 8px rgba(24, 144, 255, 0.25);
    letter-spacing: 0.3px;

    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(24, 144, 255, 0.35);
    }

    &:active {
      transform: translateY(0);
    }
  }
}

@keyframes dropdownFadeIn {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

@media (max-width: 1024px) {
  .nav-menu {
    gap: 1.5rem;
  }

  .nav-item {
    font-size: 0.875rem;
  }
}

@media (max-width: 768px) {
  .nav-container {
    padding: 0 1rem;
  }

  .nav-menu {
    gap: 1rem;
  }

  .dropdown-menu {
    min-width: 240px;
  }
}
</style>
