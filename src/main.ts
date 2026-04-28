import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import './styles/global.scss'
import App from './App.vue'
import router from './router'
import { useProjectStore, useUIStore, useUserStore } from './stores'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(ElementPlus)

app.mount('#app')

// 初始化stores
const projectStore = useProjectStore()
const uiStore = useUIStore()
const userStore = useUserStore()

// 异步加载数据
;(async () => {
  await projectStore.loadFromStorage()
  uiStore.loadFromStorage()
  userStore.loadFromStorage() // 加载用户登录状态
})()

// 监听在线/离线状态
window.addEventListener('online', () => uiStore.setOnlineStatus(true))
window.addEventListener('offline', () => uiStore.setOnlineStatus(false))
