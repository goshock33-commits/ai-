/**
 * Store相关类型定义
 */

import type { Project } from './models'

// 项目Store状态
export interface ProjectStoreState {
  currentProject: Project | null
  projects: Project[]
  loading: boolean
  error: string | null
}

// UI Store状态
export interface UIStoreState {
  currentStep: number
  sidebarOpen: boolean
  theme: 'light' | 'dark'
  isOnline: boolean
}

// 设计步骤枚举
export const DesignStep = {
  Upload: 0,
  RoomDetection: 1,
  StyleSelection: 2,
  Generating: 3,
  Results: 4
} as const

export type DesignStepValue = typeof DesignStep[keyof typeof DesignStep]

// 步骤信息接口
export interface StepInfo {
  step: DesignStepValue
  label: string
  path: string
  icon: string
}

// 设计流程步骤配置
export const DESIGN_STEPS: StepInfo[] = [
  {
    step: DesignStep.Upload,
    label: '上传图片',
    path: '/upload',
    icon: 'upload'
  },
  {
    step: DesignStep.RoomDetection,
    label: '房间识别',
    path: '/room-detection',
    icon: 'location'
  },
  {
    step: DesignStep.StyleSelection,
    label: '风格选择',
    path: '/style-selection',
    icon: 'picture'
  },
  {
    step: DesignStep.Generating,
    label: '生成中',
    path: '/generating',
    icon: 'loading'
  },
  {
    step: DesignStep.Results,
    label: '查看结果',
    path: '/results',
    icon: 'view'
  }
]
