/**
 * 图片处理服务
 */

import { fileToBase64, downloadFile } from '@/utils/helpers'

class ImageService {
  async uploadImage(file: File): Promise<string> {
    // 将文件转换为 Base64 URL，用于预览和存储
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  async compressImage(file: File, maxSize: number): Promise<File> {
    // 如果文件大小小于最大限制，直接返回
    if (file.size <= maxSize) {
      return file
    }

    // TODO: 实现图片压缩逻辑
    return file
  }

  async downloadImage(url: string, filename: string): Promise<void> {
    downloadFile(url, filename)
  }

  async convertToBase64(file: File): Promise<string> {
    return fileToBase64(file)
  }
}

export const imageService = new ImageService()
