<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { videoService } from '@/services/videoService'
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

// 输入状态
const prompt = ref('')
const referenceImage = ref<File | null>(null)
const imagePreview = ref('')
const imageInputRef = ref<HTMLInputElement>()

// 参数配置（默认使用最快设置）
const aspectRatio = ref<'9:16' | '16:9'>('16:9')  // 横屏通常更快
const duration = ref<5 | 10>(5)  // 默认5秒（只能是5或10）
const size = ref<'small' | 'large'>('small')  // 默认标清（最快）

// 生成状态
const generating = ref(false)
const progress = ref(0)
const resultVideoUrl = ref('')
const error = ref('')

// 拖拽状态
const isDragging = ref(false)

// 计算属性
const canGenerate = computed(() => {
  return (prompt.value.trim() !== '' || referenceImage.value !== null) && !generating.value
})

// 处理图片上传
const handleImageSelect = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) await processImageFile(file)
}

const handleImageDrop = async (event: DragEvent) => {
  event.preventDefault()
  isDragging.value = false
  const file = event.dataTransfer?.files[0]
  if (file) await processImageFile(file)
}

const processImageFile = async (file: File) => {
  // 验证文件类型
  if (!file.type.startsWith('image/')) {
    ElMessage.error('请上传图片文件')
    return
  }
  
  if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
    ElMessage.error('只支持 JPG 和 PNG 格式')
    return
  }
  
  // 验证文件大小（最大 10MB）
  const maxSize = 10 * 1024 * 1024
  if (file.size > maxSize) {
    ElMessage.error('图片大小不能超过 10MB')
    return
  }
  
  // 压缩图片以加快上传和处理速度
  const compressedFile = await compressImage(file)
  referenceImage.value = compressedFile
  
  // 生成预览
  const reader = new FileReader()
  reader.onload = (e) => {
    imagePreview.value = e.target?.result as string
  }
  reader.readAsDataURL(compressedFile)
  
  ElMessage.success('图片上传成功')
}

// 压缩图片
const compressImage = async (file: File): Promise<File> => {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height
        
        // 限制最大尺寸为 1024px，加快处理速度
        const maxSize = 1024
        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = (height / width) * maxSize
            width = maxSize
          } else {
            width = (width / height) * maxSize
            height = maxSize
          }
        }
        
        canvas.width = width
        canvas.height = height
        
        const ctx = canvas.getContext('2d')
        ctx?.drawImage(img, 0, 0, width, height)
        
        canvas.toBlob((blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now()
            })
            console.log(`📦 图片压缩: ${(file.size / 1024).toFixed(0)}KB -> ${(compressedFile.size / 1024).toFixed(0)}KB`)
            resolve(compressedFile)
          } else {
            resolve(file)
          }
        }, 'image/jpeg', 0.85)  // 85% 质量
      }
      img.src = e.target?.result as string
    }
    reader.readAsDataURL(file)
  })
}

// 清除图片
const clearImage = () => {
  referenceImage.value = null
  imagePreview.value = ''
  if (imageInputRef.value) imageInputRef.value.value = ''
}

// 开始生成视频
const startGeneration = async () => {
  // 验证输入
  if (!prompt.value.trim() && !referenceImage.value) {
    ElMessage.warning('请至少提供文字描述或参考图片')
    return
  }

  if (!videoService.isConfigured()) {
    ElMessage.error('API 密钥未配置，请在 .env.local 中设置 VITE_GRSAI_API_KEY')
    return
  }
  
  try {
    generating.value = true
    progress.value = 0
    resultVideoUrl.value = ''
    error.value = ''
    
    // 准备参数
    let imageBase64: string | undefined
    if (referenceImage.value) {
      imageBase64 = await videoService.fileToBase64(referenceImage.value)
    }
    
    // 调用 API 生成视频（带进度回调）
    const videoUrl = await videoService.generateVideo({
      prompt: prompt.value.trim(),
      url: imageBase64,
      aspectRatio: aspectRatio.value,
      duration: duration.value,
      size: size.value,
      onProgress: (prog, attempts) => {
        // 更新进度
        progress.value = prog
        console.log(`📊 前端进度更新: ${prog}% (${attempts} 次)`)
      }
    })
    
    resultVideoUrl.value = videoUrl
    progress.value = 100
    ElMessage.success('视频生成完成')
    
    // 保存到历史记录
    saveToHistory()
  } catch (err) {
    error.value = err instanceof Error ? err.message : '生成失败，请重试'
    ElMessage.error(error.value)
  } finally {
    generating.value = false
  }
}

// 重置表单（保留输入）
const resetForm = () => {
  generating.value = false
  progress.value = 0
  resultVideoUrl.value = ''
  error.value = ''
}

// 下载视频
const downloadVideo = async () => {
  if (!resultVideoUrl.value) return
  
  try {
    ElMessage.info('正在准备下载...')
    
    // 使用 fetch 获取视频数据
    const response = await fetch(resultVideoUrl.value)
    const blob = await response.blob()
    
    // 创建下载链接
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `video-${Date.now()}.mp4`
    document.body.appendChild(link)
    link.click()
    
    // 清理
    window.URL.revokeObjectURL(url)
    document.body.removeChild(link)
    
    ElMessage.success('下载成功')
  } catch (error) {
    console.error('下载失败:', error)
    ElMessage.error('下载失败，请右键点击视频选择"视频另存为"')
  }
}

// 保存到历史记录
const saveToHistory = () => {
  if (!resultVideoUrl.value) return
  
  try {
    const historyKey = 'video_generation_history'
    const history = JSON.parse(localStorage.getItem(historyKey) || '[]')
    
    const newRecord = {
      id: Date.now().toString(),
      videoUrl: resultVideoUrl.value,
      prompt: prompt.value.trim(),
      hasImage: !!referenceImage.value,
      aspectRatio: aspectRatio.value,
      duration: duration.value,
      size: size.value,
      status: 'completed',
      createdAt: new Date().toISOString()
    }
    
    history.unshift(newRecord)
    
    // 只保留最近100条记录
    if (history.length > 100) {
      history.splice(100)
    }
    
    localStorage.setItem(historyKey, JSON.stringify(history))
    console.log('✅ 已保存到历史记录')
  } catch (error) {
    console.error('保存历史记录失败:', error)
  }
}

// 视频加载成功
const handleVideoLoaded = () => {
  console.log('✅ 视频元数据加载成功')
}

// 视频加载错误
const handleVideoError = (event: Event) => {
  console.error('❌ 视频加载失败:', event)
  const videoElement = event.target as HTMLVideoElement
  const error = videoElement.error
  
  let errorMessage = '视频加载失败'
  if (error) {
    switch (error.code) {
      case error.MEDIA_ERR_ABORTED:
        errorMessage = '视频加载被中止'
        break
      case error.MEDIA_ERR_NETWORK:
        errorMessage = '网络错误，无法加载视频'
        break
      case error.MEDIA_ERR_DECODE:
        errorMessage = '视频解码失败'
        break
      case error.MEDIA_ERR_SRC_NOT_SUPPORTED:
        errorMessage = '视频格式不支持或URL无效'
        break
    }
  }
  
  ElMessage.error(errorMessage)
  console.error('视频错误详情:', {
    code: error?.code,
    message: error?.message,
    src: videoElement.src
  })
}
</script>

<template>
  <div class="video-generation-page">
    <!-- 导航�?-->
    <NavigationBar />

    <div class="container">
      <!-- 页面标题 -->
      <div class="header">
        <h1>🎬 宣传视频</h1>
        <p class="subtitle">通过文字描述，或参考图片，AI 为您生成精彩视频</p>
      </div>

      <!-- 输入区域 -->
      <div v-if="!generating && !resultVideoUrl" class="input-section">
        <!-- 文字输入 -->
        <div class="input-card">
          <h3>文字描述</h3>
          <p class="hint">描述您想要生成的视频内容（可选）</p>
          <el-input
            v-model="prompt"
            type="textarea"
            :rows="6"
            placeholder="例如：一个现代简约风格的客厅，阳光透过落地窗洒进来，温馨舒适..."
            maxlength="500"
            show-word-limit
          />
        </div>

        <!-- 图片上传 -->
        <div class="input-card">
          <h3>参考图片</h3>
          <p class="hint">上传参考图片（可选，支持 JPG/PNG，最大 10MB）</p>
          
          <div
            v-if="!imagePreview"
            class="upload-area"
            :class="{ 'dragging': isDragging }"
            @click="imageInputRef?.click()"
            @drop="handleImageDrop"
            @dragover.prevent="isDragging = true"
            @dragleave="isDragging = false"
          >
            <div class="upload-icon">📷</div>
            <p class="upload-text">点击或拖拽上传图片</p>
            <p class="upload-hint">支持 JPG、PNG、DWG、DXF 格式</p>
            <input
              ref="imageInputRef"
              type="file"
              accept="image/jpeg,image/jpg,image/png,.dwg,.dxf"
              style="display: none"
              @change="handleImageSelect"
            />
          </div>

          <div v-else class="preview-container">
            <img :src="imagePreview" alt="参考图片" class="preview-image" />
            <button class="clear-button" @click="clearImage">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- 参数配置 -->
        <div class="params-card">
          <h3>视频参数</h3>
          
          <div class="speed-tip">
            <span class="tip-icon">⚡</span>
            <span class="tip-text">提示：使用横屏、10秒、标清可获得最快生成速度</span>
          </div>
          
          <div class="param-group">
            <label>视频比例</label>
            <el-radio-group v-model="aspectRatio">
              <el-radio label="16:9">横屏 (16:9) ⚡ 推荐</el-radio>
              <el-radio label="9:16">竖屏 (9:16)</el-radio>
            </el-radio-group>
          </div>

          <div class="param-group">
            <label>视频时长：{{ duration }} 秒</label>
            <el-slider
              v-model="duration"
              :min="1"
              :max="10"
              :step="1"
              :marks="{ 1: '1s', 5: '5s ⚡', 10: '10s' }"
              show-stops
            />
            <p class="param-hint">推荐5秒，生成速度更快</p>
          </div>

          <div class="param-group">
            <label>视频清晰度</label>
            <el-radio-group v-model="size">
              <el-radio label="small">标清 ⚡ 推荐</el-radio>
              <el-radio label="large">高清 (较慢)</el-radio>
            </el-radio-group>
          </div>
        </div>

        <!-- 生成按钮 -->
        <div class="action-section">
          <button 
            class="generate-button"
            :disabled="!canGenerate"
            @click="startGeneration"
          >
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
            </svg>
            生成视频
          </button>
        </div>
      </div>

      <!-- 生成中状�?-->
      <div v-if="generating" class="generating-section">
        <div class="spinner"></div>
        <h2>AI 正在生成视频...</h2>
        <p>约需 3-5 分钟，请耐心等待</p>
        
        <!-- 进度�?-->
        <div class="progress-container">
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: progress + '%' }"></div>
          </div>
          <div class="progress-text">{{ progress }}%</div>
        </div>
        
        <div class="progress-info">
          <p v-if="progress < 30">⚙️ 正在初始化...</p>
          <p v-else-if="progress < 70">🎬 正在生成视频...</p>
          <p v-else-if="progress < 100">✨ 正在渲染和优化...</p>
          <p v-else>🎉 即将完成...</p>
        </div>
      </div>

      <!-- 生成结果 -->
      <div v-if="resultVideoUrl && !generating" class="result-section">
        <h2>✨ 生成结果</h2>
        <div class="video-url-box">
          <p class="url-label">视频已生成，请点击下方链接访问：</p>
          <a :href="resultVideoUrl" target="_blank" rel="noopener noreferrer" class="video-url-link">
            {{ resultVideoUrl }}
          </a>
          <p class="url-tip">💡 提示：链接有效期为 2 小时，请及时访问或下载</p>
        </div>
        <div class="result-actions">
          <button class="action-btn secondary" @click="resetForm">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
              <path d="M21 3v5h-5"/>
              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
              <path d="M3 21v-5h5"/>
            </svg>
            重新生成
          </button>
          <a :href="resultVideoUrl" target="_blank" rel="noopener noreferrer" class="action-btn primary" style="text-decoration: none;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            访问视频
          </a>
        </div>
      </div>

      <!-- 使用提示 -->
      <div v-if="!generating && !resultVideoUrl" class="tips-section">
        <h3>💡 使用提示</h3>
        <ul>
          <li><strong>支持格式：</strong>JPG、PNG图片，以及DWG、DXF格式的CAD图纸</li>
          <li><strong>加快生成速度：</strong>使用横屏(16:9)、10秒时长、标清画质</li>
          <li><strong>提示词建议：</strong>简洁明了的描述比长篇大论更有效</li>
          <li><strong>图片优化：</strong>系统会自动压缩图片以加快处理速度</li>
          <li><strong>预计时间：</strong>5秒视频约需 1-2 分钟，10秒视频约需 3-5 分钟</li>
          <li><strong>及时下载：</strong>生成的视频 URL 有效期为 2 小时</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.video-generation-page {
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
  max-width: 1000px;
  margin: 0 auto;
}

.header {
  text-align: center;
  margin-bottom: 3rem;
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

.input-section {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  margin-bottom: 2rem;
}

.input-card, .params-card {
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
    font-size: 3rem;
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
    max-height: 400px;
    object-fit: contain;
    border-radius: 1rem;
    background: rgba(0, 0, 0, 0.3);
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

.params-card {
  .param-group {
    margin-bottom: 1.5rem;

    &:last-child {
      margin-bottom: 0;
    }

    label {
      display: block;
      font-size: 0.875rem;
      color: #666;
      margin-bottom: 0.75rem;
      font-weight: 500;
    }

    .param-hint {
      font-size: 0.75rem;
      color: #999;
      margin-top: 0.5rem;
      margin-bottom: 0;
    }
  }

  .speed-tip {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    background: rgba(24, 144, 255, 0.1);
    border: 1px solid rgba(24, 144, 255, 0.3);
    border-radius: 0.5rem;
    margin-bottom: 1.5rem;

    .tip-icon {
      font-size: 1.25rem;
    }

    .tip-text {
      font-size: 0.875rem;
      color: #1890ff;
    }
  }
}

.action-section {
  text-align: center;
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
    margin-bottom: 2rem;
  }

  .progress-container {
    max-width: 500px;
    margin: 0 auto 1.5rem;
  }

  .progress-bar {
    width: 100%;
    height: 8px;
    background: rgba(24, 144, 255, 0.1);
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: 0.5rem;
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #1890ff 0%, #1890ff 100%);
    border-radius: 4px;
    transition: width 0.3s ease;
  }

  .progress-text {
    color: #1890ff;
    font-size: 1.25rem;
    font-weight: 600;
    font-family: monospace;
  }

  .progress-info {
    color: #666;
    font-size: 0.875rem;
    margin-top: 1rem;
  }
}

.result-section {
  text-align: center;
  margin-bottom: 2rem;
  animation: fadeIn 0.5s ease-out;
  display: flex;
  flex-direction: column;
  align-items: center;

  h2 {
    font-size: 1.75rem;
    font-weight: 600;
    color: #1a1a1a;
    margin-bottom: 2rem;
  }

  .result-video {
    max-width: 90vw;
    max-height: 70vh;
    border-radius: 1rem;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    background: #fff;
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

.video-url-box {
  background: linear-gradient(135deg, #f5f7fa 0%, #e8eef5 100%);
  border: 2px solid #1890ff;
  border-radius: 1rem;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.1);

  .url-label {
    font-size: 0.95rem;
    font-weight: 500;
    color: #333;
    margin-bottom: 0.75rem;
  }

  .video-url-link {
    display: block;
    background: white;
    padding: 1rem;
    border-radius: 0.5rem;
    color: #1890ff;
    text-decoration: none;
    word-break: break-all;
    font-size: 0.875rem;
    border: 1px solid #d9d9d9;
    transition: all 0.3s ease;

    &:hover {
      border-color: #1890ff;
      box-shadow: 0 2px 8px rgba(24, 144, 255, 0.2);
    }
  }

  .url-tip {
    font-size: 0.85rem;
    color: #666;
    margin-top: 0.75rem;
    margin-bottom: 0;
  }
}

.tips-section {
  background: #fafafa;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(0, 0, 0, 0.05);
  border-radius: 1.5rem;
  padding: 2rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06), 0 1px 4px rgba(0, 0, 0, 0.04);

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

// Element Plus 样式覆盖
:deep(.el-textarea__inner) {
  background: white;
  border: 1px solid #e0e0e0;
  color: #1a1a1a;
  font-size: 0.875rem;
  
  &::placeholder {
    color: #999;
  }
  
  &:focus {
    border-color: #1890ff;
  }
}

:deep(.el-radio-group) {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

:deep(.el-radio) {
  color: #666;
  
  .el-radio__input.is-checked + .el-radio__label {
    color: #1890ff;
  }
  
  .el-radio__input.is-checked .el-radio__inner {
    background: #1890ff;
    border-color: #1890ff;
  }
  
  .el-radio__inner {
    background: white;
    border-color: #d0d0d0;
  }
}

// 响应式设�?
@media (max-width: 768px) {
  .video-generation-page {
    padding: 1rem;
  }

  .back-button {
    top: 1rem;
    left: 1rem;
  }

  .header h1 {
    font-size: 2rem;
  }

  .input-card, .params-card {
    padding: 1.5rem;
  }
}
</style>
