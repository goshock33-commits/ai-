<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useProjectStore } from '@/stores'
import { getRoomTypeLabel } from '@/utils/helpers'
import type { Design } from '@/types'
import NavigationBar from '@/components/NavigationBar.vue'

const router = useRouter()
const route = useRoute()
const projectStore = useProjectStore()

const project = computed(() => {
  const id = route.params.projectId as string
  return projectStore.projects.find(p => p.id === id) || projectStore.currentProject
})

const designs = computed(() => project.value?.designs || [])

// 按房间分组设计图
const groupedDesigns = computed(() => {
  const groups = new Map<string, Design[]>()
  
  designs.value.forEach(design => {
    const key = design.roomId
    if (!groups.has(key)) {
      groups.set(key, [])
    }
    groups.get(key)!.push(design)
  })
  
  return Array.from(groups.values())
})

// 每个房间当前显示的图片索引
const currentIndexes = ref<Map<string, number>>(new Map())

// 收藏状态
const likedDesigns = ref<Set<string>>(new Set())

// 获取当前索引
const getCurrentIndex = (roomId: string) => {
  return currentIndexes.value.get(roomId) || 0
}

// 设置当前索引
const setCurrentIndex = (roomId: string, index: number) => {
  currentIndexes.value.set(roomId, index)
}

// 上一张
const prevImage = (roomId: string, totalImages: number) => {
  const current = getCurrentIndex(roomId)
  const newIndex = current === 0 ? totalImages - 1 : current - 1
  setCurrentIndex(roomId, newIndex)
}

// 下一张
const nextImage = (roomId: string, totalImages: number) => {
  const current = getCurrentIndex(roomId)
  const newIndex = current === totalImages - 1 ? 0 : current + 1
  setCurrentIndex(roomId, newIndex)
}

// 切换收藏
const toggleLike = (designId: string) => {
  if (likedDesigns.value.has(designId)) {
    likedDesigns.value.delete(designId)
    ElMessage.success('已取消收藏')
  } else {
    likedDesigns.value.add(designId)
    ElMessage.success('已添加到收藏')
  }
}

// 检查是否已收藏
const isLiked = (designId: string) => {
  return likedDesigns.value.has(designId)
}

// 分享设计
const shareDesign = async (design: Design) => {
  try {
    // 尝试使用 Web Share API
    if (navigator.share) {
      await navigator.share({
        title: `${getRoomTypeLabel(design.roomType)} - ${design.style}`,
        text: `查看我的 AI 室内设计方案：${getRoomTypeLabel(design.roomType)}`,
        url: window.location.href
      })
      ElMessage.success('分享成功')
    } else {
      // 降级方案：复制链接到剪贴板
      await navigator.clipboard.writeText(window.location.href)
      ElMessage.success('链接已复制到剪贴板')
    }
  } catch (error) {
    console.error('分享失败:', error)
    ElMessage.warning('分享功能暂不可用')
  }
}

// 下载全部
const downloadAll = async () => {
  if (designs.value.length === 0) {
    ElMessage.warning('没有可下载的设计')
    return
  }

  ElMessage.info(`开始下载 ${designs.value.length} 张设计图...`)
  
  for (let i = 0; i < designs.value.length; i++) {
    const design = designs.value[i]
    try {
      // 延迟下载，避免浏览器阻止
      await new Promise(resolve => setTimeout(resolve, i * 300))
      
      // 如果是 base64 图片
      if (design.imageUrl.startsWith('data:')) {
        const link = document.createElement('a')
        link.href = design.imageUrl
        link.download = `${getRoomTypeLabel(design.roomType)}-${design.style}-${i + 1}.png`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      } else {
        // 如果是 URL，先获取图片
        const response = await fetch(design.imageUrl)
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `${getRoomTypeLabel(design.roomType)}-${design.style}-${i + 1}.png`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error(`下载失败 (${i + 1}):`, error)
    }
  }
  
  ElMessage.success('下载完成')
}
</script>

<template>
  <div class="results-page">
    <!-- 导航�?-->
    <NavigationBar />
    
    <!-- 顶部装饰背景 -->
    <div class="page-header-bg"></div>
    
    <div class="container">
      <!-- 页面头部 -->
      <div class="page-header">
        <div class="header-content">
          <div class="header-icon">✨</div>
          <div class="header-text">
            <h1>您的专属设计方案</h1>
            <p>AI 为您精心打造的 {{ designs.length }} 个设计方案</p>
          </div>
        </div>
        <div class="header-actions">
          <button 
            class="action-button action-button--secondary"
            @click="router.push('/upload')"
          >
            <svg class="button-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="23 4 23 10 17 10"></polyline>
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
            </svg>
            <span>重新生成</span>
          </button>
          <button 
            class="action-button action-button--primary"
            @click="downloadAll"
          >
            <svg class="button-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            <span>下载全部</span>
          </button>
        </div>
      </div>

      <!-- 空状�?-->
      <div v-if="designs.length === 0" class="empty-state">
        <div class="empty-icon">🏠</div>
        <h3>暂无设计结果</h3>
        <p>开始创建您的第一个设计方案吧</p>
        <el-button type="primary" @click="router.push('/upload')">
          开始设计
        </el-button>
      </div>

      <!-- 设计方案网格 -->
      <div v-else class="designs-grid">
        <div 
          v-for="(roomDesigns, groupIndex) in groupedDesigns" 
          :key="groupIndex" 
          class="design-card"
        >
          <!-- 图片轮播区域 -->
          <div class="image-carousel">
            <div class="carousel-images">
              <div
                v-for="(design, index) in roomDesigns"
                :key="design.id"
                class="carousel-image"
                :class="{ active: getCurrentIndex(design.roomId) === index }"
              >
                <img :src="design.imageUrl" :alt="getRoomTypeLabel(design.roomType)" />
                <!-- 图片遮罩 -->
                <div class="image-overlay">
                  <div class="overlay-content">
                    <span class="room-badge">{{ getRoomTypeLabel(design.roomType) }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 导航按钮 -->
            <template v-if="roomDesigns.length > 1">
              <button
                class="carousel-btn carousel-btn--prev"
                @click="prevImage(roomDesigns[0].roomId, roomDesigns.length)"
                aria-label="上一张"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
              </button>
              <button
                class="carousel-btn carousel-btn--next"
                @click="nextImage(roomDesigns[0].roomId, roomDesigns.length)"
                aria-label="下一张"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </button>

              <!-- 图片计数器 -->
              <div class="image-counter">
                {{ getCurrentIndex(roomDesigns[0].roomId) + 1 }} / {{ roomDesigns.length }}
              </div>
            </template>

            <!-- 指示器点 -->
            <div v-if="roomDesigns.length > 1" class="carousel-indicators">
              <button
                v-for="(design, index) in roomDesigns"
                :key="index"
                class="indicator"
                :class="{ active: getCurrentIndex(design.roomId) === index }"
                @click="setCurrentIndex(design.roomId, index)"
                :aria-label="`查看第 ${index + 1} 张图片`"
              ></button>
            </div>
          </div>

          <!-- 卡片信息 -->
          <div class="card-info">
            <div class="info-main">
              <h3 class="room-title">{{ getRoomTypeLabel(roomDesigns[0].roomType) }}</h3>
              <p class="room-style">{{ roomDesigns[0].style }}</p>
            </div>
            <div class="info-actions">
              <button 
                class="action-btn" 
                :class="{ 'action-btn--liked': isLiked(roomDesigns[getCurrentIndex(roomDesigns[0].roomId)].id) }"
                @click="toggleLike(roomDesigns[getCurrentIndex(roomDesigns[0].roomId)].id)"
                title="收藏"
              >
                <svg viewBox="0 0 24 24" :fill="isLiked(roomDesigns[getCurrentIndex(roomDesigns[0].roomId)].id) ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                </svg>
              </button>
              <button 
                class="action-btn" 
                @click="shareDesign(roomDesigns[getCurrentIndex(roomDesigns[0].roomId)])"
                title="分享"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="18" cy="5" r="3"></circle>
                  <circle cx="6" cy="12" r="3"></circle>
                  <circle cx="18" cy="19" r="3"></circle>
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;

.results-page {
  min-height: 100vh;
  background: linear-gradient(to bottom, 
    #f0f4ff 0%, 
    #e8f0ff 30%, 
    #f5f7fa 60%, 
    #f5f7fa 100%
  );
  padding: 100px 0 3rem;
  position: relative;
}

.page-header-bg {
  position: absolute;
  top: 70px;
  left: 0;
  right: 0;
  height: 0;
  background: transparent;
  z-index: 0;
}

.container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 $spacing-4;
  position: relative;
  z-index: 1;
}

// 页面头部
.page-header {
  padding: 2rem 0 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: $spacing-3;
}

.header-content {
  display: flex;
  align-items: center;
  gap: $spacing-3;
}

.header-icon {
  font-size: 48px;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

.header-text {
  h1 {
    font-size: $font-size-3xl;
    font-weight: 700;
    color: $text-primary;
    margin-bottom: $spacing-1;
    letter-spacing: -0.5px;
  }

  p {
    font-size: $font-size-base;
    color: $text-secondary;
  }
}

.header-actions {
  display: flex;
  gap: $spacing-3;
}

// 操作按钮样式
.action-button {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 24px;
  border-radius: $radius-lg;
  font-size: $font-size-base;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: none;
  outline: none;
  position: relative;
  overflow: hidden;

  .button-icon {
    width: 20px;
    height: 20px;
    transition: transform 0.3s ease;
  }

  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0;
    height: 0;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.3);
    transform: translate(-50%, -50%);
    transition: width 0.6s, height 0.6s;
  }

  &:hover::before {
    width: 300px;
    height: 300px;
  }

  &:active {
    transform: scale(0.96);
  }

  span {
    position: relative;
    z-index: 1;
  }

  // 次要按钮
  &--secondary {
    background: linear-gradient(135deg, #1890ff 0%, #1890ff 100%);
    color: white;
    box-shadow: 0 2px 8px rgba(24, 144, 255, 0.3);
    border: none;

    &:hover {
      box-shadow: 0 4px 16px rgba(24, 144, 255, 0.4);
      transform: translateY(-2px);
      background: linear-gradient(135deg, #5568d3 0%, #653a8b 100%);

      .button-icon {
        transform: rotate(-180deg);
      }
    }
  }

  // 主要按钮
  &--primary {
    background: linear-gradient(135deg, #1890ff 0%, #1890ff 100%);
    color: white;
    box-shadow: 0 4px 12px rgba(24, 144, 255, 0.3);

    &:hover {
      box-shadow: 0 6px 20px rgba(24, 144, 255, 0.4);
      transform: translateY(-2px);

      .button-icon {
        transform: translateY(2px);
      }
    }
  }
}

// 空状�?
.empty-state {
  text-align: center;
  padding: $spacing-6 $spacing-4;
  background: white;
  border-radius: $radius-lg;
  box-shadow: $shadow-sm;
  margin-top: $spacing-4;
}

.empty-icon {
  font-size: 80px;
  margin-bottom: $spacing-3;
  opacity: 0.5;
}

.empty-state h3 {
  font-size: $font-size-xl;
  color: $text-primary;
  margin-bottom: $spacing-2;
}

.empty-state p {
  color: $text-secondary;
  margin-bottom: $spacing-4;
}

// 设计方案网格
.designs-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: $spacing-4;
  margin-top: $spacing-4;
}

// 设计卡片
.design-card {
  background: white;
  border-radius: $radius-lg;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(0, 0, 0, 0.04);

  &:hover {
    transform: translateY(-8px);
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.12);
    border-color: rgba(212, 165, 116, 0.2);

    .carousel-btn {
      opacity: 1;
    }

    .image-overlay {
      opacity: 1;
    }
  }
}

// 图片轮播
.image-carousel {
  position: relative;
  width: 100%;
  height: 360px;
  overflow: hidden;
  background: $background;
}

.carousel-images {
  position: relative;
  width: 100%;
  height: 100%;
}

.carousel-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  transition: opacity 0.6s ease-in-out;

  &.active {
    opacity: 1;
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

// 图片遮罩
.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.3) 0%, transparent 30%, transparent 70%, rgba(0, 0, 0, 0.4) 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
}

.overlay-content {
  position: absolute;
  top: $spacing-3;
  left: $spacing-3;
}

.room-badge {
  display: inline-block;
  padding: 6px 14px;
  background: rgba(255, 255, 255, 0.95);
  color: $text-primary;
  font-size: $font-size-sm;
  font-weight: 600;
  border-radius: $radius-full;
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

// 导航按钮
.carousel-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 44px;
  height: 44px;
  background: rgba(255, 255, 255, 0.95);
  border: none;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: all 0.3s ease;
  z-index: 10;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(10px);

  &:hover {
    background: white;
    transform: translateY(-50%) scale(1.1);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  }

  &:active {
    transform: translateY(-50%) scale(0.95);
  }

  svg {
    width: 22px;
    height: 22px;
    color: $text-primary;
  }

  &--prev {
    left: 16px;
  }

  &--next {
    right: 16px;
  }
}

// 图片计数�?
.image-counter {
  position: absolute;
  bottom: 16px;
  right: 16px;
  padding: 6px 12px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  font-size: $font-size-sm;
  font-weight: 600;
  border-radius: $radius-full;
  backdrop-filter: blur(10px);
  z-index: 10;
}

// 指示�?
.carousel-indicators {
  position: absolute;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 8px;
  z-index: 10;
}

.indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.6);
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  padding: 0;

  &:hover {
    background: rgba(255, 255, 255, 0.9);
    transform: scale(1.2);
  }

  &.active {
    background: white;
    width: 28px;
    border-radius: 4px;
  }
}

// 卡片信息
.card-info {
  padding: $spacing-3 $spacing-4;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid rgba(0, 0, 0, 0.04);
  background: #fafafa;
}

.info-main {
  flex: 1;
}

.room-title {
  font-size: $font-size-lg;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 4px;
}

.room-style {
  font-size: $font-size-sm;
  color: #666;
  display: flex;
  align-items: center;
  gap: 6px;

  &::before {
    content: '🎨';
    font-size: 14px;
  }
}

.info-actions {
  display: flex;
  gap: $spacing-2;
}

.action-btn {
  width: 40px;
  height: 40px;
  border: 1px solid #e0e0e0;
  background: white;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  position: relative;

  svg {
    width: 20px;
    height: 20px;
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

  &:active {
    transform: translateY(0) scale(0.95);
  }

  // 已收藏状�?
  &--liked {
    border-color: #ff4757;
    background: rgba(255, 71, 87, 0.05);

    svg {
      color: #ff4757;
      animation: heartBeat 0.3s ease;
    }

    &:hover {
      border-color: #ff4757;
      background: rgba(255, 71, 87, 0.1);

      svg {
        color: #ff4757;
      }
    }
  }
}

@keyframes heartBeat {
  0%, 100% { transform: scale(1); }
  25% { transform: scale(1.2); }
  50% { transform: scale(0.95); }
  75% { transform: scale(1.1); }
}

// 响应�?
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .header-actions {
    width: 100%;
    
    .action-button {
      flex: 1;
      justify-content: center;
    }
  }

  .designs-grid {
    grid-template-columns: 1fr;
  }

  .carousel-btn {
    width: 36px;
    height: 36px;

    svg {
      width: 18px;
      height: 18px;
    }
  }
}
</style>
