<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useUserStore } from '@/stores'

const userStore = useUserStore()

// 监听在线/离线状态
const handleOnline = () => {
  console.log('[App] Network online')
}

const handleOffline = () => {
  console.log('[App] Network offline')
}

onMounted(() => {
  // 从 localStorage 加载用户状态
  userStore.loadFromStorage()
  
  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)
})

onUnmounted(() => {
  window.removeEventListener('online', handleOnline)
  window.removeEventListener('offline', handleOffline)
})
</script>

<template>
  <div id="app">
    <router-view v-slot="{ Component, route }">
      <transition 
        name="fade"
        mode="out-in"
      >
        <component :is="Component" :key="route.path" />
      </transition>
    </router-view>
  </div>
</template>

<style lang="scss">
@use '@/styles/variables.scss' as *;

#app {
  width: 100%;
  min-height: 100vh;
}

// 路由过渡动画
.fade-enter-active,
.fade-leave-active {
  transition: opacity $duration-base $ease-in-out;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-left-enter-active,
.slide-left-leave-active {
  transition: all $duration-base $ease-in-out;
}

.slide-left-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.slide-left-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}

.slide-right-enter-active,
.slide-right-leave-active {
  transition: all $duration-base $ease-in-out;
}

.slide-right-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}

.slide-right-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

.scale-enter-active,
.scale-leave-active {
  transition: all $duration-base $ease-in-out;
}

.scale-enter-from {
  opacity: 0;
  transform: scale(0.9);
}

.scale-leave-to {
  opacity: 0;
  transform: scale(1.1);
}
</style>
