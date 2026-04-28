<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useProjectStore, useUserStore } from '@/stores'
import { validateFile } from '@/utils/validation'
import { imageService } from '@/services/imageService'
import { aiService } from '@/services/aiService'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import ProgressStepper from '@/components/ProgressStepper.vue'
import NavigationBar from '@/components/NavigationBar.vue'

const router = useRouter()
const projectStore = useProjectStore()
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

const uploading = ref(false)
const detecting = ref(false)
const generating = ref(false)
const generationProgress = ref(0)
const currentRoom = ref('')
const isDragging = ref(false)
const fileInputRef = ref<HTMLInputElement>()
const previewUrl = ref('')
const showRequirementInput = ref(false)
const userRequirement = ref('')
const uploadedFile = ref<File | null>(null) // 保存上传的文�

const steps = ['上传户型图', '输入需求', '生成设计', '查看结果']

// 当前步骤
const currentStep = computed(() => {
  if (generating.value) return 2  // 生成设计阶段
  if (detecting.value) return 1   // 识别阶段（已输入需求）
  if (showRequirementInput.value) return 1  // 输入需求阶段
  return 0  // 上传图片阶段
})

// 需求示例
const requirementExamples = [
  '北欧简约风格，浅色木地板，仅在客厅中增加一个米白色布艺沙发',
  '现代简约，白色墙面，灰色地砖，简洁大方',
  '新中式风格，深色实木家具，中式吊灯，温馨雅致',
  '日式风格，原木色家具，榻榻米，简约自然'
]

const processFile = async (file: File) => {
  // 验证文件
  const validation = validateFile(file)
  if (!validation.valid) {
    ElMessage.error(validation.error)
    return
  }

  try {
    uploading.value = true

    // 保存文件引用
    uploadedFile.value = file

    // 上传图片
    const imageUrl = await imageService.uploadImage(file)
    previewUrl.value = imageUrl
    
    // 创建新项目（如果没有当前项目）
    if (!projectStore.currentProject) {
      projectStore.createProject('室内设计项目')
    }
    
    // 更新项目
    await projectStore.updateCurrentProject({
      floorPlanUrl: imageUrl
    })

    ElMessage.success('上传成功')
    uploading.value = false
    
    // 显示需求输入框
    showRequirementInput.value = true
  } catch (error) {
    console.error('Upload failed:', error)
    ElMessage.error('上传失败，请重试')
    uploading.value = false
  }
}

const useExample = (example: string) => {
  userRequirement.value = example
}

const startGeneration = async () => {
  if (!userRequirement.value.trim()) {
    ElMessage.warning('请输入您的装修需求')
    return
  }

  if (!uploadedFile.value) {
    ElMessage.error('上传户型图')
    return
  }

  try {
    // 第一步：识别房间
    detecting.value = true
    showRequirementInput.value = false
    
    console.log('开始识别房间...')
    
    // 使用智能推断生成房间（基于上传的图片）
    const rooms = await aiService.detectRooms(uploadedFile.value)
    
    console.log('识别完成，房间数量:', rooms.length)
    
    // 确保有当前项目
    if (!projectStore.currentProject) {
      console.log('创建新项目...')
      projectStore.createProject('室内设计项目')
    }
    
    await projectStore.updateCurrentProject({
      rooms,
      selectedStyle: userRequirement.value // 将用户需求作为风格保存
    })

    ElMessage.success('识别完成，开始生成设计')
    
    // 第二步：生成设计
    detecting.value = false
    generating.value = true
    generationProgress.value = 0
    
    const project = projectStore.currentProject
    if (!project) {
      throw new Error('项目信息丢失，请刷新页面重试')
    }
    
    console.log('开始生成设计，项目ID:', project.id)
    
    const designs = await aiService.batchGenerateDesigns(
      project.rooms,
      project.selectedStyle,
      (current, total, roomName) => {
        generationProgress.value = Math.round((current / total) * 100)
        if (roomName) {
          currentRoom.value = roomName
        }
      }
    )

    await projectStore.updateCurrentProject({
      designs,
      status: 'completed'
    })

    ElMessage.success('设计生成完成')
    
    console.log('生成完成，准备跳转到结果页面')
    
    // 跳转到结果页面
    setTimeout(() => {
      router.push(`/results/${project.id}`)
    }, 500)
  } catch (error) {
    console.error('Generation failed:', error)
    ElMessage.error(error instanceof Error ? error.message : '生成失败，请重试')
    if (projectStore.currentProject) {
      projectStore.updateCurrentProject({ status: 'failed' })
    }
  } finally {
    detecting.value = false
    generating.value = false
  }
}

const handleFileSelect = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  
  if (!file) return
  await processFile(file)
}

const handleDrop = async (event: DragEvent) => {
  event.preventDefault()
  isDragging.value = false

  const file = event.dataTransfer.files[0]
  if (!file) return

  await processFile(file)
}

const handleDragOver = (event: DragEvent) => {
  event.preventDefault()
  isDragging.value = true
}

const handleDragLeave = () => {
  isDragging.value = false
}

const triggerFileInput = () => {
  fileInputRef.value.click()
}
</script>

<template>
  <div class="upload-page">
    <!-- 导航�-->
    <NavigationBar />
    
    <div class="page-content">
      <ProgressStepper :current-step="currentStep" :steps="steps" />

      <div class="container">
        <h1>
          {{ detecting ? 'AI 识别中' : generating ? 'AI 设计中' : showRequirementInput ? '装修需求' : '上传户型图' }}
        </h1>
        <p class="subtitle">
          {{ detecting ? '正在智能分析您的户型图...' : generating ? 'AI 正在为您精心设计每一个空间...' : showRequirementInput ? '请输入您的装修设计需求' : '点击或拖拽上传户型图' }}
        </p>

      <!-- 步骤1：上传户型图 -->
      <div v-if="!uploading && !detecting && !generating && !showRequirementInput">
        <div
          class="upload-area"
          :class="{ 'upload-area--dragging': isDragging }"
          @click="triggerFileInput"
          @drop="handleDrop"
          @dragover="handleDragOver"
          @dragleave="handleDragLeave"
        >
          <div class="upload-icon">📷</div>
          <p class="upload-text">点击或拖拽上传户型图</p>
          <p class="upload-hint">支持 JPG / PNG / GIF / DWG / DXF 格式</p>
          <input
            ref="fileInputRef"
            type="file"
            accept=".jpg,.jpeg,.png,.gif,.dwg,.dxf"
            style="display: none"
            @change="handleFileSelect"
          />
        </div>

        <div class="tips">
          <h3>💡 上传提示</h3>
          <ul>
            <li>请上传清晰的房间照片或CAD图纸</li>
            <li>支持JPG、PNG、GIF、DWG、DXF格式</li>
            <li>文件大小不超过10MB</li>
          </ul>
        </div>
      </div>

      <!-- 步骤2：输入装修需�-->
      <div v-if="showRequirementInput && !detecting && !generating" class="requirement-input">
        <div v-if="previewUrl" class="preview-small">
          <img :src="previewUrl" alt="户型图预览" />
        </div>

        <div class="input-section">
          <h2>请输入装修设计方案</h2>
          <p class="input-hint">请输入您的装修设计需求，例如：</p>
          
          <el-input
            v-model="userRequirement"
            type="textarea"
            :rows="6"
            placeholder="请输入您的装修设计需求...&#10;例如：&#10;- 北欧简约风格，浅色木地板，增加一个米白色布艺沙发和地毯&#10;- 现代简约，白色墙面，灰色地砖，简洁大方"
            maxlength="500"
            show-word-limit
            class="requirement-textarea"
          />

          <div class="examples">
            <p class="examples-title">💡 参考示例（点击使用）：</p>
            <div class="examples-grid">
              <div
                v-for="(example, index) in requirementExamples"
                :key="index"
                class="example-card"
                @click="useExample(example)"
              >
                <span class="example-icon">✨</span>
                <p>{{ example }}</p>
              </div>
            </div>
          </div>

          <div class="input-actions">
            <el-button @click="showRequirementInput = false; previewUrl = ''; uploadedFile = null; userRequirement = ''">返回</el-button>
            <el-button type="primary" @click="startGeneration" :disabled="!userRequirement.trim()">
              <span style="margin-right: 4px;">✨</span> 开始设计
            </el-button>
          </div>
        </div>
      </div>

      <!-- 步骤3：生成中 -->
      <div v-if="generating && !detecting" class="generating-state">
        <div class="progress-circle-container">
          <svg class="progress-circle" viewBox="0 0 200 200">
            <defs>
              <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#1890ff;stop-opacity:1" />
                <stop offset="100%" style="stop-color:#1890ff;stop-opacity:1" />
              </linearGradient>
            </defs>
            <circle
              class="progress-circle-bg"
              cx="100"
              cy="100"
              r="85"
            />
            <circle
              class="progress-circle-fill"
              cx="100"
              cy="100"
              r="85"
              :style="{
                strokeDashoffset: 534 - (534 * generationProgress) / 100
              }"
            />
          </svg>
          <div class="progress-content">
            <div class="progress-percent">{{ generationProgress }}%</div>
          </div>
        </div>
        
        <h2 class="generating-title">AI 正在创作您的专属设计</h2>
        <p class="generating-subtitle" v-if="currentRoom">当前处理：{{ currentRoom }}</p>
        <p class="generating-tip">✨ AI正在为您精心设计每一个空间...</p>
      </div>

      <!-- 加载状�-->
      <div v-if="uploading && !detecting && !generating" class="loading-state">
        <LoadingSpinner size="large" text="上传中..." />
        <p class="loading-tip">正在处理您的图片...</p>
      </div>

      <div v-if="detecting && !generating" class="generating-state">
        <div class="progress-circle-container">
          <svg class="progress-circle" viewBox="0 0 200 200">
            <defs>
              <linearGradient id="detectingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#1890ff;stop-opacity:1" />
                <stop offset="100%" style="stop-color:#1890ff;stop-opacity:1" />
              </linearGradient>
            </defs>
            <circle
              class="progress-circle-bg"
              cx="100"
              cy="100"
              r="85"
            />
            <circle
              class="progress-circle-fill detecting-circle"
              cx="100"
              cy="100"
              r="85"
            />
          </svg>
          <div class="progress-content">
            <div class="progress-text">识别中</div>
          </div>
        </div>
        
        <h2 class="generating-title">AI 正在识别房间布局</h2>
        <p class="generating-tip">✨ 正在智能分析您的户型图...</p>
        
        <div v-if="previewUrl" class="preview-small" style="margin-top: 2rem;">
          <img :src="previewUrl" alt="户型图预览" />
        </div>
      </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;
@use '@/styles/mixins.scss' as *;

.upload-page {
  min-height: 100vh;
  background: linear-gradient(to bottom, 
    #f0f4ff 0%, 
    #e8f0ff 30%, 
    #f5f7fa 60%, 
    #f5f7fa 100%
  );
  padding: 100px 2rem 2rem;
  animation: fadeIn $duration-base $ease-out;
}

.page-content {
  max-width: 1200px;
  margin: 0 auto;
}

.container {
  max-width: 900px;
  margin: 0 auto;
  text-align: center;
}

h1 {
  font-size: $font-size-2xl;
  color: #1a1a1a;
  margin-bottom: $spacing-2;
  font-weight: $font-weight-semibold;
}

.subtitle {
  color: #666;
  margin-bottom: $spacing-4;
  font-size: $font-size-base;
}

.upload-area {
  background: #fafafa;
  border: 2px dashed #d0d0d0;
  border-radius: $radius-lg;
  padding: $spacing-6;
  cursor: pointer;
  transition: all $duration-base $ease-in-out;
  margin-bottom: $spacing-4;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06), 0 1px 4px rgba(0, 0, 0, 0.04);

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, transparent 0%, rgba(24, 144, 255, 0.05) 100%);
    opacity: 0;
    transition: opacity $duration-base $ease-in-out;
  }

  &:hover {
    border-color: #1890ff;
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12), 0 4px 8px rgba(0, 0, 0, 0.08);

    &::before {
      opacity: 1;
    }

    .upload-icon {
      transform: scale(1.1);
      color: #1890ff;
    }
  }

  &--dragging {
    border-color: #1890ff;
    background: #f0f4ff;
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.12), 0 4px 12px rgba(0, 0, 0, 0.08);

    &::before {
      opacity: 1;
    }

    .upload-icon {
      transform: scale(1.2) rotate(10deg);
      color: #1890ff;
    }
  }
}

.upload-icon {
  font-size: 64px;
  margin-bottom: $spacing-3;
  transition: all $duration-base $ease-bounce;
  color: #666;
  display: inline-block;
}

.upload-text {
  font-size: $font-size-lg;
  color: #1a1a1a;
  margin-bottom: $spacing-2;
  font-weight: $font-weight-medium;
}

.upload-hint {
  font-size: $font-size-xs;
  color: #999;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.tips {
  background: #fafafa;
  border-radius: $radius-lg;
  padding: $spacing-4;
  text-align: left;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06), 0 1px 4px rgba(0, 0, 0, 0.04);

  h3 {
    font-size: $font-size-lg;
    margin-bottom: $spacing-2;
    color: #1890ff;
    font-weight: $font-weight-semibold;
  }

  ul {
    list-style: none;
    padding: 0;
    margin: 0;

    li {
      padding: $spacing-1 0;
      color: #666;
      font-size: $font-size-sm;
      line-height: $line-height-relaxed;

      &:before {
        content: '✓';
        color: #1890ff;
        font-weight: $font-weight-bold;
        margin-right: $spacing-1;
      }
    }
  }
}

.loading-state {
  padding: $spacing-6;
  animation: fadeIn $duration-base $ease-out;
}

.loading-tip {
  margin-top: $spacing-3;
  color: #666;
  font-size: $font-size-sm;
}

.preview {
  margin-top: $spacing-4;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
  animation: fadeIn $duration-base $ease-out;

  img {
    width: 100%;
    border-radius: $radius-lg;
    box-shadow: $shadow-lg;
    border: 1px solid $text-tertiary;
  }
}

.requirement-input {
  animation: slideUp $duration-base $ease-out;
}

.preview-small {
  max-width: 400px;
  margin: 0 auto $spacing-4;
  
  img {
    width: 100%;
    border-radius: $radius-lg;
    box-shadow: $shadow-md;
    border: 2px solid $gold;
  }
}

.input-section {
  background: #fafafa;
  border-radius: $radius-lg;
  padding: $spacing-4;
  box-shadow: 0 6px 30px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.06);
  text-align: left;

  h2 {
    font-size: $font-size-xl;
    margin-bottom: $spacing-2;
    color: #1a1a1a;
    font-weight: $font-weight-semibold;
    text-align: center;
  }

  .input-hint {
    color: #666;
    margin-bottom: $spacing-3;
    font-size: $font-size-sm;
    text-align: center;
  }
}

.requirement-textarea {
  margin-bottom: $spacing-4;

  :deep(.el-textarea__inner) {
    background: white;
    border: 1px solid #e0e0e0;
    color: #1a1a1a;
    font-size: $font-size-base;
    line-height: $line-height-relaxed;
    
    &::placeholder {
      color: #999;
    }
    
    &:focus {
      border-color: #1890ff;
      box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.1);
    }
  }
}

.examples {
  margin-bottom: $spacing-4;

  &-title {
    font-size: $font-size-sm;
    color: #1890ff;
    margin-bottom: $spacing-2;
    font-weight: $font-weight-medium;
  }

  &-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: $spacing-2;
  }
}

.example-card {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: $radius-md;
  padding: $spacing-2;
  cursor: pointer;
  transition: all $duration-base $ease-in-out;
  display: flex;
  align-items: flex-start;
  gap: $spacing-1;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);

  &:hover {
    border-color: #1890ff;
    background: rgba(24, 144, 255, 0.05);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }

  .example-icon {
    font-size: 16px;
    flex-shrink: 0;
  }

  p {
    font-size: $font-size-xs;
    color: #666;
    margin: 0;
    line-height: $line-height-relaxed;
  }
}

.input-actions {
  display: flex;
  justify-content: center;
  gap: $spacing-2;
}

// 响应式设�
@media (max-width: 768px) {
  .upload-page {
    padding: $spacing-2;
  }

  h1 {
    font-size: $font-size-xl;
  }

  .upload-area {
    padding: $spacing-4;
  }

  .upload-icon {
    font-size: 48px;
  }

  .examples-grid {
    grid-template-columns: 1fr;
  }
}

// 生成中状�
.generating-state {
  text-align: center;
  padding: 3rem 2rem;
  animation: fadeIn $duration-base $ease-out;
}

.progress-circle-container {
  position: relative;
  width: 200px;
  height: 200px;
  margin: 0 auto 2rem;
}

.progress-circle {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.progress-circle-bg {
  fill: none;
  stroke: #e0e0e0;
  stroke-width: 12;
}

.progress-circle-fill {
  fill: none;
  stroke: url(#progressGradient);
  stroke-width: 12;
  stroke-linecap: round;
  stroke-dasharray: 534;
  transition: stroke-dashoffset 0.5s ease;
}

.progress-content {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}

.progress-percent {
  font-size: 2rem;
  font-weight: 600;
  color: #1890ff;
}

.progress-text {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1890ff;
  animation: pulse 1.5s ease-in-out infinite;
}

.detecting-circle {
  stroke-dasharray: 534;
  stroke-dashoffset: 267;
}

.generating-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 0.5rem;
}

.generating-subtitle {
  font-size: 1rem;
  color: #1890ff;
  margin-bottom: 1rem;
  font-weight: 500;
}

.generating-tip {
  font-size: 0.875rem;
  color: #666;
  padding: 0.75rem 1.5rem;
  background: rgba(24, 144, 255, 0.05);
  border-radius: 24px;
  display: inline-block;
}

@keyframes pulse {
  0%, 100% { 
    opacity: 1;
    transform: scale(1);
  }
  50% { 
    opacity: 0.6;
    transform: scale(0.95);
  }
}
</style>
