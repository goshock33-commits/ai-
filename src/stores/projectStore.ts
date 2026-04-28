/**
 * 项目状态管�?
 */

import { defineStore } from 'pinia'
import type { Project } from '@/types'
import { STORAGE_KEYS } from '@/utils/constants'
import { generateId } from '@/utils/helpers'
import { imageStorageService } from '@/services/imageStorageService'

interface ProjectState {
  currentProject: Project | null
  projects: Project[]
  loading: boolean
  error: string | null
}

export const useProjectStore = defineStore('project', {
  state: (): ProjectState => ({
    currentProject: null,
    projects: [],
    loading: false,
    error: null
  }),

  getters: {
    hasCurrentProject: (state) => state.currentProject !== null,
    
    projectCount: (state) => state.projects.length,
    
    completedProjects: (state) => 
      state.projects.filter(p => p.status === 'completed'),
    
    draftProjects: (state) => 
      state.projects.filter(p => p.status === 'draft')
  },

  actions: {
    // 创建新项目
    createProject(name: string = '新项目'): Project {
      const project: Project = {
        id: generateId(),
        name,
        floorPlanUrl: '',
        rooms: [],
        selectedStyle: '',
        designs: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'draft'
      }
      
      this.currentProject = project
      this.projects.unshift(project)
      this.saveToStorage()
      
      return project
    },

    // 更新当前项目
    async updateCurrentProject(updates: Partial<Project>): Promise<void> {
      if (this.currentProject) {
        this.currentProject = {
          ...this.currentProject,
          ...updates,
          updatedAt: new Date()
        }
        
        // 如果更新包含设计图，保存到IndexedDB（但保持内存中的Base64�?
        if (updates.designs && updates.designs.length > 0) {
          const imagesToSave = updates.designs
            .filter(d => d.imageUrl.startsWith('data:image'))
            .map(d => ({ id: d.id, imageUrl: d.imageUrl }))
          
          if (imagesToSave.length > 0) {
            try {
              await imageStorageService.saveImages(imagesToSave)
              // 注意：不在这里替换Base64，保持内存中的图片可�?
            } catch (error) {
              }
          }
        }
        
        // 同步更新projects数组中的项目
        const index = this.projects.findIndex(p => p.id === this.currentProject!.id)
        if (index !== -1) {
          this.projects[index] = { ...this.currentProject }
        } else {
          // 如果不存在，添加到数�?
          this.projects.unshift(this.currentProject)
        }
        
        this.saveToStorage()
      }
    },

    // 设置当前项目
    setCurrentProject(projectId: string): void {
      const project = this.projects.find(p => p.id === projectId)
      if (project) {
        this.currentProject = project
        this.saveCurrentProjectToStorage()
      }
    },

    // 清除当前项目
    clearCurrentProject(): void {
      this.currentProject = null
      localStorage.removeItem(STORAGE_KEYS.CURRENT_PROJECT)
    },

    // 删除项目
    deleteProject(projectId: string): void {
      this.projects = this.projects.filter(p => p.id !== projectId)
      
      if (this.currentProject?.id === projectId) {
        this.clearCurrentProject()
      }
      
      this.saveToStorage()
    },

    // 保存到LocalStorage
    saveToStorage(): void {
      try {
        // 创建项目副本，移除Base64图片以节省空�?
        const projectsToSave = this.projects.map(project => ({
          ...project,
          designs: project.designs.map(design => ({
            ...design,
            // 如果是Base64图片（data:image开头），替换为占位�?
            // 如果已经是占位符（indexed:开头），保持不�?
            imageUrl: design.imageUrl.startsWith('data:image') 
              ? `indexed:${design.id}` 
              : design.imageUrl
          }))
        }))
        
        localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projectsToSave))
        this.saveCurrentProjectToStorage()
      } catch (error) {
        this.error = '保存失败，存储空间可能已满'
      }
    },

    // 保存当前项目
    saveCurrentProjectToStorage(): void {
      if (this.currentProject) {
        try {
          // 创建副本，移除Base64图片
          const projectToSave = {
            ...this.currentProject,
            designs: this.currentProject.designs.map(design => ({
              ...design,
              imageUrl: design.imageUrl.startsWith('data:image') 
                ? `indexed:${design.id}` 
                : design.imageUrl
            }))
          }
          
          localStorage.setItem(
            STORAGE_KEYS.CURRENT_PROJECT,
            JSON.stringify(projectToSave)
          )
        } catch (error) {
          }
      }
    },

    // 从LocalStorage加载
    async loadFromStorage(): Promise<void> {
      try {
        const projectsData = localStorage.getItem(STORAGE_KEYS.PROJECTS)
        if (projectsData) {
          this.projects = JSON.parse(projectsData)
          
          // 从IndexedDB恢复图片
          for (const project of this.projects) {
            if (project.designs && project.designs.length > 0) {
              // 找出需要从IndexedDB恢复的设�?
              const designsToRestore = project.designs.filter(d => 
                d.imageUrl.startsWith('indexed:')
              )
              
              if (designsToRestore.length > 0) {
                const designIds = designsToRestore.map(d => d.id)
                const images = await imageStorageService.getImages(designIds)
                
                // 恢复图片URL
                project.designs = project.designs.map(design => {
                  if (design.imageUrl.startsWith('indexed:')) {
                    return {
                      ...design,
                      imageUrl: images[design.id] || design.imageUrl
                    }
                  }
                  return design
                })
              }
            }
          }
        }

        const currentProjectData = localStorage.getItem(STORAGE_KEYS.CURRENT_PROJECT)
        if (currentProjectData) {
          this.currentProject = JSON.parse(currentProjectData)
          
          // 恢复当前项目的图�?
          if (this.currentProject?.designs && this.currentProject.designs.length > 0) {
            const designsToRestore = this.currentProject.designs.filter(d => 
              d.imageUrl.startsWith('indexed:')
            )
            
            if (designsToRestore.length > 0) {
              const designIds = designsToRestore.map(d => d.id)
              const images = await imageStorageService.getImages(designIds)
              
              this.currentProject.designs = this.currentProject.designs.map(design => {
                if (design.imageUrl.startsWith('indexed:')) {
                  return {
                    ...design,
                    imageUrl: images[design.id] || design.imageUrl
                  }
                }
                return design
              })
            }
          }
        }
      } catch (error) {
        this.error = '加载项目失败'
      }
    },

    // 设置加载状�?
    setLoading(loading: boolean): void {
      this.loading = loading
    },

    // 设置错误
    setError(error: string | null): void {
      this.error = error
    }
  }
})
