/**
 * 视频生成服务
 * 使用火山引擎（即梦AI）文生视频 API
 */

export interface VideoGenerationOptions {
  prompt: string                    // 必填：文字描述
  url?: string                      // 选填：参考图片 URL 或 Base64
  aspectRatio?: '9:16' | '16:9'     // 选填：视频比例，默认 16:9（横屏更快）
  duration?: 5 | 10                 // 选填：视频时长，默认 5 秒
  seed?: number                     // 选填：随机种子，-1 表示随机
  reqKey?: string                   // 选填：模型key，默认 i2v_v2_0_zt2v
  onProgress?: (progress: number, attempts: number) => void  // 选填：进度回调
}

export class VideoService {
  private backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'

  constructor() {
    console.log('🌐 后端服务地址:', this.backendUrl)
  }

  /**
   * 生成视频（主方法）
   * @param options 视频生成选项
   * @returns 生成的视频 URL
   */
  async generateVideo(options: VideoGenerationOptions): Promise<string> {
    try {
      console.log('🎬 开始生成视频（火山引擎）...')
      console.log('📝 参数:', {
        prompt: options.prompt?.substring(0, 50) + '...',
        hasImage: !!options.url,
        duration: options.duration || 5,
        seed: options.seed || -1,
        reqKey: options.reqKey || 'i2v_v2_0_zt2v'
      })

      // 验证输入
      if (!options.prompt || options.prompt.trim() === '') {
        throw new Error('请提供文字描述')
      }

      // 准备请求体
      const requestBody: any = {
        prompt: options.prompt,
        duration: options.duration || 5,
        seed: options.seed !== undefined ? options.seed : -1,
        req_key: options.reqKey || 'jimeng_t2v_v30_1080p'
      }

      // 如果有参考图片，转换为 binary_data_base64 数组格式
      if (options.url) {
        // 移除 data:image/xxx;base64, 前缀
        const base64Data = options.url.replace(/^data:image\/[a-z]+;base64,/, '')
        requestBody.binary_data_base64 = [base64Data]
        console.log('🖼️ 已添加参考图片')
      }

      // 调用后端代理端点（同步等待结果）
      console.log('📤 提交视频生成任务...')
      const response = await fetch(
        `${this.backendUrl}/api/volcengine/text-to-video`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'API 错误')
      }

      const data = await response.json()
      console.log('📝 API响应:', data)

      if (!data.success) {
        throw new Error(data.error || '视频生成失败')
      }

      if (!data.videoUrl) {
        throw new Error('未获取到视频URL')
      }

      console.log('✅ 视频生成完成')
      console.log('🎥 视频URL:', data.videoUrl)

      // 直接返回原始URL
      if (options.onProgress) {
        options.onProgress(100, 1)
      }
      
      return data.videoUrl

    } catch (error) {
      console.error('❌ 生成失败:', error)
      throw error
    }
  }

  /**
   * 将 File 转换为 Base64
   * @param file 图片文件
   * @returns Base64 字符串（带 data:image 前缀）
   */
  async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        const result = reader.result as string
        if (!result) {
          reject(new Error('无法读取图片'))
          return
        }
        // 返回完整的 data URL（包含 data:image/xxx;base64, 前缀）
        resolve(result)
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  /**
   * 检查 API 密钥是否配置
   */
  isConfigured(): boolean {
    // 火山引擎的配置在后端检查
    return true
  }
}

export const videoService = new VideoService()
