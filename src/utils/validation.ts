/**
 * 验证工具函数
 */

import { FILE_UPLOAD, ERROR_MESSAGES } from './constants'

/**
 * 验证结果
 */
export interface ValidationResult {
  valid: boolean
  error?: string
}

/**
 * 验证文件大小
 */
export function validateFileSize(file: File): ValidationResult {
  if (file.size > FILE_UPLOAD.MAX_SIZE) {
    return {
      valid: false,
      error: ERROR_MESSAGES.FILE_TOO_LARGE
    }
  }
  
  return { valid: true }
}

/**
 * 验证文件格式
 */
export function validateFileFormat(file: File): ValidationResult {
  const acceptedFormats = FILE_UPLOAD.ACCEPTED_FORMATS as readonly string[]
  const acceptedExtensions = FILE_UPLOAD.ACCEPTED_EXTENSIONS as readonly string[]
  
  // 获取文件扩展名
  const fileName = file.name.toLowerCase()
  const fileExtension = fileName.substring(fileName.lastIndexOf('.'))
  
  // 检查MIME类型或文件扩展名
  const isValidMimeType = acceptedFormats.includes(file.type)
  const isValidExtension = acceptedExtensions.includes(fileExtension)
  
  // 对于CAD文件，浏览器可能无法识别MIME类型，所以主要检查扩展名
  if (!isValidMimeType && !isValidExtension) {
    return {
      valid: false,
      error: ERROR_MESSAGES.FILE_FORMAT_NOT_SUPPORTED
    }
  }
  
  return { valid: true }
}

/**
 * 验证文件（综合验证）
 */
export function validateFile(file: File): ValidationResult {
  // 验证格式
  const formatResult = validateFileFormat(file)
  if (!formatResult.valid) {
    return formatResult
  }
  
  // 验证大小
  const sizeResult = validateFileSize(file)
  if (!sizeResult.valid) {
    return sizeResult
  }
  
  return { valid: true }
}

/**
 * 验证是否为空字符串或仅包含空白字符
 */
export function isEmptyOrWhitespace(str: string): boolean {
  return !str || str.trim().length === 0
}

/**
 * 验证项目名称
 */
export function validateProjectName(name: string): ValidationResult {
  if (isEmptyOrWhitespace(name)) {
    return {
      valid: false,
      error: '项目名称不能为空'
    }
  }
  
  if (name.length > 50) {
    return {
      valid: false,
      error: '项目名称不能超过50个字符'
    }
  }
  
  return { valid: true }
}

/**
 * 验证URL格式
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}
