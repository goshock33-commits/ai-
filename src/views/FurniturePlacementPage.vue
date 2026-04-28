<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Picture, Box } from '@element-plus/icons-vue'
import { furnitureService } from '@/services/furnitureService'
import { useUserStore } from '@/stores'
import NavigationBar from '@/components/NavigationBar.vue'

const router = useRouter()
const userStore = useUserStore()

// 检查登录状态
onMounted(() => {
  if (!userStore.loggedIn) {
    ElMessage.warning('请先登录后再使用此功能')
    setTimeout(() => {
      router.push('/login')
    }, 1500)
  }
})

const isDraggingRoom = ref(false)
const isDraggingFurniture = ref(false)
const roomImageFile = ref<File | null>(null)
const furnitureImageFile = ref<File | null>(null)
const roomPreview = ref('')
const furniturePreview = ref('')
const generating = ref(false)
const resultImage = ref('')

const roomInputRef = ref<HTMLInputElement>()
const furnitureInputRef = ref<HTMLInputElement>()

// 处理房间图片上传
const handleRoomFileSelect = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) await processRoomFile(file)
}

const handleRoomDrop = async (event: DragEvent) => {
  event.preventDefault()
  isDraggingRoom.value = false
  const file = event.dataTransfer.files[0]
  if (file) await processRoomFile(file)
}

const processRoomFile = async (file: File) => {
  if (!file.type.startsWith('image/')) {
    ElMessage.error('请上传图片文件')
    return
  }
  
  roomImageFile.value = file
  const reader = new FileReader()
  reader.onload = (e) => {
    roomPreview.value = e.target.result as string
  }
  reader.readAsDataURL(file)
  ElMessage.success('房间照片上传成功')
}

// 处理家具图片上传
const handleFurnitureFileSelect = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) await processFurnitureFile(file)
}

const handleFurnitureDrop = async (event: DragEvent) => {
  event.preventDefault()
  isDraggingFurniture.value = false
  const file = event.dataTransfer.files[0]
  if (file) await processFurnitureFile(file)
}

const processFurnitureFile = async (file: File) => {
  if (!file.type.startsWith('image/')) {
    ElMessage.error('请上传图片文件')
    return
  }
  
  furnitureImageFile.value = file
  const reader = new FileReader()
  reader.onload = (e) => {
    furniturePreview.value = e.target.result as string
  }
  reader.readAsDataURL(file)
  ElMessage.success('家具照片上传成功')
}

const startGeneration = async () => {
  if (!roomImageFile.value) {
    ElMessage.warning('请先上传房间照片')
    return
  }
  
  if (!furnitureImageFile.value) {
    ElMessage.warning('请先上传家具照片')
    return
  }

  if (!furnitureService.isConfigured()) {
    ElMessage.error('API 密钥未配置，请在 .env.local 中设置 VITE_GRSAI_API_KEY')
    return
  }
  
  try {
    generating.value = true
    resultImage.value = ''
    
    // 调用 AI API 生成效果图
    const result = await furnitureService.generateFurniturePlacement(
      roomImageFile.value,
      furnitureImageFile.value
    )
    
    resultImage.value = result
    
    // 保存到历史记�
    saveToHistory(roomPreview.value, furniturePreview.value, result)
    
    ElMessage.success('效果图生成完成！')
  } catch (error) {
    console.error('生成失败:', error)
    ElMessage.error(error instanceof Error ? error.message : '生成失败，请重试')
  } finally {
    generating.value = false
  }
}

// 保存到历史记录
const saveToHistory = (roomImg: string, furnitureImg: string, resultImg: string) => {
  try {
    const historyKey = 'furniture_placement_history'
    const history = JSON.parse(localStorage.getItem(historyKey) || '[]')
    
    const newRecord = {
      id: `furniture-${Date.now()}`,
      roomImage: roomImg,
      furnitureImage: furnitureImg,
      resultImage: resultImg,
      createdAt: new Date().toISOString()
    }
    
    // 添加到数组开头（最新的在前面）
    history.unshift(newRecord)
    
    // 限制历史记录数量（最多保存 10 条，避免超出配额）
    if (history.length > 10) {
      history.splice(10)
    }
    
    try {
      localStorage.setItem(historyKey, JSON.stringify(history))
      console.log('历史记录已保存')
    } catch (quotaError) {
      // 如果仍然超出配额，清理旧记录
      console.warn('存储配额不足，清理旧记录...')
      history.splice(5) // 只保留最新5条
      try {
        localStorage.setItem(historyKey, JSON.stringify(history))
        console.log('历史记录已保存（已清理）')
      } catch (e) {
        console.error('存储失败，清空历史记录')
        localStorage.removeItem(historyKey)
      }
    }
  } catch (error) {
    console.error('保存历史记录失败:', error)
  }
}

const clearRoom = () => {
  roomImageFile.value = null
  roomPreview.value = ''
  if (roomInputRef.value) roomInputRef.value.value = ''
}

const clearFurniture = () => {
  furnitureImageFile.value = null
  furniturePreview.value = ''
  if (furnitureInputRef.value) furnitureInputRef.value.value = ''
}

const resetAll = () => {
  clearRoom()
  clearFurniture()
  resultImage.value = ''
}

const downloadResult = () => {
  if (!resultImage.value) return
  
  const link = document.createElement('a')
  link.href = resultImage.value
  link.download = `furniture-placement-${Date.now()}.jpg`
  link.click()
  ElMessage.success('开始下载')
}
</script>

<template>
  <div class="furniture-placement-page">
    <!-- 导航�-->
    <NavigationBar />

    <div class="container">
      <div class="header">
        <h1>🪑 软装布置</h1>
        <p class="subtitle">上传您的房间照片和心仪的家具，AI 为您生成真实摆放效果</p>
      </div>

      <div v-if="!generating" class="upload-section">
        <!-- 房间照片上传 -->
        <div class="upload-card">
          <h3>步骤 1：上传房间照片</h3>
          <p class="hint">上传您家里的真实照片</p>
          
          <div
            v-if="!roomPreview"
            class="upload-area"
            :class="{ 'dragging': isDraggingRoom }"
            @click="roomInputRef?.click()"
            @drop="handleRoomDrop"
            @dragover.prevent="isDraggingRoom = true"
            @dragleave="isDraggingRoom = false"
          >
            <div class="upload-icon">
              <el-icon :size="48" color="#1890ff">
                <Picture />
              </el-icon>
            </div>
            <p class="upload-text">点击或拖拽上传</p>
            <p class="upload-hint">支持 JPG、PNG、DWG、DXF 格式</p>
            <input
              ref="roomInputRef"
              type="file"
              accept="image/*,.dwg,.dxf"
              style="display: none"
              @change="handleRoomFileSelect"
            />
          </div>

          <div v-else class="preview-container">
            <img :src="roomPreview" alt="房间照片" class="preview-image" />
            <button class="clear-button" @click="clearRoom">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- 家具照片上传 -->
        <div class="upload-card">
          <h3>步骤 2：上传家具照片</h3>
          <p class="hint">上传您想要摆放的家具或家居</p>
          
          <div
            v-if="!furniturePreview"
            class="upload-area"
            :class="{ 'dragging': isDraggingFurniture }"
            @click="furnitureInputRef?.click()"
            @drop="handleFurnitureDrop"
            @dragover.prevent="isDraggingFurniture = true"
            @dragleave="isDraggingFurniture = false"
          >
            <div class="upload-icon">
              <el-icon :size="48" color="#52c41a">
                <Box />
              </el-icon>
            </div>
            <p class="upload-text">点击或拖拽上传</p>
            <p class="upload-hint">支持 JPG、PNG 格式</p>
            <input
              ref="furnitureInputRef"
              type="file"
              accept="image/*"
              style="display: none"
              @change="handleFurnitureFileSelect"
            />
          </div>

          <div v-else class="preview-container">
            <img :src="furniturePreview" alt="家具照片" class="preview-image" />
            <button class="clear-button" @click="clearFurniture">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- 生成按钮 -->
      <div v-if="!generating" class="action-section">
        <button 
          class="generate-button"
          :disabled="!roomImageFile || !furnitureImageFile"
          @click="startGeneration"
        >
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
          </svg>
          生成效果图
        </button>
      </div>

      <!-- 生成中状�-->
      <div v-if="generating" class="generating-section">
        <div class="spinner"></div>
        <h2>AI 正在生成效果图...</h2>
        <p>请稍候，这可能需要 10-30 秒</p>
      </div>

      <!-- 生成结果 -->
      <div v-if="resultImage && !generating" class="result-section">
        <h2>✨ 生成结果</h2>
        <div class="result-image-container">
          <img :src="resultImage" alt="效果图" class="result-image" />
        </div>
        <div class="result-actions">
          <button class="action-btn secondary" @click="resetAll">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
              <path d="M21 3v5h-5"/>
              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
              <path d="M3 21v-5h5"/>
            </svg>
            重新生成
          </button>
          <button class="action-btn primary" @click="downloadResult">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            下载效果图
          </button>
        </div>
      </div>

      <!-- 使用提示 -->
      <div v-if="!generating" class="tips-section">
        <h3>💡 使用提示</h3>
        <ul>
          <li><strong>房间照片建议拍摄清晰、光线充足的场景，也支持CAD图纸（DWG、DXF格式）</strong></li>
          <li><strong>家具照片最好是纯色背景或官方产品图</strong></li>
          <li><strong>AI 会自动调整家具大小和角度以适应房间</strong></li>
          <li><strong>生成的效果图可以帮助您决定是否购买该家具</strong></li>
        </ul>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.furniture-placement-page {
  min-height: 100vh;
  background: linear-gradient(to bottom, 
    #f0f4ff 0%, 
    #e8f0ff 30%, 
    #f5f7fa 60%, 
    #f5f7fa 100%
  );
  padding: 100px 2rem 2rem;
  position: relative;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  text-align: center;
  margin-bottom: 2.5rem;
  animation: fadeIn 0.5s ease-out;

  h1 {
    font-size: 2.5rem;
    font-weight: 700;
    background: linear-gradient(135deg, #1890ff 0%, #1890ff 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin-bottom: 1rem;
  }

  .subtitle {
    font-size: 1.125rem;
    color: #4a5568;
  }
}

.upload-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 2rem;
  margin-bottom: 2.5rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}

.upload-card {
  background: #fafafa;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(0, 0, 0, 0.05);
  border-radius: 1.5rem;
  padding: 2rem;
  animation: slideUp 0.5s ease-out;
  box-shadow: 0 6px 30px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.06);

  h3 {
    font-size: 1.25rem;
    font-weight: 600;
    color: #1a1a1a;
    margin-bottom: 0.5rem;
  }

  .hint {
    font-size: 0.875rem;
    color: #666;
    margin-bottom: 1.5rem;
  }
}

.upload-area {
  border: 2px dashed #d0d0d0;
  border-radius: 1rem;
  padding: 3rem 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: white;

  &:hover, &.dragging {
    border-color: #1890ff;
    background: rgba(24, 144, 255, 0.05);
  }

  .upload-icon {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-bottom: 1rem;
  }

  .upload-text {
    font-size: 1rem;
    color: #1a1a1a;
    margin-bottom: 0.5rem;
  }

  .upload-hint {
    font-size: 0.75rem;
    color: #666;
  }
}

.preview-container {
  position: relative;
  border-radius: 1rem;
  overflow: hidden;

  .preview-image {
    width: 100%;
    height: 300px;
    object-fit: cover;
    border-radius: 1rem;
  }

  .clear-button {
    position: absolute;
    top: 1rem;
    right: 1rem;
    width: 36px;
    height: 36px;
    background: rgba(0, 0, 0, 0.6);
    border: none;
    border-radius: 50%;
    color: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;

    svg {
      width: 20px;
      height: 20px;
    }

    &:hover {
      background: rgba(255, 0, 0, 0.8);
      transform: scale(1.1);
    }
  }
}

.action-section {
  text-align: center;
  margin-bottom: 2.5rem;
}

.generate-button {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 3rem;
  background: linear-gradient(135deg, #1890ff 0%, #1890ff 100%);
  border: none;
  border-radius: 9999px;
  color: white;
  font-size: 1.125rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(24, 144, 255, 0.3);

  .icon {
    width: 24px;
    height: 24px;
  }

  &:hover:not(:disabled) {
    transform: translateY(-3px);
    box-shadow: 0 10px 40px rgba(24, 144, 255, 0.4);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.generating-section {
  text-align: center;
  padding: 4rem 2rem;
  animation: fadeIn 0.5s ease-out;

  .spinner {
    width: 60px;
    height: 60px;
    border: 4px solid rgba(24, 144, 255, 0.1);
    border-top-color: #1890ff;
    border-radius: 50%;
    margin: 0 auto 2rem;
    animation: spin 1s linear infinite;
  }

  h2 {
    font-size: 1.5rem;
    color: #1a1a1a;
    margin-bottom: 0.5rem;
  }

  p {
    color: #666;
  }
}

.tips-section {
  background: #fafafa;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(0, 0, 0, 0.05);
  border-radius: 1.5rem;
  padding: 2rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06), 0 1px 4px rgba(0, 0, 0, 0.04);
  margin-top: 2rem;

  h3 {
    font-size: 1.25rem;
    font-weight: 600;
    color: #1890ff;
    margin-bottom: 1rem;
  }

  ul {
    list-style: none;
    padding: 0;
    margin: 0;

    li {
      padding: 0.5rem 0;
      color: #666;
      font-size: 0.875rem;
      line-height: 1.6;

      &:before {
        content: '✓';
        color: #1890ff;
        font-weight: bold;
        margin-right: 0.5rem;
      }
    }
  }
}

.result-section {
  text-align: center;
  margin-bottom: 2.5rem;
  animation: fadeIn 0.5s ease-out;

  h2 {
    font-size: 1.75rem;
    font-weight: 600;
    color: #1a1a1a;
    margin-bottom: 1.5rem;
  }
}

.result-image-container {
  max-width: 800px;
  margin: 0 auto 1.5rem;
  border-radius: 1rem;
  overflow: hidden;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);

  .result-image {
    width: 100%;
    height: auto;
    display: block;
  }
}

.result-actions {
  display: flex;
  justify-content: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;

  svg {
    width: 18px;
    height: 18px;
  }

  &.primary {
    background: linear-gradient(135deg, #1890ff 0%, #1890ff 100%);
    color: white;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 30px rgba(24, 144, 255, 0.4);
    }
  }

  &.secondary {
    background: linear-gradient(135deg, #1890ff 0%, #1890ff 100%);
    border: none;
    color: white;
    box-shadow: 0 2px 8px rgba(24, 144, 255, 0.3);

    &:hover {
      background: linear-gradient(135deg, #5568d3 0%, #653a8b 100%);
      box-shadow: 0 4px 12px rgba(24, 144, 255, 0.4);
      transform: translateY(-2px);
    }
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
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
</style>
