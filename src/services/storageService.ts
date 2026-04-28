/**
 * 本地存储服务
 */

import type { Project } from '@/types'
import { STORAGE_KEYS } from '@/utils/constants'

class StorageService {
  async saveProject(project: Project): Promise<string> {
    try {
      const projects = await this.listProjects()
      const existingIndex = projects.findIndex(p => p.id === project.id)
      
      if (existingIndex !== -1) {
        projects[existingIndex] = project
      } else {
        projects.unshift(project)
      }
      
      localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects))
      return project.id
    } catch (error) {
      throw new Error('保存项目失败')
    }
  }

  async getProject(id: string): Promise<Project | null> {
    try {
      const projects = await this.listProjects()
      return projects.find(p => p.id === id) || null
    } catch (error) {
      return null
    }
  }

  async listProjects(): Promise<Project[]> {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PROJECTS)
      return data ? JSON.parse(data) : []
    } catch (error) {
      return []
    }
  }

  async deleteProject(id: string): Promise<void> {
    try {
      const projects = await this.listProjects()
      const filtered = projects.filter(p => p.id !== id)
      localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(filtered))
    } catch (error) {
      throw new Error('删除项目失败')
    }
  }
}

export const storageService = new StorageService()
