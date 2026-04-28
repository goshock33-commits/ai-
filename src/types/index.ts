/**
 * 类型定义统一导出入口
 */

// 导出模型相关类型
export * from './models'

// 导出API相关类型
export * from './api'

// 导出Store相关类型
export * from './store'

// 导出通用工具类型
export type Nullable<T> = T | null
export type Optional<T> = T | undefined
export type AsyncFunction<T = void> = (...args: any[]) => Promise<T>
export type VoidFunction = () => void
