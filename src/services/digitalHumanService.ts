/**
 * 数字人服务 - 百度智能云数字人
 * 通过后端代理调用百度 API
 */

// 后端 API 基础 URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'

// 演示模式：当API调用失败时，使用模拟数据
const DEMO_MODE = false

// 测试后端连接
async function testBackendConnection() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/health`)
    const data = await response.json()
    console.log('✅ 后端服务连接成功:', data)
    return true
  } catch (error) {
    console.error('❌ 后端服务连接失败:', error)
    console.error('请确保后端服务正在运行: npm run server')
    return false
  }
}

// 页面加载时测试连接
if (typeof window !== 'undefined') {
  testBackendConnection()
}

export interface DigitalPerson {
  id: string // figureId
  name: string
  thumbnail: string
  voiceId?: string // 关联的音色ID
  voiceName?: string // 音色名称
}

export interface CreateVideoParams {
  personId: string // figureId
  personName?: string // 数字人名称，用于判断横屏/竖屏
  text: string
  voiceId: string // TTS person ID
  bgImageUrl?: string
  bgColor?: string
}

export interface VideoInfo {
  taskId: string
  status: string // SUBMIT, GENERATING, SUCCESS, FAILED
  videoUrl?: string
  duration?: number // 视频时长（毫秒）
  createTime?: string
  updateTime?: string
  subtitleFileUrl?: string
}

/**
 * 获取公共数字人列表
 * 注意：百度API需要在控制台查看可用的数字人ID
 * 这里直接返回预设的数字人列表
 */
export async function getDigitalPersonList(): Promise<DigitalPerson[]> {
  console.log('使用预设数字人形象列表')
  return PRESET_DIGITAL_PERSONS
}

/**
 * 创建视频合成任务
 */
export async function createVideo(params: CreateVideoParams): Promise<string> {
  try {
    console.log('📤 发送数字人视频创建请求...')
    console.log('请求参数:', params)

    // 调用后端 API
    const response = await fetch(`${API_BASE_URL}/api/digital-human/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        personId: params.personId,
        personName: params.personName,
        text: params.text,
        voiceId: params.voiceId,
        bgColor: params.bgColor,
        bgImageUrl: params.bgImageUrl
      })
    })

    const data = await response.json()
    console.log('📥 API响应数据:', data)

    if (!data.success) {
      const errorMsg = data.message || '未知错误'
      const requestId = data.requestId || 'unknown'
      
      console.error('❌ API返回错误:', errorMsg)
      console.error('📋 Request ID:', requestId)
      
      throw new Error(`API调用失败: ${errorMsg}\n\nRequest ID: ${requestId}`)
    }

    const taskId = data.taskId
    
    if (!taskId) {
      console.error('❌ 无法从响应中提取taskId:', data)
      throw new Error('API返回数据格式错误：未找到taskId')
    }
    
    console.log('✅ 视频任务创建成功，taskId:', taskId)
    return taskId
  } catch (error) {
    console.error('❌ 创建视频任务失败:', error)
    
    if (DEMO_MODE) {
      console.warn('⚠️ 使用演示模式')
      return 'demo_task_' + Date.now()
    }
    
    throw error
  }
}

/**
 * 查询任务状态
 */
export async function getVideoInfo(taskId: string): Promise<VideoInfo> {
  // 演示模式：返回模拟的视频信息
  if (taskId.startsWith('demo_task_')) {
    return {
      taskId: taskId,
      status: 'SUCCESS',
      videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
      duration: 10000,
      createTime: new Date().toISOString(),
      updateTime: new Date().toISOString()
    }
  }

  try {
    // 调用后端 API
    const response = await fetch(`${API_BASE_URL}/api/digital-human/status/${taskId}`)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ 查询任务状态失败:', errorText)
      throw new Error(`查询任务状态失败 (${response.status}): ${errorText}`)
    }

    const data = await response.json()
    console.log('📥 任务状态响应:', data)
    
    if (!data.success) {
      const errorMsg = data.message || '未知错误'
      console.error('❌ API返回错误:', errorMsg)
      throw new Error(`查询任务状态失败: ${errorMsg}`)
    }
    
    const result = data.result
    
    if (!result) {
      console.error('❌ 响应中没有result字段:', data)
      throw new Error('API返回数据格式错误：未找到result字段')
    }
    
    const videoInfo: VideoInfo = {
      taskId: result.taskId,
      status: result.status, // SUBMIT, GENERATING, SUCCESS, FAILED
      videoUrl: result.videoUrl,
      duration: result.duration,
      createTime: result.createTime,
      updateTime: result.updateTime,
      subtitleFileUrl: result.subtitleFileUrl
    }
    
    console.log('✅ 解析后的任务信息:', videoInfo)
    
    return videoInfo
  } catch (error) {
    console.error('查询任务状态失败:', error)
    throw error
  }
}

/**
 * 轮询任务状态直到完成
 */
export async function pollVideoStatus(
  taskId: string,
  onProgress?: (status: string) => void,
  maxAttempts = 120,
  interval = 5000
): Promise<VideoInfo> {
  // 演示模式：模拟视频生成过程
  if (taskId.startsWith('demo_task_')) {
    const statuses: string[] = ['SUBMIT', 'GENERATING', 'GENERATING', 'SUCCESS']
    for (let i = 0; i < statuses.length; i++) {
      const status = statuses[i]
      if (onProgress && status) {
        onProgress(getStatusText(status, i, statuses.length))
      }
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    return await getVideoInfo(taskId)
  }

  console.log('🔄 开始轮询任务状态，taskId:', taskId)
  console.log('⏱️ 最大尝试次数:', maxAttempts, '间隔:', interval / 1000, '秒')
  
  // 首次等待5秒
  console.log('⏳ 等待5秒后开始查询...')
  await new Promise(resolve => setTimeout(resolve, 5000))

  let attempts = 0
  let lastStatus = ''

  while (attempts < maxAttempts) {
    try {
      const videoInfo = await getVideoInfo(taskId)
      
      // 只在状态变化时更新进度
      if (videoInfo.status !== lastStatus) {
        lastStatus = videoInfo.status
        console.log(`📊 状态更新 [${attempts + 1}/${maxAttempts}]:`, videoInfo.status)
        
        if (onProgress) {
          const statusText = getStatusText(videoInfo.status, attempts, maxAttempts)
          onProgress(statusText)
        }
      }

      if (videoInfo.status === 'SUCCESS') {
        console.log('✅ 视频生成完成！')
        return videoInfo
      }

      if (videoInfo.status === 'FAILED') {
        console.error('❌ 视频生成失败')
        throw new Error('视频生成失败，请重试')
      }
    } catch (error) {
      console.warn(`⚠️ 查询失败 [${attempts + 1}/${maxAttempts}]:`, error)
      // 继续轮询，不抛出错误
    }

    // 等待后继续轮询
    await new Promise(resolve => setTimeout(resolve, interval))
    attempts++
  }

  console.error('❌ 视频生成超时')
  throw new Error(`视频生成超时（已等待${Math.floor(maxAttempts * interval / 60000)}分钟）\n\n任务ID: ${taskId}\n\n建议：稍后在百度智能云控制台查看任务状态`)
}

/**
 * 获取友好的状态文本
 */
function getStatusText(status: string, attempt: number, maxAttempts: number): string {
  const progress = Math.floor((attempt / maxAttempts) * 100)
  
  switch (status) {
    case 'SUBMIT':
      return `已提交，等待处理... (${progress}%)`
    case 'GENERATING':
      return `视频生成中... (${progress}%)`
    case 'SUCCESS':
      return '生成完成！'
    case 'FAILED':
      return '生成失败'
    default:
      return `处理中... (${progress}%)`
  }
}

// 预设数字人形象列表（基于用户账户下的真实数字人）
// 数据来源：百度智能云控制台 - 数字人管理
// 按用户提供的顺序配置前30个数字人形象

// 芝晗系列（5个）
export const ZHIHAN_PERSONS: DigitalPerson[] = [
  { id: '209943', name: '芝晗-坐姿实景横屏', thumbnail: '/images/digital.humans/209943.png', voiceId: '5118', voiceName: '度小美' },
  { id: '209965', name: '芝晗-坐姿实景竖屏', thumbnail: '/images/digital.humans/209965.png', voiceId: '5116', voiceName: '度小娇' },
  { id: '209979', name: '芝晗-站姿实景横屏', thumbnail: '/images/digital.humans/209979.png', voiceId: '103', voiceName: '度米朵' },
  { id: '211627', name: '芝晗-站姿实景竖屏', thumbnail: '/images/digital.humans/211627.png', voiceId: '111', voiceName: '度小萌' },
  { id: '211808', name: '芝晗-站姿透明', thumbnail: '/images/digital.humans/211808.png', voiceId: '4', voiceName: '度丫丫' }
]

// 海霖系列（5个）
export const HAILIN_PERSONS: DigitalPerson[] = [
  { id: '209898', name: '海霖-坐姿实景横屏', thumbnail: '/images/digital.humans/209898.png', voiceId: '5003', voiceName: '度小宇' },
  { id: '209899', name: '海霖-坐姿实景竖屏', thumbnail: '/images/digital.humans/209899.png', voiceId: '106', voiceName: '度博文' },
  { id: '209747', name: '海霖-站姿实景横屏', thumbnail: '/images/digital.humans/209747.png', voiceId: '1', voiceName: '度小宇（标准）' },
  { id: '211581', name: '海霖-站姿实景竖屏', thumbnail: '/images/digital.humans/211581.png', voiceId: '5003', voiceName: '度小宇' },
  { id: '211809', name: '海霖-站姿透明', thumbnail: '/images/digital.humans/211809.png', voiceId: '106', voiceName: '度博文' }
]

// 芝怡系列（5个）
export const ZHIYI_PERSONS: DigitalPerson[] = [
  { id: '209816', name: '芝怡-坐姿实景横屏', thumbnail: '/images/digital.humans/209816.png', voiceId: '5118', voiceName: '度小美' },
  { id: '209963', name: '芝怡-坐姿实景竖屏', thumbnail: '/images/digital.humans/209963.png', voiceId: '5116', voiceName: '度小娇' },
  { id: '211562', name: '芝怡-站姿实景横屏', thumbnail: '/images/digital.humans/211562.png', voiceId: '103', voiceName: '度米朵' },
  { id: '211624', name: '芝怡-站姿实景竖屏', thumbnail: '/images/digital.humans/211624.png', voiceId: '111', voiceName: '度小萌' },
  { id: '211807', name: '芝怡-站姿透明', thumbnail: '/images/digital.humans/211807.png', voiceId: '4', voiceName: '度丫丫' }
]

// 海昱系列（5个）
export const HAIYU_PERSONS: DigitalPerson[] = [
  { id: '209886', name: '海昱-坐姿实景横屏', thumbnail: '/images/digital.humans/209886.png', voiceId: '5003', voiceName: '度小宇' },
  { id: '209897', name: '海昱-坐姿实景竖屏', thumbnail: '/images/digital.humans/209897.png', voiceId: '106', voiceName: '度博文' },
  { id: '209977', name: '海昱-站姿实景横屏', thumbnail: '/images/digital.humans/209977.png', voiceId: '1', voiceName: '度小宇（标准）' },
  { id: '211582', name: '海昱-站姿实景竖屏', thumbnail: '/images/digital.humans/211582.png', voiceId: '5003', voiceName: '度小宇' },
  { id: '211801', name: '海昱-站姿透明', thumbnail: '/images/digital.humans/211801.png', voiceId: '106', voiceName: '度博文' }
]

// 芝妍系列（5个）
export const ZHIYAN_PERSONS: DigitalPerson[] = [
  { id: '209888', name: '芝妍-坐姿实景横屏', thumbnail: '/images/digital.humans/209888.png', voiceId: '5118', voiceName: '度小美' },
  { id: '209896', name: '芝妍-坐姿实景竖屏', thumbnail: '/images/digital.humans/209896.png', voiceId: '5116', voiceName: '度小娇' },
  { id: '209978', name: '芝妍-站姿实景横屏', thumbnail: '/images/digital.humans/209978.png', voiceId: '103', voiceName: '度米朵' },
  { id: '211621', name: '芝妍-站姿实景竖屏', thumbnail: '/images/digital.humans/211621.png', voiceId: '111', voiceName: '度小萌' },
  { id: '211853', name: '芝妍-站姿透明', thumbnail: '/images/digital.humans/211853.png', voiceId: '4', voiceName: '度丫丫' }
]

// 芝彤系列（5个）
export const ZHITONG_PERSONS: DigitalPerson[] = [
  { id: '209889', name: '芝彤-坐姿实景横屏', thumbnail: '/images/digital.humans/209889.png', voiceId: '5118', voiceName: '度小美' },
  { id: '209962', name: '芝彤-坐姿实景竖屏', thumbnail: '/images/digital.humans/209962.png', voiceId: '5116', voiceName: '度小娇' },
  { id: '209783', name: '芝彤-站姿实景横屏', thumbnail: '/images/digital.humans/209783.png', voiceId: '103', voiceName: '度米朵' },
  { id: '211623', name: '芝彤-站姿实景竖屏', thumbnail: '/images/digital.humans/211623.png', voiceId: '111', voiceName: '度小萌' },
  { id: '212727', name: '芝彤-站姿透明', thumbnail: '/images/digital.humans/212727.png', voiceId: '4', voiceName: '度丫丫' }
]

// 合并所有数字人（按用户指定顺序：芝晗、海霖、芝怡、海昱、芝妍、芝彤）
export const PRESET_DIGITAL_PERSONS: DigitalPerson[] = [
  ...ZHIHAN_PERSONS,
  ...HAILIN_PERSONS,
  ...ZHIYI_PERSONS,
  ...HAIYU_PERSONS,
  ...ZHIYAN_PERSONS,
  ...ZHITONG_PERSONS
]

// 百度公共音色库（基于用户账户下的真实音色）
// 数据来源：百度智能云控制台 - 音色管理

// 女声音色
export const FEMALE_VOICES = [
  // === 精品女声 CAP 系列 ===
  { id: 'CAP_4146', name: '度禧禧', description: '温柔甜美，适合客服助手', gender: 'female' },
  { id: 'CAP_6567', name: '度小柔', description: '知性大方，适合客服助手', gender: 'female' },
  { id: 'CAP_4189', name: '度涵竹', description: '自然生动，适合广告营销', gender: 'female' },
  { id: 'CAP_4194', name: '度嫣然', description: '温柔可爱，适合客服助手', gender: 'female' },
  { id: 'CAP_4196', name: '度清影', description: '甜美可爱，适合广告营销', gender: 'female' },
  { id: 'CAP_4197', name: '度沁遥', description: '温柔知性，适合客服助手', gender: 'female' },
  
  // === 标准女声 ===
  { id: '5132', name: '度小夏', description: '知性大方，适合新闻主持', gender: 'female' },
  { id: '4100', name: '度小雯', description: '元气活力，适合广告营销', gender: 'female' },
  { id: '5116', name: '度小希', description: '元气活力，适合广告营销', gender: 'female' },
  { id: '5147', name: '度常盈', description: '亲和力强，适合客服助理', gender: 'female' },
  { id: '4105', name: '度灵儿', description: '权威靠谱，适合广告营销', gender: 'female' },
  { id: '4117', name: '度小乔', description: '知性大方，适合广告营销', gender: 'female' },
  { id: '4118', name: '度小鹿', description: '元气活力，适合客服助理', gender: 'female' },
  { id: '4000', name: '度小语', description: '权威靠谱，适合广告营销', gender: 'female' },
  { id: '5153', name: '度常悦', description: '知性大方，适合客服助理', gender: 'female' },
  { id: '5137', name: '度仔仔', description: '元气活力，适合广告营销', gender: 'female' },
  { id: '4125', name: '西贝', description: '激情饱满，适合广告营销', gender: 'female' },
  { id: '5118', name: '度小美', description: '甜美温柔，适合客服', gender: 'female' },
  { id: '103', name: '度米朵', description: '亲切自然，适合讲解', gender: 'female' },
  { id: '111', name: '度小萌', description: '可爱活泼，适合营销', gender: 'female' },
  
  // === LITE 系列女声 ===
  { id: 'LITE_Attractive_Girl', name: '沉静知性叙述者', description: '低沉磁性，适合陪伴', gender: 'female' },
  { id: 'LITE_audiobook_female_1', name: '端庄专业女主播', description: '温润柔和，适合有声书', gender: 'female' },
  { id: 'LITE_audiobook_female_2', name: '成熟可靠女主播', description: '温润柔和，适合有声书', gender: 'female' },
  { id: 'LITE_Charming_Lady', name: '轻声低哑小姐姐', description: '低沉磁性，适合陪伴', gender: 'female' },
  { id: 'LITE_danya_xuejie', name: '干练可靠研究员', description: '低沉磁性，适合专业讲解', gender: 'female' },
  { id: 'LITE_female-chengshu', name: '成熟稳重女主播', description: '低沉磁性，适合新闻', gender: 'female' },
  { id: 'LITE_female-shaonv', name: '温柔细腻小姐姐', description: '温润柔和，适合陪伴', gender: 'female' },
  { id: 'LITE_female-tianmei', name: '轻声细语小姐姐', description: '温润柔和，适合陪伴', gender: 'female' },
  { id: 'LITE_female-yujie', name: '慵懒松弛大姐姐', description: '温润柔和，适合陪伴', gender: 'female' },
  { id: 'LITE_Serene_Woman', name: '温柔甜美讲解员', description: '清透明亮，适合讲解', gender: 'female' },
  { id: 'LITE_Sweet_Girl', name: '慵懒温柔小姐姐', description: '温润柔和，适合陪伴', gender: 'female' },
  { id: 'LITE_tianxin_xiaoling', name: '甜美亲切小姐姐', description: '温润柔和，适合陪伴', gender: 'female' },
  { id: 'LITE_wumei_yujie', name: '亲和温柔解说员', description: '温润柔和，适合陪伴', gender: 'female' },
  
  // === 电商直播女声 ===
  { id: '7011_moxingxiaoxiao_16k', name: '专业靠谱爽朗女', description: '激情饱满，适合电商直播', gender: 'female' },
  { id: '7011_moxingkangxi_16k', name: '热情悦耳女主播', description: '激情饱满，适合电商直播', gender: 'female' },
  { id: '7011_moxinghuanhuan_16k', name: '自信活泼小姐姐', description: '元气活力，适合电商直播', gender: 'female' },
  { id: '7011_vc0057_16k', name: '自信活泼大姐姐', description: '元气活力，适合电商直播', gender: 'female' },
  { id: '7011_vc0020_16k', name: '自然朴实小妹妹', description: '亲和力强，适合电商直播', gender: 'female' },
  { id: '7011_vc0053_16k', name: '专注真诚大姐姐', description: '权威靠谱，适合电商直播', gender: 'female' },
  { id: '7011_vc0033_16k', name: '职业霸气御姐', description: '沉稳冷静，适合电商直播', gender: 'female' },
  { id: '7011_vc0019_16k', name: '知性优雅叙事女声', description: '沉稳冷静，适合电商直播', gender: 'female' },
  { id: '7011_zhiningkoubo_16k', name: '温柔质感女博主', description: '知性大方，适合教学', gender: 'female' }
]

// 男声音色
export const MALE_VOICES = [
  // === 精品男声 CAP 系列 ===
  { id: 'CAP_4193', name: '度泽言-开朗', description: '温柔青年，适合客服助手', gender: 'male' },
  { id: 'CAP_4195', name: '度怀安', description: '磁性深情，适合客服助手', gender: 'male' },
  { id: 'CAP_4179', name: '度泽言-温暖', description: '温柔青年，适合客服助手', gender: 'male' },
  
  // === 标准男声 ===
  { id: '4140', name: '度小新', description: '元气活力，适合广告营销', gender: 'male' },
  { id: '5135', name: '度星河', description: '沉稳冷静，适合新闻主持', gender: 'male' },
  { id: '4123', name: '度小凯', description: '激情饱满，适合新闻主持', gender: 'male' },
  { id: '4003', name: '度逍遥', description: '权威靠谱，适合新闻主持', gender: 'male' },
  { id: '4129', name: '度小彦', description: '元气活力，适合客服助理', gender: 'male' },
  { id: '4115', name: '度小贤', description: '权威靠谱，适合新闻主持', gender: 'male' },
  { id: '4106', name: '度博文', description: '沉稳冷静，适合新闻主持', gender: 'male' },
  { id: '4143', name: '度清风', description: '元气活力，适合广告营销', gender: 'male' },
  { id: '4001', name: '度小科', description: '权威靠谱，适合广告营销', gender: 'male' },
  { id: '4128', name: '度小谋', description: '权威靠谱，适合广告营销', gender: 'male' },
  { id: '4127', name: '度小笙', description: '沉稳冷静，适合新闻主持', gender: 'male' },
  { id: '5003', name: '度小宇', description: '阳光活力，适合营销', gender: 'male' },
  { id: '106', name: '度博文', description: '成熟稳重，适合商务', gender: 'male' },
  { id: '1', name: '度小宇（标准）', description: '标准男声，通用', gender: 'male' },
  
  // === LITE 系列男声 ===
  { id: 'LITE_Arnold', name: '内敛闷声叙述者', description: '低沉磁性，适合陪伴', gender: 'male' },
  { id: 'LITE_audiobook_male_1', name: '清朗专业男主播', description: '温润柔和，适合有声书', gender: 'male' },
  { id: 'LITE_audiobook_male_2', name: '抑扬顿挫说书人', description: '温润柔和，适合有声书', gender: 'male' },
  { id: 'LITE_badao_shaoye', name: '声情并茂解说员', description: '温润柔和，适合讲解', gender: 'male' },
  { id: 'LITE_bingjiao_didi', name: '柔情细语小哥哥', description: '温润柔和，适合陪伴', gender: 'male' },
  { id: 'LITE_Charming_Santa', name: '悬疑神秘叙述者', description: '低沉磁性，适合悬疑', gender: 'male' },
  { id: 'LITE_chunzhen_xuedi', name: '温和理智小哥哥', description: '温润柔和，适合讲解', gender: 'male' },
  { id: 'LITE_Grinch', name: '热情爽朗讲解员', description: '清透明亮，适合讲解', gender: 'male' },
  { id: 'LITE_junlang_nanyou', name: '活力热情小哥哥', description: '清透明亮，适合营销', gender: 'male' },
  { id: 'LITE_lengdan_xiongzhang', name: '成熟稳重小哥哥', description: '低沉磁性，适合专业', gender: 'male' },
  { id: 'LITE_male-qn-badao', name: '亲切质朴讲解员', description: '温润柔和，适合讲解', gender: 'male' },
  { id: 'LITE_male-qn-daxuesheng', name: '纯真温和小哥哥', description: '温润柔和，适合陪伴', gender: 'male' },
  { id: 'LITE_male-qn-jingying', name: '干练可靠讲解员', description: '低沉磁性，适合商务', gender: 'male' },
  { id: 'LITE_male-qn-qingse', name: '阳光温和小哥哥', description: '温润柔和，适合陪伴', gender: 'male' },
  { id: 'LITE_presenter_male', name: '成熟干练男主播', description: '温润柔和，适合新闻', gender: 'male' },
  { id: 'LITE_Santa_Claus', name: '声情并茂男主播', description: '温润柔和，适合讲解', gender: 'male' },
  
  // === 电商直播男声 ===
  { id: '7011_moxingchuyi_16k', name: '专业自信男主播', description: '沉稳冷静，适合电商直播', gender: 'male' },
  { id: '7011_vc0135_16k', name: '自信专业男主播', description: '激情饱满，适合电商直播', gender: 'male' },
  { id: '7011_vc0038_16k', name: '专业自信男青年', description: '权威靠谱，适合电商直播', gender: 'male' },
  { id: '7011_vc0028_16k', name: '阳光开朗大哥哥', description: '沉稳冷静，适合电商直播', gender: 'male' },
  { id: '7011_vc0054_16k', name: '稳重成熟男主播', description: '激情饱满，适合电商直播', gender: 'male' },
  { id: '7011_vc0079_16k', name: '头头是道讲解员', description: '激情饱满，适合电商直播', gender: 'male' },
  { id: '7011_vc0047_16k', name: '侃侃而谈男主播', description: '权威靠谱，适合电商直播', gender: 'male' },
  { id: '7011_vc0036_16k', name: '开朗外向男闺蜜', description: '激情饱满，适合电商直播', gender: 'male' },
  { id: '7011_hanmiao_16k', name: '自信沉稳精英男', description: '沉稳冷静，适合新闻', gender: 'male' }
]

// 合并所有音色
export const PRESET_VOICES = [
  ...FEMALE_VOICES,
  ...MALE_VOICES
]
