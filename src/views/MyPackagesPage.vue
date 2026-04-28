<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import NavigationBar from '@/components/NavigationBar.vue'
import CountdownTimer from '@/components/CountdownTimer.vue'
import { useUserStore } from '@/stores'

const router = useRouter()
const userStore = useUserStore()

interface Package {
  id: string
  name: string
  price: number
  period: string
  purchaseDate: string
  expiryDate: string
  status: 'active' | 'expired'
  features: string[]
  usage: {
    designGeneration: { used: number; total: number | string }
    furniturePlacement: { used: number; total: number | string }
    videoGeneration: { used: number; total: number | string }
  }
}

interface UnpaidOrder {
  id: string
  orderNumber: string
  name: string
  price: number
  period: string
  createTime: string
  expiryTime: string
  remainingSeconds: number
  features: string[]
}

const packages = ref<Package[]>([])
const unpaidOrders = ref<UnpaidOrder[]>([])
const loading = ref(true)

onMounted(() => {
  // 检查是否登录
  if (!userStore.loggedIn) {
    router.push('/login')
    return
  }

  // 加载套餐数据
  loadPackages()
})

const loadPackages = () => {
  loading.value = true
  
  // 模拟从后端加载数据
  setTimeout(() => {
    // 加载未支付订单
    unpaidOrders.value = [
      // 这里应该从后端API获取未支付的订单
      // 示例数据：
      // {
      //   id: 'order_001',
      //   orderNumber: 'ORD17360123451234',
      //   name: '月度套餐',
      //   price: 1299,
      //   period: '月',
      //   createTime: '2025-01-05 14:30:00',
      //   expiryTime: '2025-01-05 15:00:00',
      //   remainingSeconds: 1200,
      //   features: ['所有核心功能', '200次设计生成', '200次家具摆放', '30次视频生成', '在线客服支持']
      // }
    ]
    
    // 加载已支付套餐
    packages.value = [
      {
        id: 'pkg_001',
        name: '年度套餐',
        price: 3999,
        period: '年',
        purchaseDate: '2025-01-04',
        expiryDate: '2026-01-04',
        status: 'active',
        features: ['所有核心功能', '无限次设计生成', '无限次家具摆放', '365次视频生成', '专属客户经理', '7×24小时服务'],
        usage: {
          designGeneration: { used: 45, total: '无限' },
          furniturePlacement: { used: 32, total: '无限' },
          videoGeneration: { used: 8, total: 365 }
        }
      }
    ]
    loading.value = false
  }, 500)
}

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })
}

const getRemainingDays = (expiryDate: string) => {
  const now = new Date()
  const expiry = new Date(expiryDate)
  const diff = expiry.getTime() - now.getTime()
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
  return days > 0 ? days : 0
}

const goToPurchase = () => {
  router.push('/home#pricing')
}

const goToPayment = (orderId: string) => {
  // 跳转到支付页面，携带订单ID
  router.push(`/payment?orderId=${orderId}`)
}

const cancelOrder = (orderId: string) => {
  // 取消订单
  unpaidOrders.value = unpaidOrders.value.filter(order => order.id !== orderId)
  ElMessage.success('订单已取消')
}

const handleOrderTimeout = (orderId: string) => {
  // 订单超时处理
  unpaidOrders.value = unpaidOrders.value.filter(order => order.id !== orderId)
  ElMessage.warning('订单已超时')
}
</script>

<template>
  <div class="packages-page">
    <NavigationBar />
    
    <div class="packages-container">
      <div class="packages-header">
        <h1>我的订单</h1>
        <p class="subtitle">查看和管理您购买的服务套餐</p>
      </div>

      <!-- 加载状态 -->
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>加载中...</p>
      </div>

      <!-- 套餐列表 -->
      <div v-else-if="packages.length > 0 || unpaidOrders.length > 0" class="packages-list">
        <!-- 未支付订单 -->
        <div v-if="unpaidOrders.length > 0" class="unpaid-orders-section">
          <h2 class="section-title">待支付订单</h2>
          <div v-for="order in unpaidOrders" :key="order.id" class="unpaid-order-card">
            <div class="order-header">
              <div class="order-info">
                <h3 class="order-name">{{ order.name }}</h3>
                <div class="order-number">订单号：{{ order.orderNumber }}</div>
              </div>
              <CountdownTimer 
                :initial-seconds="order.remainingSeconds"
                @timeout="handleOrderTimeout(order.id)"
              />
            </div>

            <div class="order-details">
              <div class="detail-item">
                <span class="label">套餐周期：</span>
                <span class="value">{{ order.period }}</span>
              </div>
              <div class="detail-item price-item">
                <span class="label">支付金额：</span>
                <span class="price">¥{{ order.price }}</span>
              </div>
            </div>

            <div class="order-features">
              <div v-for="(feature, index) in order.features.slice(0, 3)" :key="index" class="feature-tag">
                {{ feature }}
              </div>
              <div v-if="order.features.length > 3" class="feature-tag more">
                +{{ order.features.length - 3 }}
              </div>
            </div>

            <div class="order-actions">
              <button class="btn-cancel" @click="cancelOrder(order.id)">
                取消订单
              </button>
              <button class="btn-pay" @click="goToPayment(order.id)">
                立即支付
              </button>
            </div>
          </div>
        </div>

        <!-- 已支付套餐 -->
        <div v-if="packages.length > 0" class="paid-packages-section">
          <h2 v-if="unpaidOrders.length > 0" class="section-title">已购套餐</h2>
          <div v-for="pkg in packages" :key="pkg.id" class="package-card" :class="{ expired: pkg.status === 'expired' }">
            <!-- 套餐头部 -->
            <div class="package-header">
              <div class="package-info">
                <h2 class="package-name">{{ pkg.name }}</h2>
                <div class="package-meta">
                  <span class="package-price">¥{{ pkg.price }}</span>
                  <span class="package-period">/{{ pkg.period }}</span>
                </div>
              </div>
              <div class="package-status" :class="pkg.status">
                {{ pkg.status === 'active' ? '使用中' : '已过期' }}
              </div>
            </div>

            <!-- 有效期信息 -->
            <div class="package-validity">
              <div class="validity-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                <span>购买日期：{{ formatDate(pkg.purchaseDate) }}</span>
              </div>
              <div class="validity-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                <span>到期日期：{{ formatDate(pkg.expiryDate) }}</span>
                <span v-if="pkg.status === 'active'" class="remaining-days">
                  （剩余 {{ getRemainingDays(pkg.expiryDate) }} 天）
                </span>
              </div>
            </div>

            <!-- 使用情况 -->
            <div class="package-usage">
              <h3>使用情况</h3>
              <div class="usage-grid">
                <div class="usage-item">
                  <div class="usage-label">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                      <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                      <line x1="12" y1="22.08" x2="12" y2="12"></line>
                    </svg>
                    <span>设计生成</span>
                  </div>
                  <div class="usage-value">
                    <span class="used">{{ pkg.usage.designGeneration.used }}</span>
                    <span class="separator">/</span>
                    <span class="total">{{ pkg.usage.designGeneration.total }}</span>
                  </div>
                </div>

                <div class="usage-item">
                  <div class="usage-label">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                      <polyline points="9 22 9 12 15 12 15 22"></polyline>
                    </svg>
                    <span>家具摆放</span>
                  </div>
                  <div class="usage-value">
                    <span class="used">{{ pkg.usage.furniturePlacement.used }}</span>
                    <span class="separator">/</span>
                    <span class="total">{{ pkg.usage.furniturePlacement.total }}</span>
                  </div>
                </div>

                <div class="usage-item">
                  <div class="usage-label">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polygon points="23 7 16 12 23 17 23 7"></polygon>
                      <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
                    </svg>
                    <span>视频生成</span>
                  </div>
                  <div class="usage-value">
                    <span class="used">{{ pkg.usage.videoGeneration.used }}</span>
                    <span class="separator">/</span>
                    <span class="total">{{ pkg.usage.videoGeneration.total }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 套餐特权 -->
            <div class="package-features">
              <h3>套餐特权</h3>
              <div class="features-list">
                <div v-for="(feature, index) in pkg.features" :key="index" class="feature-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  <span>{{ feature }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <h3>暂无订单</h3>
        <p>您还没有购买任何服务套餐</p>
        <button class="purchase-btn" @click="goToPurchase">
          立即购买
        </button>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.packages-page {
  min-height: 100vh;
  background: linear-gradient(to bottom, 
    #f0f4ff 0%, 
    #e8f0ff 30%, 
    #f5f7fa 60%, 
    #f5f7fa 100%
  );
  padding-top: 70px;
}

.packages-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 3rem 2rem;
}

.packages-header {
  margin-bottom: 2.5rem;

  h1 {
    font-size: 2rem;
    font-weight: 700;
    color: #1a1a1a;
    margin-bottom: 0.5rem;
  }

  .subtitle {
    color: #718096;
    font-size: 1rem;
  }
}

// 加载状态
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;

  .spinner {
    width: 40px;
    height: 40px;
    border: 3px solid rgba(24, 144, 255, 0.2);
    border-top-color: #1890ff;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    margin-bottom: 1rem;
  }

  p {
    color: #718096;
    font-size: 0.9375rem;
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

// 套餐列表
.packages-list {
  display: grid;
  gap: 2.5rem;
}

// 未支付订单区域
.unpaid-orders-section,
.paid-packages-section {
  .section-title {
    font-size: 1.5rem;
    font-weight: 700;
    color: #1a1a1a;
    margin-bottom: 1.5rem;
    padding-left: 1rem;
    border-left: 4px solid #1890ff;
  }
}

.unpaid-order-card {
  background: linear-gradient(135deg, #fff5f5 0%, #ffffff 100%);
  border: 2px solid #ffccc7;
  border-radius: 1.5rem;
  padding: 2rem;
  box-shadow: 0 4px 12px rgba(255, 77, 79, 0.1);
  transition: all 0.3s ease;
  margin-bottom: 1rem;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(255, 77, 79, 0.15);
  }

  .order-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1.5rem;
    padding-bottom: 1rem;
    border-bottom: 2px solid rgba(255, 77, 79, 0.1);

    .order-info {
      flex: 1;

      .order-name {
        font-size: 1.25rem;
        font-weight: 700;
        color: #1a1a1a;
        margin-bottom: 0.5rem;
      }

      .order-number {
        font-size: 0.875rem;
        color: #999;
        font-family: 'Courier New', monospace;
      }
    }
  }

  .order-details {
    display: flex;
    gap: 2rem;
    margin-bottom: 1rem;

    .detail-item {
      display: flex;
      align-items: baseline;
      gap: 0.5rem;

      .label {
        color: #666;
        font-size: 0.9375rem;
      }

      .value {
        color: #2d3748;
        font-weight: 500;
      }

      &.price-item {
        .price {
          font-size: 1.5rem;
          font-weight: 700;
          background: linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
      }
    }
  }

  .order-features {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 1.5rem;

    .feature-tag {
      padding: 0.375rem 0.75rem;
      background: rgba(24, 144, 255, 0.08);
      border: 1px solid rgba(24, 144, 255, 0.2);
      border-radius: 1rem;
      font-size: 0.8125rem;
      color: #1890ff;

      &.more {
        background: rgba(0, 0, 0, 0.05);
        border-color: rgba(0, 0, 0, 0.1);
        color: #666;
      }
    }
  }

  .order-actions {
    display: flex;
    gap: 1rem;

    button {
      flex: 1;
      padding: 0.875rem;
      border: none;
      border-radius: 0.75rem;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;

      &.btn-cancel {
        background: #f5f5f5;
        color: #666;

        &:hover {
          background: #e8e8e8;
        }
      }

      &.btn-pay {
        background: linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%);
        color: white;
        box-shadow: 0 4px 12px rgba(255, 77, 79, 0.3);

        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(255, 77, 79, 0.4);
        }
      }
    }
  }
}

.package-card {
  background: white;
  border-radius: 1.5rem;
  padding: 2rem;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 15px 50px rgba(0, 0, 0, 0.12);
  }

  &.expired {
    opacity: 0.7;
    background: #f5f5f5;
  }
}

.package-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding-bottom: 1.5rem;
  border-bottom: 2px solid #f0f0f0;
  margin-bottom: 1.5rem;

  .package-info {
    .package-name {
      font-size: 1.5rem;
      font-weight: 700;
      color: #1a1a1a;
      margin-bottom: 0.5rem;
    }

    .package-meta {
      display: flex;
      align-items: baseline;
      gap: 0.25rem;

      .package-price {
        font-size: 1.75rem;
        font-weight: 700;
        color: #1890ff;
      }

      .package-period {
        font-size: 1rem;
        color: #718096;
      }
    }
  }

  .package-status {
    padding: 0.5rem 1rem;
    border-radius: 2rem;
    font-size: 0.875rem;
    font-weight: 600;

    &.active {
      background: rgba(82, 196, 26, 0.1);
      color: #52c41a;
    }

    &.expired {
      background: rgba(0, 0, 0, 0.05);
      color: #999;
    }
  }
}

.package-validity {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1.5rem;

  .validity-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #4a5568;
    font-size: 0.9375rem;

    svg {
      width: 18px;
      height: 18px;
      stroke: #718096;
      flex-shrink: 0;
    }

    .remaining-days {
      color: #1890ff;
      font-weight: 500;
    }
  }
}

.package-usage {
  margin-bottom: 1.5rem;

  h3 {
    font-size: 1rem;
    font-weight: 600;
    color: #2d3748;
    margin-bottom: 1rem;
  }

  .usage-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
  }

  .usage-item {
    background: #f7fafc;
    padding: 1rem;
    border-radius: 0.75rem;
    border: 2px solid #e2e8f0;

    .usage-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.75rem;
      color: #4a5568;
      font-size: 0.875rem;

      svg {
        width: 16px;
        height: 16px;
        stroke: #718096;
      }
    }

    .usage-value {
      display: flex;
      align-items: baseline;
      gap: 0.25rem;

      .used {
        font-size: 1.5rem;
        font-weight: 700;
        color: #1890ff;
      }

      .separator {
        font-size: 1rem;
        color: #cbd5e0;
      }

      .total {
        font-size: 1rem;
        color: #718096;
      }
    }
  }
}

.package-features {
  h3 {
    font-size: 1rem;
    font-weight: 600;
    color: #2d3748;
    margin-bottom: 1rem;
  }

  .features-list {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 0.75rem;
  }

  .feature-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #4a5568;
    font-size: 0.9375rem;

    svg {
      width: 16px;
      height: 16px;
      stroke: #52c41a;
      flex-shrink: 0;
    }
  }
}

// 空状态
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 1.5rem;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);

  svg {
    width: 64px;
    height: 64px;
    stroke: #cbd5e0;
    margin-bottom: 1.5rem;
  }

  h3 {
    font-size: 1.5rem;
    font-weight: 600;
    color: #2d3748;
    margin-bottom: 0.5rem;
  }

  p {
    color: #718096;
    font-size: 1rem;
    margin-bottom: 2rem;
  }

  .purchase-btn {
    padding: 0.875rem 2rem;
    background: linear-gradient(135deg, #1890ff 0%, #1890ff 100%);
    color: white;
    border: none;
    border-radius: 0.75rem;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 4px 12px rgba(24, 144, 255, 0.3);

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(24, 144, 255, 0.4);
    }
  }
}

// 响应式
@media (max-width: 768px) {
  .packages-container {
    padding: 2rem 1rem;
  }

  .package-card,
  .unpaid-order-card {
    padding: 1.5rem;
  }

  .package-header,
  .order-header {
    flex-direction: column;
    gap: 1rem;
  }

  .order-details {
    flex-direction: column;
    gap: 0.5rem;
  }

  .usage-grid,
  .features-list {
    grid-template-columns: 1fr;
  }
}
</style>

