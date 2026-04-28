<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { VideoCamera, Female, Male } from '@element-plus/icons-vue'
import NavigationBar from '@/components/NavigationBar.vue'
import { 
  getDigitalPersonList, 
  createVideo, 
  pollVideoStatus,
  ZHIHAN_PERSONS,
  HAILIN_PERSONS,
  ZHIYI_PERSONS,
  HAIYU_PERSONS,
  ZHIYAN_PERSONS,
  ZHITONG_PERSONS,
  FEMALE_VOICES,
  MALE_VOICES,
  type DigitalPerson 
} from '@/services/digitalHumanService'

// 状态管理
const loading = ref(false)
const generating = ref(false)
const generationProgress = ref('')

// 表单数据
const selectedPerson = ref('')
const selectedVoice = ref('')
const textContent = ref('')

// 生成结果
const generatedVideoUrl = ref('')
const showResult = ref(false)

// 数字人性别选择
const personGender = ref<'female' | 'male'>('female')

// 语音性别选择
const voiceGender = ref<'female' | 'male'>('female')

// 语音搜索
const voiceSearchQuery = ref('')

// 女性数字人（芝系列）
const FEMALE_DIGITAL_PERSONS = [
  ...ZHIHAN_PERSONS,
  ...ZHIYI_PERSONS,
  ...ZHIYAN_PERSONS,
  ...ZHITONG_PERSONS
]

// 男性数字人（海系列）
const MALE_DIGITAL_PERSONS = [
  ...HAILIN_PERSONS,
  ...HAIYU_PERSONS
]

// 根据性别获取数字人列表
const currentDigitalPersons = computed(() => {
  return personGender.value === 'female' ? FEMALE_DIGITAL_PERSONS : MALE_DIGITAL_PERSONS
})

// 根据性别和搜索条件过滤语音列表
const filteredVoices = computed(() => {
  const voices = voiceGender.value === 'female' ? FEMALE_VOICES : MALE_VOICES
  
  if (!voiceSearchQuery.value) {
    return voices
  }
  
  const query = voiceSearchQuery.value.toLowerCase()
  return voices.filter(voice => 
    voice.name.toLowerCase().includes(query) || 
    voice.description.toLowerCase().includes(query)
  )
})

// 初始化
onMounted(() => {
  // 默认选中第一个女性数字人和女声
  if (FEMALE_DIGITAL_PERSONS.length > 0) {
    selectedPerson.value = FEMALE_DIGITAL_PERSONS[0].id
  }
  if (FEMALE_VOICES.length > 0) {
    selectedVoice.value = FEMALE_VOICES[0].id
  }
})

// 生成视频
const handleGenerate = async () => {
  if (!selectedPerson.value) {
    alert('请选择数字人形象')
    return
  }

  if (!textContent.value || textContent.value.trim() === '') {
    alert('请输入文案内容')
    return
  }

  generating.value = true
  generationProgress.value = '准备生成视频...'

  try {
    // 使用选中的音色ID
    const voiceId = selectedVoice.value || '5118'
    
    // 获取选中的数字人信息
    const selectedPersonInfo = currentDigitalPersons.value.find(p => p.id === selectedPerson.value)
    
    console.log('📤 准备创建视频')
    console.log('数字人ID:', selectedPerson.value)
    console.log('数字人名称:', selectedPersonInfo?.name)
    console.log('音色ID:', voiceId)
    console.log('文案:', textContent.value)

    // 创建视频任务
    generationProgress.value = '创建视频任务...'
    const taskId = await createVideo({
      personId: selectedPerson.value,
      personName: selectedPersonInfo?.name,
      text: textContent.value,
      voiceId: voiceId
    })

    // 轮询任务状态
    generationProgress.value = '视频生成中，请稍候..'
    const videoInfo = await pollVideoStatus(taskId, (status) => {
      generationProgress.value = `视频生成中: ${status}`
    })

    // 显示结果
    generatedVideoUrl.value = videoInfo.videoUrl || ''
    showResult.value = true
    generationProgress.value = '生成完成！'
    
    // 保存到历史记录
    saveToHistory()
  } catch (error) {
    console.error('生成视频失败:', error)
    const errorMsg = error instanceof Error ? error.message : '生成视频失败，请重试'
    
    // 特殊错误处理
    if (errorMsg.includes('figureId 无权限') || errorMsg.includes('22003')) {
      alert(`❌ 数字人 ID 无权限\n\n您使用的数字人 ID 不在您的账户下。\n\n解决方法：\n1. 登录百度智能云控制台\n2. 查看"我的数字人"列表\n3. 获取可用的数字人 ID\n4. 更新代码中的 figureId\n\n详细说明请查看：如何获取数字人ID.md`)
    } else {
      alert(errorMsg)
    }
    
    generationProgress.value = ''
  } finally {
    generating.value = false
  }
}

// 重新生成
const handleReset = () => {
  showResult.value = false
  generatedVideoUrl.value = ''
  textContent.value = ''
  generationProgress.value = ''
}

// 处理图片加载错误
const handleImageError = (event: Event) => {
  const target = event.target as HTMLImageElement
  target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="400" viewBox="0 0 300 400"%3E%3Crect fill="%23f0f0f0" width="300" height="400"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="24" fill="%23999"%3E👤%3C/text%3E%3C/svg%3E'
}

// 下载视频
const handleDownload = async () => {
  if (!generatedVideoUrl.value) return

  try {
    console.log('📥 开始下载视频:', generatedVideoUrl.value)
    alert('正在准备下载...')
    
    // 使用 fetch 获取视频数据
    const response = await fetch(generatedVideoUrl.value, {
      mode: 'cors'
    })
    
    if (!response.ok) {
      throw new Error('下载失败')
    }
    
    const blob = await response.blob()
    
    // 创建下载链接
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `digital-human-video-${Date.now()}.mp4`
    document.body.appendChild(a)
    a.click()
    
    // 清理
    setTimeout(() => {
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    }, 100)
    
    console.log('✅ 视频下载成功')
    alert('下载成功！')
  } catch (error) {
    console.error('❌ 下载视频失败:', error)
    alert('下载失败，请右键点击视频选择"视频另存为"')
  }
}

// 保存到历史记录
const saveToHistory = () => {
  if (!generatedVideoUrl.value) return
  
  try {
    const historyKey = 'digital_human_history'
    const history = JSON.parse(localStorage.getItem(historyKey) || '[]')
    
    // 获取选中的数字人和语音信息
    const selectedPersonInfo = currentDigitalPersons.value.find(p => p.id === selectedPerson.value)
    const selectedVoiceInfo = filteredVoices.value.find(v => v.id === selectedVoice.value)
    
    const newRecord = {
      id: Date.now().toString(),
      videoUrl: generatedVideoUrl.value,
      personId: selectedPerson.value,
      personName: selectedPersonInfo?.name || '未知',
      voiceId: selectedVoice.value,
      voiceName: selectedVoiceInfo?.name || '未知',
      text: textContent.value,
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
</script>

<template>
  <div class="digital-human-page">
    <!-- 导航栏-->
    <NavigationBar />
    
    <div class="container">
      <!-- 页面标题 -->
      <div class="header">
        <h1>
          <el-icon :size="32" color="#1890ff" style="vertical-align: middle; margin-right: 8px;">
            <VideoCamera />
          </el-icon>
          数字人宣传视频生成
        </h1>
        <p class="subtitle">选择数字人形象和语音，生成专属宣传视频</p>
      </div>

      <!-- 加载状态 -->
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>加载中</p>
      </div>

      <!-- 主要内容 -->
      <div v-else-if="!generating && !showResult" class="input-section">
        <!-- 选择数字人形象-->
        <div class="input-card">
          <div class="section-header">
            <div>
              <h3>选择数字人形象</h3>
              <p class="hint">从以下形象中选择一个适合您的数字人（{{ currentDigitalPersons.length }} 个）</p>
            </div>
            <div class="gender-tabs">
              <button 
                class="gender-tab" 
                :class="{ active: personGender === 'female' }"
                @click="personGender = 'female'"
              >
                <el-icon :size="16" style="vertical-align: middle; margin-right: 4px;">
                  <Female />
                </el-icon>
                女生 ({{ FEMALE_DIGITAL_PERSONS.length }})
              </button>
              <button 
                class="gender-tab" 
                :class="{ active: personGender === 'male' }"
                @click="personGender = 'male'"
              >
                <el-icon :size="16" style="vertical-align: middle; margin-right: 4px;">
                  <Male />
                </el-icon>
                男生 ({{ MALE_DIGITAL_PERSONS.length }})
              </button>
            </div>
          </div>
          
          <div class="person-grid">
            <div
              v-for="person in currentDigitalPersons"
              :key="person.id"
              class="person-item"
              :class="{ active: selectedPerson === person.id }"
              @click="selectedPerson = person.id"
            >
              <div class="person-thumbnail-wrapper">
                <img 
                  :src="person.thumbnail" 
                  :alt="person.name" 
                  class="person-thumbnail"
                  @error="handleImageError"
                />
              </div>
              <p class="person-name">{{ person.name }}</p>
            </div>
          </div>
        </div>

        <!-- 选择语音 -->
        <div class="input-card">
          <div class="section-header">
            <div>
              <h3>选择语音</h3>
              <p class="hint">选择适合您内容的音色（共 {{ filteredVoices.length }} 种音色）</p>
            </div>
            <div class="gender-tabs">
              <button 
                class="gender-tab" 
                :class="{ active: voiceGender === 'female' }"
                @click="voiceGender = 'female'; voiceSearchQuery = ''"
              >
                👩 女声 ({{ FEMALE_VOICES.length }})
              </button>
              <button 
                class="gender-tab" 
                :class="{ active: voiceGender === 'male' }"
                @click="voiceGender = 'male'; voiceSearchQuery = ''"
              >
                👨 男声 ({{ MALE_VOICES.length }})
              </button>
            </div>
          </div>
          
          <!-- 搜索?-->
          <div class="voice-search">
            <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
            <input 
              v-model="voiceSearchQuery" 
              type="text" 
              placeholder="搜索音色名称或描述" 
              class="search-input"
            />
          </div>

          <div class="voice-grid">
            <div
              v-for="voice in filteredVoices"
              :key="voice.id"
              class="voice-item"
              :class="{ active: selectedVoice === voice.id }"
              @click="selectedVoice = voice.id"
            >
              <div class="voice-icon">🎵</div>
              <div class="voice-info">
                <p class="voice-name">{{ voice.name }}</p>
                <p class="voice-desc">{{ voice.description }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- 内容输入 -->
        <div class="input-card">
          <h3>输入文案</h3>
          <p class="hint">输入数字人要说的内容（建议20-100字）</p>
          
          <div class="input-area">
            <textarea
              v-model="textContent"
              placeholder="请输入宣传文案（最多300字）&#10;&#10;例如：欢迎来到美家美户，我们是专业的AI室内设计平台，为您提供智能化的家居设计解决方案..."
              maxlength="300"
              class="text-input"
            ></textarea>
            <p class="char-count">{{ textContent.length }}/300</p>
          </div>
        </div>

        <!-- 生成按钮 -->
        <div class="action-section">
          <button class="generate-button" @click="handleGenerate">
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
            </svg>
            生成视频
          </button>
        </div>
      </div>

      <!-- 生成中状态-->
      <div v-if="generating" class="generating-section">
        <div class="spinner"></div>
        <h2>AI 正在生成数字人视频...</h2>
        <p>通常需要几分钟，请耐心等待</p>
        <div class="progress-info">
          <p>{{ generationProgress }}</p>
        </div>
      </div>

      <!-- 生成结果 -->
      <div v-if="showResult && !generating" class="result-section">
        <h2>✨ 生成结果</h2>
        <video 
          v-if="generatedVideoUrl" 
          :src="generatedVideoUrl" 
          controls 
          class="result-video"
          preload="metadata"
        ></video>
        <div class="result-actions">
          <button class="action-btn secondary" @click="handleReset">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
              <path d="M21 3v5h-5"/>
              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
              <path d="M3 21v-5h5"/>
            </svg>
            重新生成
          </button>
          <button
            v-if="generatedVideoUrl"
            @click="handleDownload"
            class="action-btn primary"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            下载视频
          </button>
        </div>
      </div>

      <!-- 使用提示 -->
      <div v-if="!generating && !showResult" class="tips-section">
        <h3>💡 使用提示</h3>
        <ul>
          <li><strong>选择符合您品牌调性的数字人形象</strong></li>
          <li><strong>根据内容类型选择合适的音色</strong></li>
          <li><strong>文案简洁明了，突出核心卖点</strong></li>
          <li><strong>生成通常需要几分钟，请耐心等待</strong></li>
        </ul>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.digital-human-page {
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

.loading-state {
  text-align: center;
  padding: 4rem 0;

  .spinner {
    width: 50px;
    height: 50px;
    border: 4px solid #f3f3f3;
    border-top: 4px solid #1890ff;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 1rem;
  }
}

.input-section {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  margin-bottom: 2rem;
}

.input-card {
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

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
  gap: 1rem;
  flex-wrap: wrap;

  h3 {
    margin-bottom: 0.5rem;
  }

  .hint {
    margin-bottom: 0;
  }
}

.gender-tabs {
  display: flex;
  gap: 0.5rem;
  background: white;
  padding: 0.25rem;
  border-radius: 0.75rem;
  border: 2px solid #e8e8e8;

  .gender-tab {
    padding: 0.5rem 1.25rem;
    border: none;
    background: transparent;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    font-weight: 500;
    color: #666;
    cursor: pointer;
    transition: all 0.3s ease;
    white-space: nowrap;

    &:hover {
      color: #1890ff;
      background: rgba(24, 144, 255, 0.05);
    }

    &.active {
      background: linear-gradient(135deg, #1890ff 0%, #1890ff 100%);
      color: white;
      box-shadow: 0 2px 8px rgba(24, 144, 255, 0.3);
    }
  }
}

.person-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 1.5rem;
}

.person-item {
  cursor: pointer;
  border: 2px solid transparent;
  border-radius: 1rem;
  padding: 1rem;
  transition: all 0.3s ease;
  text-align: center;
  background: white;

  &:hover {
    border-color: #1890ff;
    transform: translateY(-4px);
    box-shadow: 0 8px 20px rgba(24, 144, 255, 0.2);
  }

  &.active {
    border-color: #1890ff;
    background: rgba(24, 144, 255, 0.05);
    box-shadow: 0 4px 12px rgba(24, 144, 255, 0.15);
  }

  .person-thumbnail-wrapper {
    width: 100%;
    aspect-ratio: 3/4;
    overflow: hidden;
    border-radius: 0.75rem;
    margin-bottom: 0.75rem;
    background: #f5f5f5;
  }

  .person-thumbnail {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .person-name {
    font-size: 0.9375rem;
    color: #333;
    font-weight: 500;
  }
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: #999;
}

.voice-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
  gap: 1rem;

  h3 {
    margin-bottom: 0.5rem;
  }

  .hint {
    margin-bottom: 0;
  }
}

.voice-search {
  position: relative;
  margin-bottom: 1rem;

  .search-icon {
    position: absolute;
    left: 1rem;
    top: 50%;
    transform: translateY(-50%);
    width: 18px;
    height: 18px;
    color: #999;
    pointer-events: none;
  }

  .search-input {
    width: 100%;
    padding: 0.75rem 1rem 0.75rem 2.75rem;
    border: 2px solid #e8e8e8;
    border-radius: 0.75rem;
    font-size: 0.875rem;
    background: white;
    transition: border-color 0.3s ease;

    &:focus {
      outline: none;
      border-color: #1890ff;
    }

    &::placeholder {
      color: #999;
    }
  }
}

.voice-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
  max-height: 500px;
  overflow-y: auto;
  padding-right: 0.5rem;

  /* 自定义滚动条 */
  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 3px;

    &:hover {
      background: #a8a8a8;
    }
  }
}

.voice-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem;
  border: 2px solid #e8e8e8;
  border-radius: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  background: white;

  &:hover {
    border-color: #1890ff;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(24, 144, 255, 0.15);
  }

  &.active {
    border-color: #1890ff;
    background: rgba(24, 144, 255, 0.05);
  }

  .voice-icon {
    font-size: 1.75rem;
    flex-shrink: 0;
  }

  .voice-info {
    flex: 1;
    min-width: 0;

    .voice-name {
      font-weight: 600;
      color: #333;
      margin-bottom: 0.25rem;
      font-size: 0.9375rem;
    }

    .voice-desc {
      font-size: 0.8125rem;
      color: #666;
      line-height: 1.4;
    }
  }
}

@media (max-width: 768px) {
  .digital-human-page {
    padding: 80px 1rem 1rem;
  }

  .header h1 {
    font-size: 2rem;
  }

  .input-card {
    padding: 1.5rem;
  }

  .section-header {
    flex-direction: column;
    align-items: stretch;
  }

  .gender-tabs {
    width: 100%;
    
    .gender-tab {
      flex: 1;
    }
  }

  .person-grid {
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: 1rem;
  }

  .voice-grid {
    grid-template-columns: 1fr;
  }
}

.input-area {
  .text-input {
    width: 100%;
    min-height: 180px;
    padding: 1.25rem;
    border: 2px solid #e8e8e8;
    border-radius: 0.75rem;
    font-size: 0.9375rem;
    resize: vertical;
    font-family: inherit;
    background: white;
    transition: border-color 0.3s ease;

    &:focus {
      outline: none;
      border-color: #1890ff;
    }

    &::placeholder {
      color: #999;
    }
  }

  .char-count {
    text-align: right;
    font-size: 0.8125rem;
    color: #999;
    margin-top: 0.5rem;
  }
}

.color-picker {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e8e8e8;

  label {
    font-size: 0.9375rem;
    color: #666;
    font-weight: 500;
  }

  .color-input {
    width: 50px;
    height: 35px;
    border: 2px solid #e8e8e8;
    border-radius: 0.5rem;
    cursor: pointer;
  }

  .color-value {
    font-size: 0.875rem;
    color: #999;
    font-family: monospace;
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

  &:hover {
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

  .progress-info {
    color: #1890ff;
    font-size: 0.9375rem;
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
  text-decoration: none;

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
    color: white;
    box-shadow: 0 2px 8px rgba(24, 144, 255, 0.3);

    &:hover {
      background: linear-gradient(135deg, #5568d3 0%, #653a8b 100%);
      box-shadow: 0 4px 12px rgba(24, 144, 255, 0.4);
      transform: translateY(-2px);
    }
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

@media (max-width: 768px) {
  .digital-human-page {
    padding: 80px 1rem 1rem;
  }

  .header h1 {
    font-size: 2rem;
  }

  .input-card {
    padding: 1.5rem;
  }

  .person-grid {
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: 1rem;
  }

  .voice-grid {
    grid-template-columns: 1fr;
  }
}
</style>
