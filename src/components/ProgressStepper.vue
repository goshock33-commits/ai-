<script setup lang="ts">
defineProps<{
  currentStep: number
  steps: string[]
}>()
</script>

<template>
  <div class="progress-stepper">
    <div 
      v-for="(step, index) in steps" 
      :key="index"
      class="step"
      :class="{
        'step--active': index === currentStep,
        'step--completed': index < currentStep
      }"
    >
      <div class="step__circle">
        <span v-if="index < currentStep">✓</span>
        <span v-else>{{ index + 1 }}</span>
      </div>
      <div class="step__label">{{ step }}</div>
      <div v-if="index < steps.length - 1" class="step__line"></div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;

.progress-stepper {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: $spacing-3 0;
}

.step {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;

  &__circle {
    width: 40px;
    height: 40px;
    border-radius: $radius-full;
    background: white;
    border: 2px solid #e0e0e0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 500;
    color: #1a1a1a;
    transition: all $duration-base $ease-in-out;
    z-index: 1;
  }

  &__label {
    margin-top: $spacing-1;
    font-size: $font-size-sm;
    color: $text-secondary;
    text-align: center;
  }

  &__line {
    position: absolute;
    top: 20px;
    left: 50%;
    width: 100%;
    height: 2px;
    background: #e0e0e0;
    transition: background $duration-base $ease-in-out;
  }

  &--active &__circle {
    background: linear-gradient(135deg, #1890ff 0%, #1890ff 100%);
    border-color: #1890ff;
    color: white;
    box-shadow: 0 2px 8px rgba(24, 144, 255, 0.3);
  }

  &--completed &__circle {
    background: linear-gradient(135deg, #1890ff 0%, #1890ff 100%);
    border-color: #1890ff;
    color: white;
    box-shadow: 0 2px 8px rgba(24, 144, 255, 0.3);
  }

  &--completed &__line {
    background: #1890ff;
  }
}
</style>
