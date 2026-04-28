/**
 * 图片存储服务
 * 使用 IndexedDB 存储大量图片数据，避免 localStorage 容量限制
 */

class ImageStorageService {
  private dbName = 'ai-interior-design-images'
  private storeName = 'designs'
  private db: IDBDatabase | null = null

  /**
   * 初始化 IndexedDB
   */
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'id' })
        }
      }
    })
  }

  /**
   * 保存图片
   */
  async saveImage(id: string, imageUrl: string): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      const request = store.put({ id, imageUrl, timestamp: Date.now() })

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * 获取图片
   */
  async getImage(id: string): Promise<string | null> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly')
      const store = transaction.objectStore(this.storeName)
      const request = store.get(id)

      request.onsuccess = () => {
        const result = request.result
        resolve(result ? result.imageUrl : null)
      }
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * 删除图片
   */
  async deleteImage(id: string): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      const request = store.delete(id)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * 清空所有图片
   */
  async clearAll(): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      const request = store.clear()

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * 批量保存图片
   */
  async saveImages(images: Array<{ id: string; imageUrl: string }>): Promise<void> {
    for (const image of images) {
      try {
        await this.saveImage(image.id, image.imageUrl)
      } catch (error) {
        console.error('保存图片失败:', error)
      }
    }
  }

  /**
   * 批量获取图片
   */
  async getImages(ids: string[]): Promise<Record<string, string>> {
    const result: Record<string, string> = {}
    
    for (const id of ids) {
      try {
        const imageUrl = await this.getImage(id)
        if (imageUrl) {
          result[id] = imageUrl
        }
      } catch (error) {
        console.error('获取图片失败:', error)
      }
    }

    return result
  }
}

export const imageStorageService = new ImageStorageService()
