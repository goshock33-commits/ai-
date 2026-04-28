/**
 * 路由守卫
 */

import type { NavigationGuardNext, RouteLocationNormalized } from 'vue-router'

/**
 * 检查是否有当前项目
 * 如果没有项目，重定向到上传页面
 */
export function checkCurrentProject(
  _to: RouteLocationNormalized,
  _from: RouteLocationNormalized,
  next: NavigationGuardNext
): void {
  // TODO: 实现项目检查逻辑
  // const projectStore = useProjectStore()
  // if (!projectStore.currentProject) {
  //   next({ name: 'Upload' })
  //   return
  // }
  next()
}

/**
 * 检查步骤顺序
 * 确保用户按照正确的步骤流程进行操作
 */
export function checkStepOrder(
  _to: RouteLocationNormalized,
  _from: RouteLocationNormalized,
  next: NavigationGuardNext
): void {
  // TODO: 实现步骤顺序检查逻辑
  // const uiStore = useUIStore()
  // const currentStep = uiStore.currentStep
  // const targetStep = to.meta.step
  
  // if (targetStep !== undefined && targetStep > currentStep + 1) {
  //   // 如果跳过了步骤，重定向到当前步骤的下一步
  //   next({ name: 'Upload' })
  //   return
  // }
  
  next()
}

/**
 * 记录页面访问
 */
export function logPageView(to: RouteLocationNormalized): void {
  if (import.meta.env.DEV) {
    console.log('页面访问:', to.name, to.path)
  }
}
