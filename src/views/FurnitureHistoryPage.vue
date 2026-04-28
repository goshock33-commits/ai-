<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Box, HomeFilled } from '@element-plus/icons-vue'
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
  }
})

// 家具摆放历史记录（从 localStorage 读取）
interface FurnitureHistory {
  id: string
  roomImage: string
  furnitureImage: string
  resultImage: string
  createdAt: string
  status: 'completed' | 'generating' | 'failed'
}

const historyKey = 'furniture_placement_history'

// 加载历史记录
const loadHistory = (): FurnitureHistory[] => {
  try {
    const data = localStorage.getItem(historyKey)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

// 保存历史记录
const saveHistory = (history: FurnitureHistory[]) => {
  try {
    localStorage.setItem(historyKey, JSON.stringify(history))
  } catch (error) {
    console.error('保存历史记录失败:', error)
  }
}

const historyList = ref<FurnitureHistory[]>(loadHistory())
const searchKeyword = ref('')
const filterStatus = ref<'all' | 'completed' | 'generating' | 'failed'>('all')
const selectedItem = ref<FurnitureHistory | null>(null)
const showDetailDialog = ref(false)

// 过滤后的历史记录
const filteredHistory = computed(() => {
  let list = historyList.value
  
  // 按状态筛选
  if (filterStatus.value !== 'all') {
    list = list.filter(item => item.status === filterStatus.value)
  }
  
  // 按日期搜索
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    list = list.filter(item => 
      formatDate(item.createdAt).toLowerCase().includes(keyword)
    )
  }
  
  return list
})

// 获取状态数量
const getStatusCount = (status: string) => {
  if (status === 'all') return historyList.value.length
  return historyList.value.filter(item => item.status === status).length
}

// 获取状态文本
const getStatusText = (status: string) => {
  const map: Record<string, string> = {
    completed: '已完成',
    generating: '生成中',
    failed: '失败'
  }
  return map[status] || status
}

// 查看详情
const viewDetail = (item: FurnitureHistory) => {
  selectedItem.value = item
  showDetailDialog.value = true
}

// 删除记录
const deleteItem = async (id: string) => {
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
    saveHistory(historyList.value)
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
    saveHistory([])
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
  
  if (days === 0) {
    const hours = Math.floor(diff / (1000 * 60 * 60))
    if (hours === 0) {
      const minutes = Math.floor(diff / (1000 * 60))
      return minutes === 0 ? '刚刚' : `${minutes}分钟前`
    }
    return `${hours}小时前`
  } else if (days === 1) {
    return '昨天'
  } else if (days < 7) {
    return `${days}天前`
  } else {
    return date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
  }
}

// 下载图片
const downloadImage = (url: string, filename: string) => {
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  ElMessage.success('开始下载')
}
</script>

<template>
  <div class="history-page">
    <!-- 导航栏 -->
    <NavigationBar />
    
    <div class="container">
      <!-- 页面头部 -->
      <div class="page-header">
        <div class="header-content">
          <div class="header-icon">
            <el-icon :size="48" color="#42a5f5">
              <Box />
            </el-icon>
          </div>
          <div class="header-text">
            <h1>软装布置历史记录</h1>
            <p>查看和管理您的所有软装布置方案</p>
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
            :class="{ active: filterStatus === 'generating' }"
            @click="filterStatus = 'generating'"
          >
            生成中 ({{ getStatusCount('generating') }})
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
              placeholder="搜索日期..."
              class="search-input"
            />
          </div>
          <button 
            v-if="historyList.length > 0"
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
      <div v-if="filteredHistory.length === 0" class="empty-state">
        <div class="empty-icon">
          <el-icon :size="80" color="#bdc3c7">
            <Box />
          </el-icon>
        </div>
        <h3>{{ searchKeyword ? '未找到匹配的记录' : '暂无历史记录' }}</h3>
        <p>{{ searchKeyword ? '尝试使用其他关键词搜索' : '开始创建您的第一个软装布置方案吧' }}</p>
        <button class="start-btn" @click="router.push('/furniture-placement')">
          <span>+</span> 开始设计
        </button>
      </div>

      <!-- 历史记录列表 -->
      <div v-else class="projects-grid">
        <div 
          v-for="item in filteredHistory" 
          :key="item.id" 
          class="project-card"
          @click="viewDetail(item)"
        >
          <!-- 缩略图 -->
          <div class="project-thumbnail">
            <img :src="item.resultImage" alt="效果图" />
            
            <!-- 状态标签 -->
            <div class="status-badge" :class="`status-${item.status}`">
              {{ getStatusText(item.status) }}
            </div>

            <!-- 悬浮操作 -->
            <div class="thumbnail-overlay">
              <button class="overlay-btn" @click.stop="viewDetail(item)">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
                查看
              </button>
              <button class="overlay-btn overlay-btn--danger" @click.stop="deleteItem(item.id)">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
                删除
              </button>
            </div>
          </div>

          <!-- 卡片信息 -->
          <div class="project-info">
            <h3 class="project-title">家具摆放方案</h3>
            <div class="project-date">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              {{ formatDate(item.createdAt) }}
            </div>
          </div>
        </div>
      </div>

      <!-- 详情对话�-->
      <el-dialog
        v-model="showDetailDialog"
        title="家具摆放详情"
        width="90%"
        :style="{ maxWidth: '1200px' }"
      >
        <div v-if="selectedItem" class="detail-content">
          <div class="detail-grid">
            <div class="detail-item">
              <h4>原始房间</h4>
              <img :src="selectedItem.roomImage" alt="原始房间" />
            </div>
            <div class="detail-item">
              <h4>添加家具</h4>
              <img :src="selectedItem.furnitureImage" alt="家具" />
            </div>
            <div class="detail-item detail-item--highlight">
              <h4>最终效果</h4>
              <img :src="selectedItem.resultImage" alt="最终效果" />
            </div>
          </div>
          <div class="detail-info">
            <p><strong>创建时间：</strong>{{ formatDate(selectedItem.createdAt) }}</p>
          </div>
        </div>
        <template #footer>
          <el-button @click="showDetailDialog = false">关闭</el-button>
          <el-button 
            type="primary" 
            @click="selectedItem && downloadImage(selectedItem.resultImage, `furniture-${selectedItem.id}.jpg`)"
          >
            下载效果图
          </el-button>
        </template>
      </el-dialog>
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

// 页面头部
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

// 筛选栏
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
  width: 240px;
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

// 空状态
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

// 项目网格（与室内设计历史记录一致）
.projects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
}

// 项目卡片
.project-card {
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

.project-thumbnail {
  position: relative;
  width: 100%;
  height: 220px;
  overflow: hidden;
  background: #e8e8e8;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
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

.card-info {
  padding: 1.25rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid rgba(0, 0, 0, 0.04);
}

.info-main {
  flex: 1;
}

.project-info {
  padding: 1.25rem;
}

.project-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 0.75rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.project-meta {
  display: flex;
  gap: 1rem;
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

.project-date {
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

.info-actions {
  display: flex;
  gap: 0.75rem;
}

.action-btn {
  width: 36px;
  height: 36px;
  border: 1px solid #e0e0e0;
  background: white;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;

  svg {
    width: 18px;
    height: 18px;
    color: #666;
    transition: all 0.3s ease;
  }

  &:hover {
    border-color: #1890ff;
    background: rgba(24, 144, 255, 0.05);
    transform: translateY(-2px) scale(1.05);

    svg {
      color: #1890ff;
    }
  }
}

// 详情对话框
.detail-content {
  .detail-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1.5rem;
    margin-bottom: 1.5rem;

    @media (max-width: 768px) {
      grid-template-columns: 1fr;
    }
  }

  .detail-item {
    h4 {
      font-size: 0.875rem;
      font-weight: 600;
      color: #666;
      margin-bottom: 0.75rem;
      text-align: center;
    }

    img {
      width: 100%;
      height: 250px;
      object-fit: cover;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    &--highlight {
      img {
        box-shadow: 0 4px 16px rgba(24, 144, 255, 0.3);
      }
    }
  }

  .detail-info {
    padding: 1rem;
    background: #f5f7fa;
    border-radius: 8px;
    text-align: center;

    p {
      margin: 0;
      color: #666;
      font-size: 0.875rem;
    }
  }
}

// 响应式
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

  .projects-grid {
    grid-template-columns: 1fr;
  }
}
</style>
