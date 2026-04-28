/**
 * 家具虚拟摆放服务
 * 使用火山引擎图生图API（通过Node.js后端）
 */

// 后端API地址
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'

export class FurnitureService {
  /**
   * 生成家具摆放效果图
   * @param roomImage 房间图片
   * @param furnitureImage 家具图片
   * @returns 生成的效果图 URL
   */
  async generateFurniturePlacement(
    roomImage: File,
    furnitureImage: File
  ): Promise<string> {
    try {
      console.log('🎨 开始生成家具摆放效果图...')

      // 将图片转换为 Base64（不带前缀）
      const roomBase64 = await this.fileToBase64(roomImage)
      const furnitureBase64 = await this.fileToBase64(furnitureImage)

      console.log('📏 房间图片大小:', Math.round(roomBase64.length / 1024), 'KB')
      console.log('📏 家具图片大小:', Math.round(furnitureBase64.length / 1024), 'KB')

      // 构建提示词
      const prompt = `将第二张图片中的家具自然地摆放到第一张图片的房间中，保持风格一致，调整透视和光线，确保比例协调，高质量室内设计效果图，专业摄影，8k，细节丰富，真实感强`

      console.log('📤 调用火山引擎图生图API...')
      console.log('💬 提示词:', prompt)
      
      // 调用Node.js后端的火山引擎图生图API
      // 使用文生图模型 + 图片输入实现图生图效果
      const response = await fetch(`${BACKEND_URL}/api/volcengine/image-to-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          req_key: 'high_aes_general_v30l_zt2i', // 使用文生图模型
          prompt: prompt,
          binary_data_base64: [roomBase64, furnitureBase64],
          width: 1328,
          height: 1328,
          strength: 0.5
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMsg = errorData.error || `后端API调用失败 (HTTP ${response.status})`
        console.error('❌ 后端返回错误:', errorMsg)
        throw new Error(errorMsg)
      }

      const data = await response.json()
      
      if (!data.success || !data.imageUrl) {
        const errorMsg = data.error || '未返回图片'
        console.error('❌ 生成失败:', errorMsg)
        throw new Error(errorMsg)
      }

      console.log('✅ 家具摆放效果图生成完成')
      return data.imageUrl

    } catch (error) {
      console.error('❌ 生成失败:', error)
      throw error
    }
  }


  /**
   * 将 File 转换为 Base64（压缩后）
   */
  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = async () => {
        const result = reader.result as string
        if (!result) {
          reject(new Error('无法读取图片'))
          return
        }

        try {
          // 压缩图片
          const compressed = await this.compressImage(result, 0.8, 1024)
          // 移除 data:image/xxx;base64, 前缀
          const base64 = compressed.split(',')[1] || ''
          resolve(base64)
        } catch (error) {
          reject(error)
        }
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  /**
   * 压缩图片
   * @param dataUrl 原始图片 Data URL
   * @param quality 压缩质量 (0-1)
   * @param maxWidth 最大宽度
   */
  private async compressImage(
    dataUrl: string, 
    quality: number = 0.8, 
    maxWidth: number = 1024
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height

        // 按比例缩放
        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }

        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('无法创建 Canvas 上下文'))
          return
        }

        ctx.drawImage(img, 0, 0, width, height)
        
        // 转换为 JPEG 格式并压缩
        const compressed = canvas.toDataURL('image/jpeg', quality)
        resolve(compressed)
      }
      img.onerror = () => reject(new Error('图片加载失败'))
      img.src = dataUrl
    })
  }

  /**
   * 检查后端是否可用
   */
  isConfigured(): boolean {
    return true // Node.js后端始终可用
  }
}

export const furnitureService = new FurnitureService()
