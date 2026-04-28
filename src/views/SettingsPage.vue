<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import NavigationBar from '@/components/NavigationBar.vue'
import { useUserStore } from '@/stores'

const router = useRouter()
const userStore = useUserStore()

// 表单数据
const formData = ref({
  username: '',
  phone: '',
  avatar: ''
})

// 编辑状态
const editingUsername = ref(false)
const editingPhone = ref(false)

// 临时输入值
const tempUsername = ref('')
const tempPhone = ref('')

// 加载状态
const loading = ref(false)

// 头像上传
const avatarInput = ref<HTMLInputElement | null>(null)

onMounted(() => {
  // 检查是否登录
  if (!userStore.loggedIn) {
    router.push('/login')
    return
  }

  // 加载用户数据
  loadUserData()
})

const loadUserData = () => {
  formData.value = {
    username: userStore.username,
    phone: userStore.phone || '',
    avatar: userStore.avatar
  }
}

// 编辑用户名
const startEditUsername = () => {
  tempUsername.value = formData.value.username
  editingUsername.value = true
}

const cancelEditUsername = () => {
  editingUsername.value = false
  tempUsername.value = ''
}

const saveUsername = async () => {
  if (!tempUsername.value.trim()) {
    ElMessage.error('用户名不能为空')
    return
  }

  if (tempUsername.value.length < 3 || tempUsername.value.length > 20) {
    ElMessage.error('用户名长度应在3-20个字符之间')
    return
  }

  loading.value = true

  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // 更新用户信息
    userStore.updateUser({ username: tempUsername.value })
    formData.value.username = tempUsername.value
    
    editingUsername.value = false
    ElMessage.success('用户名修改成功')
  } catch (error) {
    ElMessage.error('修改失败，请重试')
  } finally {
    loading.value = false
  }
}

// 编辑手机号
const startEditPhone = () => {
  tempPhone.value = formData.value.phone
  editingPhone.value = true
}

const cancelEditPhone = () => {
  editingPhone.value = false
  tempPhone.value = ''
}

const savePhone = async () => {
  if (!tempPhone.value.trim()) {
    ElMessage.error('手机号不能为空')
    return
  }

  if (!/^1[3-9]\d{9}$/.test(tempPhone.value)) {
    ElMessage.error('请输入正确的手机号')
    return
  }

  loading.value = true

  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // 更新用户信息
    userStore.updateUser({ phone: tempPhone.value })
    formData.value.phone = tempPhone.value
    
    editingPhone.value = false
    ElMessage.success('手机号绑定成功')
  } catch (error) {
    ElMessage.error('绑定失败，请重试')
  } finally {
    loading.value = false
  }
}

// 上传头像
const triggerAvatarUpload = () => {
  avatarInput.value?.click()
}

const handleAvatarChange = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  
  if (!file) return

  // 检查文件类型
  if (!file.type.startsWith('image/')) {
    ElMessage.error('请选择图片文件')
    return
  }

  // 检查文件大小（限制2MB）
  if (file.size > 2 * 1024 * 1024) {
    ElMessage.error('图片大小不能超过2MB')
    return
  }

  loading.value = true

  try {
    // 读取文件并转换为base64
    const reader = new FileReader()
    reader.onload = async (e) => {
      const avatarUrl = e.target?.result as string
      
      // 模拟上传到服务器
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // 更新用户头像
      userStore.updateUser({ avatar: avatarUrl })
      formData.value.avatar = avatarUrl
      
      ElMessage.success('头像更换成功')
      loading.value = false
    }
    reader.readAsDataURL(file)
  } catch (error) {
    ElMessage.error('上传失败，请重试')
    loading.value = false
  }
}

// 退出登录
const handleLogout = () => {
  userStore.logout()
  ElMessage.success('已退出登录')
  router.push('/login')
}
</script>

<template>
  <div class="settings-page">
    <NavigationBar />
    
    <div class="settings-container">
      <div class="settings-card">
        <div class="settings-header">
          <h1>个人设置</h1>
          <p class="subtitle">管理您的账号信息</p>
        </div>

        <!-- 头像设置 -->
        <div class="settings-section">
          <h2 class="section-title">头像</h2>
          <div class="avatar-section">
            <div class="avatar-preview">
              <img :src="formData.avatar" alt="头像" />
            </div>
            <div class="avatar-actions">
              <button class="upload-btn" @click="triggerAvatarUpload" :disabled="loading">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="17 8 12 3 7 8"></polyline>
                  <line x1="12" y1="3" x2="12" y2="15"></line>
                </svg>
                更换头像
              </button>
              <p class="upload-hint">支持 JPG、PNG 格式，大小不超过 2MB</p>
            </div>
            <input 
              ref="avatarInput" 
              type="file" 
              accept="image/*" 
              style="display: none"
              @change="handleAvatarChange"
            />
          </div>
        </div>

        <!-- 用户名设置 -->
        <div class="settings-section">
          <h2 class="section-title">用户名</h2>
          <div class="info-row">
            <div class="info-content">
              <template v-if="!editingUsername">
                <span class="info-value">{{ formData.username }}</span>
                <button class="edit-btn" @click="startEditUsername">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                  编辑
                </button>
              </template>
              <template v-else>
                <input 
                  v-model="tempUsername" 
                  type="text" 
                  class="edit-input"
                  placeholder="请输入新用户名"
                  :disabled="loading"
                />
                <div class="edit-actions">
                  <button class="save-btn" @click="saveUsername" :disabled="loading">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </button>
                  <button class="cancel-btn" @click="cancelEditUsername" :disabled="loading">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>
              </template>
            </div>
          </div>
        </div>

        <!-- 手机号设置 -->
        <div class="settings-section">
          <h2 class="section-title">手机号</h2>
          <div class="info-row">
            <div class="info-content">
              <template v-if="!editingPhone">
                <span class="info-value">{{ formData.phone || '未绑定' }}</span>
                <button class="edit-btn" @click="startEditPhone">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                  {{ formData.phone ? '修改' : '绑定' }}
                </button>
              </template>
              <template v-else>
                <input 
                  v-model="tempPhone" 
                  type="tel" 
                  class="edit-input"
                  placeholder="请输入手机号"
                  :disabled="loading"
                />
                <div class="edit-actions">
                  <button class="save-btn" @click="savePhone" :disabled="loading">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </button>
                  <button class="cancel-btn" @click="cancelEditPhone" :disabled="loading">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>
              </template>
            </div>
          </div>
        </div>

        <!-- 退出登录 -->
        <div class="settings-section">
          <button class="logout-btn" @click="handleLogout">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            退出登录
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.settings-page {
  min-height: 100vh;
  background: linear-gradient(to bottom, 
    #f0f4ff 0%, 
    #e8f0ff 30%, 
    #f5f7fa 60%, 
    #f5f7fa 100%
  );
  padding-top: 70px;
}

.settings-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 3rem 2rem;
}

.settings-card {
  background: white;
  border-radius: 1.5rem;
  padding: 2.5rem;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
}

.settings-header {
  margin-bottom: 2.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 2px solid #f0f0f0;

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

.settings-section {
  margin-bottom: 2rem;

  &:last-child {
    margin-bottom: 0;
  }

  .section-title {
    font-size: 1rem;
    font-weight: 600;
    color: #2d3748;
    margin-bottom: 1rem;
  }
}

// 头像部分
.avatar-section {
  display: flex;
  align-items: center;
  gap: 2rem;

  .avatar-preview {
    width: 100px;
    height: 100px;
    border-radius: 50%;
    overflow: hidden;
    border: 3px solid #e2e8f0;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  .avatar-actions {
    flex: 1;

    .upload-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      background: linear-gradient(135deg, #1890ff 0%, #1890ff 100%);
      color: white;
      border: none;
      border-radius: 0.5rem;
      font-size: 0.9375rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.3s ease;
      box-shadow: 0 4px 12px rgba(24, 144, 255, 0.3);

      svg {
        width: 18px;
        height: 18px;
      }

      &:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(24, 144, 255, 0.4);
      }

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    }

    .upload-hint {
      margin-top: 0.75rem;
      font-size: 0.8125rem;
      color: #a0aec0;
    }
  }
}

// 信息行
.info-row {
  .info-content {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    background: #f7fafc;
    border-radius: 0.75rem;
    border: 2px solid #e2e8f0;

    .info-value {
      flex: 1;
      font-size: 1rem;
      color: #2d3748;
      font-weight: 500;
    }

    .edit-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.5rem 1rem;
      background: white;
      color: #1890ff;
      border: 1px solid #1890ff;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;

      svg {
        width: 16px;
        height: 16px;
      }

      &:hover {
        background: #1890ff;
        color: white;
      }
    }

    .edit-input {
      flex: 1;
      padding: 0.625rem 1rem;
      border: 2px solid #1890ff;
      border-radius: 0.5rem;
      font-size: 0.9375rem;
      transition: all 0.3s ease;

      &:focus {
        outline: none;
        box-shadow: 0 0 0 3px rgba(24, 144, 255, 0.1);
      }

      &:disabled {
        background: #f5f5f5;
        cursor: not-allowed;
        opacity: 0.6;
      }
    }

    .edit-actions {
      display: flex;
      gap: 0.5rem;

      button {
        width: 36px;
        height: 36px;
        padding: 0;
        border: none;
        background: transparent;
        border-radius: 0.5rem;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s ease;

        svg {
          width: 20px;
          height: 20px;
        }

        &:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      }

      .save-btn {
        svg {
          stroke: #52c41a;
        }

        &:hover:not(:disabled) {
          background: rgba(82, 196, 26, 0.1);
          transform: scale(1.1);
        }
      }

      .cancel-btn {
        svg {
          stroke: #999;
        }

        &:hover:not(:disabled) {
          background: rgba(0, 0, 0, 0.05);
          transform: scale(1.1);
        }
      }
    }
  }
}

// 退出登录按钮
.logout-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.875rem 2rem;
  background: white;
  color: #f5222d;
  border: 2px solid #f5222d;
  border-radius: 0.75rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  svg {
    width: 20px;
    height: 20px;
  }

  &:hover {
    background: #f5222d;
    color: white;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(245, 34, 45, 0.3);
  }
}

// 响应式
@media (max-width: 640px) {
  .settings-container {
    padding: 2rem 1rem;
  }

  .settings-card {
    padding: 2rem 1.5rem;
  }

  .avatar-section {
    flex-direction: column;
    align-items: flex-start;
  }

  .info-content {
    flex-direction: column;
    align-items: stretch !important;

    .edit-actions {
      width: 100%;

      button {
        flex: 1;
      }
    }
  }
}
</style>
