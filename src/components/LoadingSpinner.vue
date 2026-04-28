<script setup lang="ts">
defineProps<{
  size?: 'small' | 'medium' | 'large'
  text?: string
}>()
</script>

<template>
  <div class="loading-spinner" :class="`loading-spinner--${size || 'medium'}`">
    <div class="spinner"></div>
    <p v-if="text" class="loading-text">{{ text }}</p>
  </div>
</template>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;

.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: $spacing-2;

  &--small .spinner {
    width: 24px;
    height: 24px;
    border-width: 2px;
  }

  &--medium .spinner {
    width: 40px;
    height: 40px;
    border-width: 3px;
  }

  &--large .spinner {
    width: 60px;
    height: 60px;
    border-width: 4px;
  }
}

.spinner {
  border: 3px solid rgba($primary, 0.2);
  border-top-color: $primary;
  border-radius: $radius-full;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-text {
  color: $text-secondary;
  font-size: $font-size-sm;
  margin: 0;
}
</style>
