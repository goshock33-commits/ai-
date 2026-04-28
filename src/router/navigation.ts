/**
 * 路由导航辅助函数
 */

import router from './index'
import type { RouteLocationRaw } from 'vue-router'

/**
 * 导航到指定路由
 */
export async function navigateTo(to: RouteLocationRaw): Promise<void> {
  try {
    await router.push(to)
  } catch (err) {
    console.error('导航失败:', err)
  }
}

/**
 * 替换当前路由
 */
export async function replaceTo(to: RouteLocationRaw): Promise<void> {
  try {
    await router.replace(to)
  } catch (err) {
    console.error('替换路由失败:', err)
  }
}

/**
 * 返回上一页
 */
export function goBack(): void {
  router.back()
}

/**
 * 前进到下一页
 */
export function goForward(): void {
  router.forward()
}

/**
 * 跳转到首页
 */
export function goToHome(): Promise<void> {
  return navigateTo({ name: 'Home' })
}

/**
 * 跳转到上传页面
 */
export function goToUpload(): Promise<void> {
  return navigateTo({ name: 'Upload' })
}

/**
 * 跳转到房间识别页面
 */
export function goToRoomDetection(): Promise<void> {
  return navigateTo({ name: 'RoomDetection' })
}

/**
 * 跳转到风格选择页面
 */
export function goToStyleSelection(): Promise<void> {
  return navigateTo({ name: 'StyleSelection' })
}

/**
 * 跳转到生成页面
 */
export function goToGenerating(): Promise<void> {
  return navigateTo({ name: 'Generating' })
}

/**
 * 跳转到结果页面
 */
export function goToResults(projectId: string): Promise<void> {
  return navigateTo({ 
    name: 'Results', 
    params: { projectId } 
  })
}

/**
 * 跳转到项目列表页面
 */
export function goToProjects(): Promise<void> {
  return navigateTo({ name: 'Projects' })
}

/**
 * 根据步骤索引跳转
 */
export function goToStep(step: number): Promise<void> {
  const stepRoutes = [
    'Upload',
    'RoomDetection',
    'StyleSelection',
    'Generating',
    'Results'
  ]
  
  if (step >= 0 && step < stepRoutes.length) {
    return navigateTo({ name: stepRoutes[step] })
  }
  
  return Promise.reject(new Error(`Invalid step: ${step}`))
}

/**
 * 跳转到下一步
 */
export function goToNextStep(currentStep: number): Promise<void> {
  return goToStep(currentStep + 1)
}

/**
 * 跳转到上一步
 */
export function goToPreviousStep(currentStep: number): Promise<void> {
  return goToStep(currentStep - 1)
}
