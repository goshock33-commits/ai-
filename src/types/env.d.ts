/**
 * 环境变量类型定义
 */

/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_STABILITY_API_KEY: string
  readonly VITE_OPENAI_API_KEY: string
  readonly VITE_API_TIMEOUT: string
  readonly VITE_MAX_FILE_SIZE: string
  readonly VITE_APP_TITLE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
