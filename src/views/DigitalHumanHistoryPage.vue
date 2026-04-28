<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { User } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores'
import NavigationBar from '@/components/NavigationBar.vue'

const router = useRouter()
const userStore = useUserStore()

// 检查登录状态
onMounted(() => {
  if (!userStore.loggedIn) {
    ElMessage.warning('请先登录后再查看历史记录')
    setTimeout(() => {
      router.push('/login')
    }, 1500)
  } else {
    loadHistory()
  }
})

interface DigitalHumanRecord {
  id: string
  title: string
  thumbnail: string
  videoUrl: string
  personName: string
  voiceName: string
  duration: string
  createdAt: string
  status: 'completed' | 'processing' | 'failed'
}

const historyList = ref<DigitalHumanRecord[]>([])
const searchKeyword = ref('')
const filterStatus = ref<'all' | 'completed' | 'processing' | 'failed'>('all')

// 从 localStorage 加载历史记录
const loadHistory = () => {
  try {
    const data = localStorage.getItem('digital_human_history')
    if (data) {
      historyList.value = JSON.parse(data)
    }
  } catch (error) {
    console.error('加载历史记录失败:', error)
  }
}

// 保存历史记录
const saveHistory = () => {
  try {
    localStorage.setItem('digital_human_history', JSON.stringify(historyList.value))
  } catch (error) {
    console.error('保存历史记录失败:', error)
  }
}

// 过滤后的列表
const filteredList = computed(() => {
  let list = historyList.value

  // 按状态筛选
  if (filterStatus.value !== 'all') {
    list = list.filter(item => item.status === filterStatus.value)
  }

  // 按关键词搜索
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    list = list.filter(item => 
      item.title.toLowerCase().includes(keyword) ||
      item.personName.toLowerCase().includes(keyword) ||
      item.voiceName.toLowerCase().includes(keyword)
    )
  }

  // 按创建时间倒序
  return list.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
})

// 查看视频
const viewVideo = (record: DigitalHumanRecord) => {
  if (record.status === 'completed' && record.videoUrl) {
    window.open(record.videoUrl, '_blank')
  } else {
    ElMessage.warning('视频尚未生成完成')
  }
}

// 删除记录
const deleteRecord = async (id: string) => {
  try {
    await ElMessageBox.confirm(
      '确定要删除这条记录吗？此操作不可恢复。',
      '确认删除',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    historyList.value = historyList.value.filter(item => item.id !== id)
    saveHistory()
    ElMessage.success('删除成功')
  } catch {
    // 用户取消
  }
}

// 清空所有历史
const clearAllHistory = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要清空所有历史记录吗？此操作不可恢复。',
      '确认清空',
      {
        confirmButtonText: '清空',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    historyList.value = []
    saveHistory()
    ElMessage.success('已清空所有历史记录')
  } catch {
    // 用户取消
  }
}

// 格式化日期
const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (days === 0) return '今天'
  if (days === 1) return '昨天'
  if (days < 7) return `${days}天前`
  
  return date.toLocaleDateString('zh-CN')
}

// 获取状态文本
const getStatusText = (status: string) => {
  const map: Record<string, string> = {
    completed: '已完成',
    processing: '生成中',
    failed: '失败'
  }
  return map[status] || status
}

// 获取状态数量
const getStatusCount = (status: string) => {
  if (status === 'all') return historyList.value.length
  return historyList.value.filter(item => item.status === status).length
}
</script>

<template>
  <div class="history-page">
    <NavigationBar />
    
    <div class="container">
      <!-- 页面头部 -->
      <div class="page-header">
        <div class="header-content">
          <div class="header-icon">
            <el-icon :size="48" color="#42a5f5">
              <User />
            </el-icon>
          </div>
          <div class="header-text">
            <h1>数字人历史记录</h1>
            <p>查看和管理您的所有数字人视频</p>
          </div>
        </div>
      </div>

      <!-- 筛选和搜索栏 -->
      <div class="filter-bar">
        <div class="filter-tabs">
          <button 
            class="filter-tab" 
            :class="{ active: filterStatus === 'all' }"
            @click="filterStatus = 'all'"
          >
            全部 ({{ getStatusCount('all') }})
          </button>
          <button 
            class="filter-tab" 
            :class="{ active: filterStatus === 'completed' }"
            @click="filterStatus = 'completed'"
          >
            已完成 ({{ getStatusCount('completed') }})
          </button>
          <button 
            class="filter-tab" 
            :class="{ active: filterStatus === 'processing' }"
            @click="filterStatus = 'processing'"
          >
            生成中 ({{ getStatusCount('processing') }})
          </button>
          <button 
            class="filter-tab" 
            :class="{ active: filterStatus === 'failed' }"
            @click="filterStatus = 'failed'"
          >
            失败 ({{ getStatusCount('failed') }})
          </button>
        </div>

        <div class="filter-actions">
          <div class="search-box">
            <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
            <input 
              v-model="searchKeyword" 
              type="text" 
              placeholder="搜索标题、形象或音色..."
              class="search-input"
            />
          </div>
          <button 
            v-if="filteredList.length > 0"
            class="clear-btn" 
            @click="clearAllHistory"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
            清空历史
          </button>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="filteredList.length === 0" class="empty-state">
        <div class="empty-icon">
          <el-icon :size="80" color="#bdc3c7">
            <User />
          </el-icon>
        </div>
        <h3>{{ searchKeyword ? '未找到匹配的记录' : '暂无历史记录' }}</h3>
        <p>{{ searchKeyword ? '尝试使用其他关键词搜索' : '开始创建您的第一个数字人视频吧' }}</p>
        <button class="start-btn" @click="router.push('/digital-human')">
          <span>+</span> 开始制作
        </button>
      </div>

      <!-- 视频列表 -->
      <div v-else class="videos-grid">
        <div 
          v-for="record in filteredList" 
          :key="record.id" 
          class="video-card"
          @click="viewVideo(record)"
        >
          <!-- 缩略图 -->
          <div class="video-thumbnail">
            <img 
              v-if="record.thumbnail" 
              :src="record.thumbnail" 
              :alt="record.title"
            />
            <div v-else class="thumbnail-placeholder">
              <span>👤</span>
            </div>
            
            <!-- 状态标签 -->
            <div class="status-badge" :class="`status-${record.status}`">
              {{ getStatusText(record.status) }}
            </div>

            <!-- 时长标签 -->
            <div v-if="record.duration" class="duration-badge">
              {{ record.duration }}
            </div>

            <!-- 悬浮操作 -->
            <div class="thumbnail-overlay">
              <button 
                v-if="record.status === 'completed'"
                class="overlay-btn" 
                @click.stop="viewVideo(record)"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polygon points="5 3 19 12 5 21 5 3"></polygon>
                </svg>
                播放
              </button>
              <button class="overlay-btn overlay-btn--danger" @click.stop="deleteRecord(record.id)">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
                删除
              </button>
            </div>
          </div>

          <!-- 视频信息 -->
          <div class="video-info">
            <h3 class="video-title">{{ record.title }}</h3>
            <div class="video-meta">
              <span class="meta-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                {{ record.personName }}
              </span>
              <span class="meta-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                  <line x1="12" y1="19" x2="12" y2="23"></line>
                  <line x1="8" y1="23" x2="16" y2="23"></line>
                </svg>
                {{ record.voiceName }}
              </span>
            </div>
            <div class="video-date">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              {{ formatDate(record.createdAt) }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;

.history-page {
  min-height: 100vh;
  background: linear-gradient(to bottom, 
    #f0f4ff 0%, 
    #e8f0ff 30%, 
    #f5f7fa 60%, 
    #f5f7fa 100%
  );
  padding: 100px 2rem 2rem;
}

.container {
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 2rem;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.header-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

.header-text {
  h1 {
    font-size: 2rem;
    font-weight: 700;
    color: #1a1a1a;
    margin-bottom: 0.5rem;
  }

  p {
    font-size: 1rem;
    color: #666;
  }
}

.filter-bar {
  background: #fafafa;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1.5rem;
  flex-wrap: wrap;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.filter-tabs {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.filter-tab {
  padding: 0.625rem 1.25rem;
  border: 1px solid #e0e0e0;
  background: white;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  color: #666;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: #1890ff;
    color: #1890ff;
    background: rgba(24, 144, 255, 0.05);
  }

  &.active {
    border-color: #1890ff;
    background: linear-gradient(135deg, #1890ff 0%, #1890ff 100%);
    color: white;
  }
}

.filter-actions {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 12px;
  width: 18px;
  height: 18px;
  color: #999;
  pointer-events: none;
}

.search-input {
  padding: 0.625rem 1rem 0.625rem 2.5rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 0.875rem;
  width: 280px;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: #1890ff;
    box-shadow: 0 0 0 3px rgba(24, 144, 255, 0.1);
  }

  &::placeholder {
    color: #999;
  }
}

.clear-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  border: 1px solid #ff4757;
  background: white;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  color: #ff4757;
  cursor: pointer;
  transition: all 0.2s ease;

  svg {
    width: 16px;
    height: 16px;
  }

  &:hover {
    background: #ff4757;
    color: white;
  }
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  background: #fafafa;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.empty-icon {
  font-size: 80px;
  margin-bottom: 1.5rem;
  opacity: 0.5;
}

.empty-state h3 {
  font-size: 1.5rem;
  color: #1a1a1a;
  margin-bottom: 0.5rem;
  font-weight: 600;
}

.empty-state p {
  color: #666;
  margin-bottom: 2rem;
}

.start-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.875rem 2rem;
  background: linear-gradient(135deg, #1890ff 0%, #1890ff 100%);
  color: white;
  border: none;
  border-radius: 24px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.3);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(24, 144, 255, 0.4);
  }
}

.videos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
}

.video-card {
  background: #fafafa;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);

    .thumbnail-overlay {
      opacity: 1;
    }
  }
}

.video-thumbnail {
  position: relative;
  width: 100%;
  height: 180px;
  overflow: hidden;
  background: #e8e8e8;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.thumbnail-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 64px;
  opacity: 0.3;
}

.status-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  backdrop-filter: blur(10px);

  &.status-completed {
    background: rgba(76, 175, 80, 0.9);
    color: white;
  }

  &.status-processing {
    background: rgba(255, 152, 0, 0.9);
    color: white;
  }

  &.status-failed {
    background: rgba(244, 67, 54, 0.9);
    color: white;
  }
}

.duration-badge {
  position: absolute;
  bottom: 12px;
  right: 12px;
  padding: 4px 8px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
}

.thumbnail-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.overlay-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  background: white;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  color: #1a1a1a;
  cursor: pointer;
  transition: all 0.2s ease;

  svg {
    width: 16px;
    height: 16px;
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }

  &--danger {
    background: #ff4757;
    color: white;

    &:hover {
      background: #ff3838;
    }
  }
}

.video-info {
  padding: 1.25rem;
}

.video-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 0.75rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.video-meta {
  display: flex;
  gap: 1rem;
  margin-bottom: 0.75rem;
  flex-wrap: wrap;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.875rem;
  color: #666;

  svg {
    width: 14px;
    height: 14px;
  }
}

.video-date {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.75rem;
  color: #999;

  svg {
    width: 12px;
    height: 12px;
  }
}

@media (max-width: 768px) {
  .filter-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-actions {
    flex-direction: column;
    width: 100%;

    .search-input {
      width: 100%;
    }

    .clear-btn {
      width: 100%;
      justify-content: center;
    }
  }

  .videos-grid {
    grid-template-columns: 1fr;
  }
}
</style>
