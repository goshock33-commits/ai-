<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

interface Props {
  initialSeconds: number
}

const props = defineProps<Props>()
const emit = defineEmits<{
  timeout: []
}>()

const remainingSeconds = ref(props.initialSeconds)
let timer: number | null = null

const formattedTime = computed(() => {
  const minutes = Math.floor(remainingSeconds.value / 60)
  const seconds = remainingSeconds.value % 60
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
})

const startTimer = () => {
  timer = window.setInterval(() => {
    remainingSeconds.value--
    if (remainingSeconds.value <= 0) {
      stopTimer()
      emit('timeout')
    }
  }, 1000)
}

const stopTimer = () => {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

onMounted(() => {
  startTimer()
})

onUnmounted(() => {
  stopTimer()
})

defineExpose({
  stopTimer
})
</script>

<template>
  <div class="countdown-timer">
    <svg class="timer-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="10"></circle>
      <polyline points="12 6 12 12 16 14"></polyline>
    </svg>
    <span class="timer-text">{{ formattedTime }}</span>
  </div>
</template>

<style lang="scss" scoped>
.countdown-timer {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  background: rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 0.375rem;
  color: #666;
  font-weight: 500;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(0, 0, 0, 0.06);
    border-color: rgba(0, 0, 0, 0.12);
  }

  .timer-icon {
    width: 14px;
    height: 14px;
    stroke-width: 2;
    opacity: 0.7;
  }

  .timer-text {
    font-size: 0.875rem;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif;
    letter-spacing: 0.02em;
    font-variant-numeric: tabular-nums;
  }
}
</style>
