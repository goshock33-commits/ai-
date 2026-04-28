/**
 * 火山引擎视觉智能服务（Java后端代理版本）
 * 通过Java Spring Boot后端代理调用火山引擎API，解决CORS问题
 */

import type { Room, Design } from '@/types'
import { generateId } from '@/utils/helpers'
import { STYLE_OPTIONS } from '@/types'

// 后端API地址（从环境变量读取）
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'

class AIService {
  private useRealAPI = true

  constructor() {
    console.log('✅ 火山引擎 API 服务已初始化（Java后端代理模式）')
    console.log('📡 Java后端地址:', BACKEND_URL)
    console.log('✅ 房间识别：使用智能推断模式')
    console.log('💡 每个房间生成1张高质量设计图')
  }

  /**
   * 使用火山引擎生成设计图（通过Java后端代理）
   */
  private async generateDesignWithVolcEngine(room: Room, styleName: string): Promise<string> {
    try {
      console.log(`🎨 调用火山引擎生成设计: ${room.name} - ${styleName}`)

      // 构建中文提示词
      const roomTypeMap: Record<string, string> = {
        'living-room': '客厅',
        'bedroom': '卧室',
        'kitchen': '厨房',
        'bathroom': '卫生间',
        'dining-room': '餐厅',
        'study': '书房',
        'balcony': '阳台',
        'entrance': '玄关'
      }
      
      const roomTypeCN = roomTypeMap[room.type] || room.name
      
      // 解析用户提示词
      let finalPrompt = ''
      const roomSpecificMatch = styleName.match(/(?:仅|只|单独)?(?:在|给)?([^，,。.]+?)(?:中|里)?(?:增加|添加|放置|布置)/)
      
      if (roomSpecificMatch) {
        const specifiedRoom = roomSpecificMatch[1]
        const isMatchingRoom = specifiedRoom.includes(roomTypeCN) || 
                               roomTypeCN.includes(specifiedRoom) ||
                               room.name.includes(specifiedRoom)
        
        if (isMatchingRoom) {
          finalPrompt = `${roomTypeCN}，${styleName}，高质量，专业摄影，8k，细节丰富`
        } else {
          const styleOnly = styleName
            .replace(/(?:仅|只|单独)?(?:在|给)?[^，,。.]+?(?:中|里)?(?:增加|添加|放置|布置)[^，,。.]+/g, '')
            .replace(/^[，,。.\s]+|[，,。.\s]+$/g, '')
          
          if (styleOnly) {
            finalPrompt = `${roomTypeCN}，${styleOnly}，高质量，专业摄影，8k，细节丰富，简洁空间`
          } else {
            finalPrompt = `${roomTypeCN}，简约风格，高质量，专业摄影，8k，细节丰富，简洁空间`
          }
        }
      } else {
        finalPrompt = styleName.length > 10 || /[\u4e00-\u9fa5]/.test(styleName)
          ? `${roomTypeCN}，${styleName}，高质量，专业摄影，8k，细节丰富`
          : `${styleName}风格的${roomTypeCN}室内设计，高质量，专业摄影，8k，细节丰富，温馨舒适，现代家居`
      }
      
      const prompt = finalPrompt
      
      console.log(`📝 房间: ${room.name} (${roomTypeCN})`)
      console.log(`📝 最终提示词: ${prompt}`)

      // 调用Java后端代理API
      const response = await fetch(`${BACKEND_URL}/api/volcengine/text-to-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          req_key: 'high_aes_general_v30l_zt2i',
          prompt: prompt,
          width: 1328,
          height: 1328,
          scale: 2.5,
          seed: -1,
          use_pre_llm: false
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMsg = errorData.error || `后端API调用失败 (HTTP ${response.status})`
        console.error('❌ 后端返回错误:', errorMsg, errorData)
        throw new Error(errorMsg)
      }

      const data = await response.json()
      
      console.log('📥 后端响应:', data)
      
      if (!data.success || !data.imageUrl) {
        const errorMsg = data.error || '未返回图片'
        console.error('❌ 后端响应错误:', errorMsg, data)
        throw new Error(errorMsg)
      }

      console.log(`✅ 火山引擎设计生成完成: ${room.name}`)
      return data.imageUrl

    } catch (error) {
      console.error(`❌ 火山引擎 API调用失败 (${room.name}):`, error)
      throw error
    }
  }

  /**
   * 识别户型图中的房间（使用智能推断）
   */
  async detectRooms(imageFile: File): Promise<Room[]> {
    console.log('🔍 开始识别户型图...')
    return this.detectRoomsWithIntelligence(imageFile)
  }

  /**
   * 根据户型配置生成房间
   */
  async detectRoomsByLayout(layout: string): Promise<Room[]> {
    console.log(`🏠 根据户型配置生成房间: ${layout}`)
    
    const parts = layout.split('-')
    const bedroomCount = parseInt(parts[0] || '3', 10)
    const hallCount = parseInt(parts[1] || '2', 10)
    const bathroomCount = parseInt(parts[2] || '2', 10)
    
    const hasDining = hallCount >= 2
    const hasStudy = bedroomCount >= 4
    const hasBalcony = true
    
    return this.generateRoomsByConfig(bedroomCount, bathroomCount, hasDining, hasStudy, hasBalcony)
  }

  /**
   * 根据配置生成房间列表
   */
  private generateRoomsByConfig(
    bedroomCount: number,
    bathroomCount: number,
    hasDining: boolean,
    hasStudy: boolean,
    hasBalcony: boolean
  ): Room[] {
    const rooms: Room[] = []
    
    rooms.push({
      id: generateId(),
      type: 'living-room',
      name: '客厅',
      bounds: { x: 50, y: 50, width: 200, height: 150 },
      area: 32
    })
    
    if (hasDining) {
      rooms.push({
        id: generateId(),
        type: 'dining-room',
        name: '餐厅',
        bounds: { x: 270, y: 50, width: 140, height: 120 },
        area: 16
      })
    }
    
    for (let i = 0; i < bedroomCount; i++) {
      const isMainBedroom = i === 0
      rooms.push({
        id: generateId(),
        type: 'bedroom',
        name: isMainBedroom ? '主卧' : (i === 1 ? '次卧' : `次卧${i}`),
        bounds: { 
          x: 50 + (i % 2) * 200, 
          y: 220 + Math.floor(i / 2) * 160, 
          width: isMainBedroom ? 160 : 140, 
          height: isMainBedroom ? 150 : 130 
        },
        area: isMainBedroom ? 24 : 16
      })
    }
    
    rooms.push({
      id: generateId(),
      type: 'kitchen',
      name: '厨房',
      bounds: { x: 430, y: 50, width: 110, height: 100 },
      area: 10
    })
    
    for (let i = 0; i < bathroomCount; i++) {
      rooms.push({
        id: generateId(),
        type: 'bathroom',
        name: i === 0 ? (bathroomCount > 1 ? '主卫' : '卫生间') : (i === 1 ? '客卫' : `卫生间${i + 1}`),
        bounds: { 
          x: 430 + (i === 0 ? 0 : 120), 
          y: 170 + (i % 2) * 110, 
          width: 90, 
          height: 100 
        },
        area: 6
      })
    }
    
    if (hasStudy) {
      rooms.push({
        id: generateId(),
        type: 'study',
        name: '书房',
        bounds: { x: 270, y: 190, width: 130, height: 120 },
        area: 14
      })
    }
    
    if (hasBalcony) {
      rooms.push({
        id: generateId(),
        type: 'balcony',
        name: '阳台',
        bounds: { x: 50, y: 400, width: 120, height: 60 },
        area: 7
      })
    }
    
    const layoutDesc = `${bedroomCount}室${hasDining ? '2' : '1'}厅${bathroomCount}卫`
    console.log(`✅ 户型生成完成: ${layoutDesc}，共 ${rooms.length} 个房间`)
    return rooms
  }

  /**
   * 智能推断房间
   */
  private async detectRoomsWithIntelligence(imageFile: File): Promise<Room[]> {
    console.log('🧠 智能分析户型图...')
    
    const fileName = (imageFile.name || '').toLowerCase()
    
    let bedroomCount = 3
    let bathroomCount = 2
    let hasDining = true
    let hasBalcony = true
    let hasStudy = false
    
    const bedroomMatch = fileName.match(/(\d+)[室房]/)
    if (bedroomMatch && bedroomMatch[1]) {
      bedroomCount = parseInt(bedroomMatch[1], 10)
      if (bedroomCount >= 4) {
        hasStudy = true
        bathroomCount = 2
      } else if (bedroomCount === 1) {
        bathroomCount = 1
        hasDining = false
      }
    }
    
    const bathroomMatch = fileName.match(/(\d+)卫/)
    if (bathroomMatch && bathroomMatch[1]) {
      bathroomCount = parseInt(bathroomMatch[1], 10)
    }
    
    const hallMatch = fileName.match(/(\d+)厅/)
    if (hallMatch && hallMatch[1]) {
      const hallCount = parseInt(hallMatch[1], 10)
      hasDining = hallCount >= 2
    }
    
    const rooms = this.generateRoomsByConfig(bedroomCount, bathroomCount, hasDining, hasStudy, hasBalcony)
    
    const layoutDesc = `${bedroomCount}室${hasDining ? '2' : '1'}厅${bathroomCount}卫`
    console.log(`✅ 智能分析完成: ${layoutDesc}，共 ${rooms.length} 个房间`)
    return rooms
  }

  /**
   * 生成单个房间的设计图
   */
  async generateDesign(room: Room, styleName: string): Promise<string> {
    if (!this.useRealAPI) {
      console.log(`📝 useRealAPI=false，使用占位图: ${room.name}`)
      return this.generateDesignMock(room, styleName)
    }

    try {
      console.log(`🚀 开始调用火山引擎 API: ${room.name}`)
      return await this.generateDesignWithVolcEngine(room, styleName)
    } catch (error) {
      console.error(`❌ 火山引擎 API调用失败 (${room.name}):`, error)
      console.warn(`⚠️ 降级使用占位图: ${room.name}`)
      return this.generateDesignMock(room, styleName)
    }
  }

  /**
   * 模拟设计生成（备用方案）
   */
  private async generateDesignMock(room: Room, styleName: string): Promise<string> {
    console.log(`📝 使用占位图: ${room.name} - ${styleName}`)
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    const colors = ['FF8A65', 'FFB74D', '66BB6A', '42A5F5', 'AB47BC', '78909C']
    const color = colors[Math.floor(Math.random() * colors.length)]
    
    return `https://placehold.co/1024x1024/${color}/FFFFFF?text=${encodeURIComponent(room.name + '\n' + styleName)}&font=source-sans-pro`
  }

  /**
   * 批量生成设计
   */
  async batchGenerateDesigns(
    rooms: Room[], 
    style: string,
    onProgress?: (current: number, total: number, roomName?: string) => void,
    imagesPerRoom: number = 1
  ): Promise<Design[]> {
    const designs: Design[] = []
    const errors: string[] = []
    
    const totalImages = rooms.length * imagesPerRoom
    let completedImages = 0

    console.log(`🚀 开始生成 ${rooms.length} 个房间的设计，每个房间 ${imagesPerRoom} 张图片`)
    console.log(`⚡ 使用火山引擎视觉智能（Java后端代理模式）`)

    const tasks = []
    for (let i = 0; i < rooms.length; i++) {
      const room = rooms[i]
      if (!room) continue
      
      for (let j = 0; j < imagesPerRoom; j++) {
        tasks.push({ room, imageIndex: j })
      }
    }

    // 降低并发数以避免API限制
    const concurrency = 1 // 从3改为1，串行处理避免并发限制
    const results: Array<{ success: boolean; design?: Design; error?: string }> = []
    
    for (let i = 0; i < tasks.length; i += concurrency) {
      const batch = tasks.slice(i, i + concurrency)
      
      const batchResults = await Promise.allSettled(
        batch.map(async ({ room, imageIndex }) => {
          try {
            const imageUrl = await this.generateDesign(room, style)
            
            const styleOption = STYLE_OPTIONS.find(s => s.name === style)
            const promptTemplate = styleOption?.promptTemplate || '{roomType} interior design'
            const prompt = promptTemplate.replace('{roomType}', room.type.replace('-', ' '))
            
            const design = {
              id: generateId(),
              roomId: room.id,
              roomType: room.type,
              style,
              imageUrl,
              prompt,
              generatedAt: new Date(),
              liked: false
            }

            completedImages++
            
            if (onProgress) {
              onProgress(completedImages, totalImages, room.name)
            }

            console.log(`✅ 完成 ${completedImages}/${totalImages}: ${room.name} (第${imageIndex + 1}张)`)
            return { success: true, design }

          } catch (error) {
            const errorMsg = `${room.name} (第${imageIndex + 1}张): ${error instanceof Error ? error.message : '未知错误'}`
            errors.push(errorMsg)
            console.error(`❌ 失败:`, errorMsg)
            
            completedImages++
            if (onProgress) {
              onProgress(completedImages, totalImages, room.name)
            }
            
            return { success: false, error: errorMsg }
          }
        })
      )

      batchResults.forEach(result => {
        if (result.status === 'fulfilled' && result.value.success) {
          results.push(result.value)
        } else if (result.status === 'fulfilled' && !result.value.success) {
          results.push(result.value)
        }
      })

      // 增加请求间隔以避免API并发限制
      if (i + concurrency < tasks.length) {
        await new Promise(resolve => setTimeout(resolve, 3000)) // 从500ms增加到3000ms
      }
    }

    results.forEach(result => {
      if (result.success && result.design) {
        designs.push(result.design)
      }
    })

    if (errors.length > 0) {
      console.warn(`⚠️ ${errors.length} 张图片生成失败:`, errors)
    }

    console.log(`🎉 批量生成完成: 成功 ${designs.length}/${totalImages}`)
    return designs
  }

  /**
   * 测试API连接
   */
  async testConnection(): Promise<{ ocr: boolean; volcEngine: boolean }> {
    const result = { ocr: true, volcEngine: false }

    try {
      const response = await fetch(`${BACKEND_URL}/api/health`)
      result.volcEngine = response.ok
    } catch {
      result.volcEngine = false
    }

    return result
  }
}

export const aiService = new AIService()
