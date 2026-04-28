/**
 * 核心数据模型类型定义
 */

// 房间类型枚举
export type RoomType =
  | 'living-room'    // 客厅
  | 'bedroom'        // 卧室
  | 'kitchen'        // 厨房
  | 'bathroom'       // 卫生间
  | 'dining-room'    // 餐厅
  | 'study'          // 书房
  | 'balcony'        // 阳台
  | 'entrance'       // 玄关
  | 'other'          // 其他

// 房间类型中文标签映射
export const RoomTypeLabels: Record<RoomType, string> = {
  'living-room': '客厅',
  'bedroom': '卧室',
  'kitchen': '厨房',
  'bathroom': '卫生间',
  'dining-room': '餐厅',
  'study': '书房',
  'balcony': '阳台',
  'entrance': '玄关',
  'other': '其他'
}

// 边界框
export interface BoundingBox {
  x: number
  y: number
  width: number
  height: number
}

// 房间
export interface Room {
  id: string
  type: RoomType
  bounds: BoundingBox
  area?: number
  name: string
}

// 设计结果
export interface Design {
  id: string
  roomId: string
  roomType: RoomType
  style: string
  imageUrl: string
  prompt: string
  generatedAt: Date
  liked: boolean
}

// 项目状态
export type ProjectStatus = 'draft' | 'processing' | 'completed' | 'failed'

// 项目
export interface Project {
  id: string
  name: string
  floorPlanUrl: string
  rooms: Room[]
  selectedStyle: string
  designs: Design[]
  createdAt: Date
  updatedAt: Date
  status: ProjectStatus
}

// 设计风格选项
export interface StyleOption {
  id: string
  name: string
  nameEn: string
  description: string
  thumbnail: string
  tags: string[]
  promptTemplate: string
}

// 预定义的风格选项
export const STYLE_OPTIONS: StyleOption[] = [
  {
    id: 'modern-minimalist',
    name: '现代简约',
    nameEn: 'Modern Minimalist',
    description: '简洁明快的线条，中性色调为主，强调功能性和空间感，适合追求简单生活的人群',
    thumbnail: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop',
    tags: ['简约', '现代', '明亮'],
    promptTemplate: 'modern minimalist {roomType} interior design, clean lines, neutral colors, bright, spacious, professional photography, 8k'
  },
  {
    id: 'new-chinese',
    name: '新中式',
    nameEn: 'New Chinese',
    description: '传统中式元素与现代设计的完美融合，既有东方韵味又不失现代舒适感',
    thumbnail: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=400&h=300&fit=crop',
    tags: ['中式', '典雅', '传统'],
    promptTemplate: 'new chinese style {roomType} interior design, elegant, traditional elements, modern comfort, warm lighting, professional photography, 8k'
  },
  {
    id: 'nordic',
    name: '北欧风',
    nameEn: 'Nordic Scandinavian',
    description: '以白色为主调，搭配原木家具，强调自然光线和简洁设计，营造温馨舒适的氛围',
    thumbnail: 'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=400&h=300&fit=crop',
    tags: ['北欧', '自然', '温馨'],
    promptTemplate: 'nordic scandinavian {roomType} interior design, natural wood, soft colors, cozy, bright natural light, professional photography, 8k'
  },
  {
    id: 'light-luxury',
    name: '轻奢风',
    nameEn: 'Light Luxury',
    description: '低调奢华，注重质感和细节，使用高品质材料，营造精致优雅的生活空间',
    thumbnail: 'https://images.unsplash.com/photo-1600210492493-0946911123ea?w=400&h=300&fit=crop',
    tags: ['奢华', '精致', '优雅'],
    promptTemplate: 'light luxury {roomType} interior design, elegant, high-end materials, sophisticated, warm ambient lighting, professional photography, 8k'
  },
  {
    id: 'japanese',
    name: '日式',
    nameEn: 'Japanese Zen',
    description: '简约自然，注重空间的留白和禅意，使用天然材料，营造宁静舒适的氛围',
    thumbnail: 'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=400&h=300&fit=crop',
    tags: ['禅意', '自然', '简约'],
    promptTemplate: 'japanese zen {roomType} interior design, minimalist, natural materials, tatami, peaceful atmosphere, soft lighting, professional photography, 8k'
  },
  {
    id: 'industrial',
    name: '工业风',
    nameEn: 'Industrial Loft',
    description: '裸露的砖墙、金属管道和混凝土，搭配复古家具，展现粗犷而个性的美感',
    thumbnail: 'https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?w=400&h=300&fit=crop',
    tags: ['工业', '复古', '个性'],
    promptTemplate: 'industrial loft {roomType} interior design, exposed brick, metal fixtures, concrete, vintage elements, dramatic lighting, professional photography, 8k'
  },
  {
    id: 'french-romantic',
    name: '法式浪漫',
    nameEn: 'French Romantic',
    description: '优雅精致，注重装饰细节，使用柔和的色彩和华丽的家具，营造浪漫氛围',
    thumbnail: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=400&h=300&fit=crop',
    tags: ['浪漫', '优雅', '精致'],
    promptTemplate: 'french romantic {roomType} interior design, elegant, ornate details, soft pastels, chandelier, luxurious fabrics, professional photography, 8k'
  },
  {
    id: 'american-classic',
    name: '美式经典',
    nameEn: 'American Classic',
    description: '舒适实用，注重家庭氛围，使用深色木质家具和温暖的色调',
    thumbnail: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=300&fit=crop',
    tags: ['舒适', '实用', '温暖'],
    promptTemplate: 'american classic {roomType} interior design, comfortable, traditional furniture, warm colors, spacious, family-friendly, professional photography, 8k'
  },
  {
    id: 'mediterranean',
    name: '地中海',
    nameEn: 'Mediterranean',
    description: '蓝白色调为主，拱形门窗，自然材质，营造清新自然的海滨风情',
    thumbnail: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&h=300&fit=crop',
    tags: ['蓝白', '清新', '自然'],
    promptTemplate: 'mediterranean {roomType} interior design, blue and white, natural textures, arched doorways, coastal vibes, bright and airy, professional photography, 8k'
  },
  {
    id: 'modern-luxury',
    name: '现代奢华',
    nameEn: 'Modern Luxury',
    description: '大气奢华，使用大理石、金属等高端材料，展现尊贵品味',
    thumbnail: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=400&h=300&fit=crop',
    tags: ['奢华', '大气', '高端'],
    promptTemplate: 'modern luxury {roomType} interior design, high-end, marble, gold accents, designer furniture, dramatic lighting, professional photography, 8k'
  },
  {
    id: 'bohemian',
    name: '波西米亚',
    nameEn: 'Bohemian',
    description: '自由随性，色彩丰富，混搭各种元素，展现艺术气息和个性',
    thumbnail: 'https://images.unsplash.com/photo-1616047006789-b7af5afb8c20?w=400&h=300&fit=crop',
    tags: ['自由', '艺术', '个性'],
    promptTemplate: 'bohemian {roomType} interior design, eclectic, colorful textiles, plants, vintage pieces, cozy and artistic, professional photography, 8k'
  },
  {
    id: 'contemporary',
    name: '当代风格',
    nameEn: 'Contemporary',
    description: '时尚前卫，大胆的色彩搭配，注重艺术性和创新性',
    thumbnail: 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=400&h=300&fit=crop',
    tags: ['时尚', '前卫', '创新'],
    promptTemplate: 'contemporary {roomType} interior design, sleek, modern furniture, bold colors, artistic elements, sophisticated, professional photography, 8k'
  }
]
