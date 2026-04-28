/**
 * API接口相关类型定义
 */

// ============ Stability AI API ============

// 生成图片请求参数
export interface GenerateImageRequest {
  prompt: string
  negative_prompt?: string
  style_preset?: string
  width: number
  height: number
  samples: number
  steps?: number
  cfg_scale?: number
}

// 生成图片响应
export interface GenerateImageResponse {
  artifacts: Array<{
    base64: string
    finishReason: string
    seed: number
  }>
}

// ============ OpenAI Vision API ============

// 房间识别请求参数
export interface DetectRoomsRequest {
  image: string  // Base64编码的图片
  features: string[]
}

// 房间识别响应
export interface DetectRoomsResponse {
  rooms: Array<{
    type: string
    bounds: {
      x: number
      y: number
      width: number
      height: number
    }
    confidence: number
  }>
}

// ============ 通用API类型 ============

// API错误
export interface APIError {
  code: string
  message: string
  details?: unknown
}

// API配置
export interface APIConfig {
  timeout: number
  maxRetries: number
  retryDelay: number
}

// 上传进度
export interface UploadProgress {
  loaded: number
  total: number
  percentage: number
}

// 生成进度
export interface GenerationProgress {
  currentRoom: number
  totalRooms: number
  currentRoomName: string
  percentage: number
  status: 'pending' | 'processing' | 'completed' | 'failed'
}
