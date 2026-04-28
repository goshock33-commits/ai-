/**
 * 样式工具函数
 * 用于测试和验证样式系统的正确性
 */

/**
 * 将十六进制颜色转换为RGB对象
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      }
    : null
}

/**
 * 计算颜色的亮度值（0-255）
 * 使用相对亮度公式
 */
export function getBrightness(hex: string): number {
  const rgb = hexToRgb(hex)
  if (!rgb) return 0
  
  // 相对亮度公式
  return (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000
}

/**
 * 检查颜色是否为深色（亮度 < 80）
 * 注：深色主题中的次级背景可能略亮于主背景，但仍属于深色范围
 */
export function isDarkColor(hex: string): boolean {
  return getBrightness(hex) < 80
}

/**
 * 检查颜色是否为浅色（亮度 > 180）
 */
export function isLightColor(hex: string): boolean {
  return getBrightness(hex) > 180
}

/**
 * 将十六进制颜色转换为HSL
 */
export function hexToHsl(hex: string): { h: number; s: number; l: number } | null {
  const rgb = hexToRgb(hex)
  if (!rgb) return null
  
  const r = rgb.r / 255
  const g = rgb.g / 255
  const b = rgb.b / 255
  
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2
  
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6
        break
      case g:
        h = ((b - r) / d + 2) / 6
        break
      case b:
        h = ((r - g) / d + 4) / 6
        break
    }
  }
  
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  }
}

/**
 * 检查颜色是否为金色系（色相在40-60度范围内）
 */
export function isGoldColor(hex: string): boolean {
  const hsl = hexToHsl(hex)
  if (!hsl) return false
  
  return hsl.h >= 40 && hsl.h <= 60
}

/**
 * 检查值是否为8的倍数
 */
export function isMultipleOf8(value: number): boolean {
  return value === 0 || value % 8 === 0
}

/**
 * 从CSS值中提取数字（如 "16px" -> 16）
 */
export function extractNumber(cssValue: string): number {
  const match = cssValue.match(/^(-?\d+(?:\.\d+)?)/);
  return match ? parseFloat(match[1]) : 0
}

/**
 * 检查圆角值是否为预定义值之一
 */
export function isValidBorderRadius(value: string): boolean {
  const validValues = ['0', '0px', '4px', '8px', '16px', '24px', '9999px']
  return validValues.includes(value)
}

/**
 * 检查阴影值是否匹配预定义的阴影层级
 */
export function isValidBoxShadow(value: string): boolean {
  if (value === 'none') return true
  
  const validShadows = [
    '0 2px 8px rgba(0, 0, 0, 0.4)',
    '0 4px 16px rgba(0, 0, 0, 0.5)',
    '0 8px 24px rgba(0, 0, 0, 0.6)',
    '0 16px 48px rgba(0, 0, 0, 0.7)',
    '0 2px 8px rgba(212, 175, 55, 0.2)',
    '0 4px 16px rgba(212, 175, 55, 0.3)',
    '0 8px 24px rgba(212, 175, 55, 0.4)'
  ]
  
  // 标准化阴影值（移除多余空格）
  const normalized = value.replace(/\s+/g, ' ').trim()
  
  return validShadows.some(shadow => 
    normalized.includes(shadow.replace(/\s+/g, ' '))
  )
}

/**
 * 检查元素是否具有过渡效果
 */
export function hasTransition(element: HTMLElement): boolean {
  const transition = window.getComputedStyle(element).transition
  return transition !== 'all 0s ease 0s' && transition !== 'none'
}

/**
 * 检查元素是否具有圆角
 */
export function hasBorderRadius(element: HTMLElement): boolean {
  const borderRadius = window.getComputedStyle(element).borderRadius
  return borderRadius !== '0px' && borderRadius !== '0'
}

/**
 * 检查元素是否具有阴影
 */
export function hasBoxShadow(element: HTMLElement): boolean {
  const boxShadow = window.getComputedStyle(element).boxShadow
  return boxShadow !== 'none'
}
