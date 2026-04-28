/**
 * 应用常量定义
 */

// 文件上传相关
export const FILE_UPLOAD = {
  MAX_SIZE: parseInt(import.meta.env.VITE_MAX_FILE_SIZE || '10485760'), // 10MB
  ACCEPTED_FORMATS: ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf', 'image/vnd.dwg', 'image/x-dwg', 'application/dwg', 'application/x-dwg', 'application/x-autocad', 'image/vnd.dxf', 'application/dxf', 'application/x-dxf'],
  ACCEPTED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.pdf', '.dwg', '.dxf']
} as const

// API配置
export const API_CONFIG = {
  TIMEOUT: parseInt(import.meta.env.VITE_API_TIMEOUT || '120000'), // 120秒（2分钟）
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000 // 1秒
} as const

// 图像生成配置
export const IMAGE_GENERATION = {
  DEFAULT_WIDTH: 1024,
  DEFAULT_HEIGHT: 1024,
  DEFAULT_SAMPLES: 1,
  DEFAULT_STEPS: 30,
  DEFAULT_CFG_SCALE: 7
} as const

// LocalStorage键名
export const STORAGE_KEYS = {
  PROJECTS: 'ai-interior-design-projects',
  CURRENT_PROJECT: 'ai-interior-design-current-project',
  UI_STATE: 'ai-interior-design-ui-state',
  THEME: 'ai-interior-design-theme'
} as const

// 错误消息
export const ERROR_MESSAGES = {
  FILE_TOO_LARGE: '文件大小超过10MB限制',
  FILE_FORMAT_NOT_SUPPORTED: '不支持的文件格式，请上传JPG、PNG、PDF、DWG或DXF文件',
  FILE_CORRUPTED: '文件已损坏，无法读取',
  NETWORK_ERROR: '网络连接失败，请检查网络设置',
  API_TIMEOUT: '请求超时，请稍后重试',
  API_ERROR: 'API调用失败，请稍后重试',
  STORAGE_FULL: '存储空间已满，请清理后重试',
  UNKNOWN_ERROR: '发生未知错误，请刷新页面重试'
} as const

// 成功消息
export const SUCCESS_MESSAGES = {
  UPLOAD_SUCCESS: '上传成功',
  SAVE_SUCCESS: '保存成功',
  GENERATION_SUCCESS: '设计生成完成',
  DELETE_SUCCESS: '删除成功'
} as const
