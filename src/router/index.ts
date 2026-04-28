import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

// 扩展路由元信息类型
declare module 'vue-router' {
  interface RouteMeta {
    title: string
    requiresProject?: boolean  // 是否需要当前项目
    step?: number             // 设计流程步骤
  }
}

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/home'
  },
  {
    path: '/home',
    name: 'Home',
    component: () => import('@/views/HomePage.vue'),
    meta: { 
      title: '室内设计'
    }
  },
  {
    path: '/furniture-placement',
    name: 'FurniturePlacement',
    component: () => import('@/views/FurniturePlacementPage.vue'),
    meta: { 
      title: '家具虚拟摆放'
    }
  },
  {
    path: '/interior-history',
    name: 'InteriorHistory',
    component: () => import('@/views/InteriorHistoryPage.vue'),
    meta: { 
      title: '室内设计历史记录'
    }
  },
  {
    path: '/furniture-history',
    name: 'FurnitureHistory',
    component: () => import('@/views/FurnitureHistoryPage.vue'),
    meta: { 
      title: '家具摆放历史记录'
    }
  },
  {
    path: '/video-generation',
    name: 'VideoGeneration',
    component: () => import('@/views/VideoGenerationPage.vue'),
    meta: { 
      title: '视频生成'
    }
  },
  {
    path: '/video-history',
    name: 'VideoHistory',
    component: () => import('@/views/VideoHistoryPage.vue'),
    meta: { 
      title: '宣传视频历史记录'
    }
  },
  {
    path: '/digital-human',
    name: 'DigitalHuman',
    component: () => import('@/views/DigitalHumanPage.vue'),
    meta: { 
      title: '数字人视频生成'
    }
  },
  {
    path: '/digital-human-history',
    name: 'DigitalHumanHistory',
    component: () => import('@/views/DigitalHumanHistoryPage.vue'),
    meta: { 
      title: '数字人历史记录'
    }
  },
  {
    path: '/partner',
    name: 'Partner',
    component: () => import('@/views/PartnerPage.vue'),
    meta: { 
      title: '城市合伙人'
    }
  },
  {
    path: '/about',
    name: 'About',
    component: () => import('@/views/AboutPage.vue'),
    meta: { 
      title: '关于我们'
    }
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/RegisterPage.vue'),
    meta: { 
      title: '登录'
    }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/RegisterPage.vue'),
    meta: { 
      title: '注册'
    }
  },
  {
    path: '/upload',
    name: 'Upload',
    component: () => import('@/views/UploadPage.vue'),
    meta: { 
      title: '上传照片',
      step: 0
    }
  },
  {
    path: '/results/:projectId',
    name: 'Results',
    component: () => import('@/views/ResultsPage.vue'),
    meta: { 
      title: '设计结果',
      step: 2
    }
  },
  {
    path: '/my-packages',
    name: 'MyPackages',
    component: () => import('@/views/MyPackagesPage.vue'),
    meta: { 
      title: '我的套餐'
    }
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('@/views/SettingsPage.vue'),
    meta: { 
      title: '设置'
    }
  },
  {
    path: '/projects',
    name: 'Projects',
    component: () => import('@/views/InteriorHistoryPage.vue'),
    meta: { 
      title: '我的项目'
    }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(_to, _from, savedPosition) {
    // 如果有保存的位置（浏览器前进/后退），恢复到该位置
    if (savedPosition) {
      return savedPosition
    }
    // 否则滚动到顶部
    return { top: 0, behavior: 'smooth' }
  }
})

// 全局前置守卫
router.beforeEach((to, from, next) => {
  // 1. 设置页面标题
  const title = to.meta.title
  if (title) {
    document.title = `${title} - ${import.meta.env.VITE_APP_TITLE || 'AI室内设计助手'}`
  }

  // 2. 检查是否需要当前项目
  if (to.meta.requiresProject) {
    // 这里暂时放行，后续在实现Store后会添加项目检查逻辑
    // const projectStore = useProjectStore()
    // if (!projectStore.currentProject) {
    //   next({ name: 'Upload' })
    //   return
    // }
  }

  // 3. 记录路由变化（用于调试）
  if (import.meta.env.DEV) {
    console.log(`[Router] ${from.path} -> ${to.path}`)
  }

  next()
})

// 全局后置钩子
router.afterEach((to) => {
  // 路由切换完成后的处理
  if (import.meta.env.DEV) {
    console.log(`[Router] Navigation completed: ${to.path}`)
  }
})

// 路由错误处理
router.onError((error) => {
  console.error('[Router Error]', error)
})

export default router
