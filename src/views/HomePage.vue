<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/userStore'
import NavigationBar from '@/components/NavigationBar.vue'
import { 
  HomeFilled, 
  Box, 
  VideoCamera, 
  User,
  Brush,
  MagicStick
} from '@element-plus/icons-vue'

const router = useRouter()
const userStore = useUserStore()
const showContent = ref(false)
const currentSlide = ref(0)
const currentCaseSlide = ref(0)
const selectedImage = ref<string | null>(null)
let autoPlayTimer: number | null = null
let caseAutoPlayTimer: number | null = null

const carouselSlides = [
  { id: 1, title: 'AI室内设计', subtitle: '智能设计，一键生成', description: '基于AI大模型，让设计更简单', features: ['智能识别', '风格多样', '快速生成', '高清渲染'], image: 'https://images.unsplash.com/photo-1600210492493-0946911123ea?w=1200&q=75&auto=format&fit=crop' },
  { id: 2, title: '温馨家居空间', subtitle: '打造舒适生活', description: '享受高品质居家体验', features: ['专业设计', '品质保证', '个性定制', '贴心服务'], image: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=1200&q=75&auto=format&fit=crop' },
  { id: 3, title: '现代简约风格', subtitle: '简约而不简单', description: '让生活更有品味', features: ['环保材料', '精致工艺', '舒适体验', '持久耐用'], image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&q=75&auto=format&fit=crop' }
]

const serviceCards = [
  { id: 1, title: '装修装饰', icon: HomeFilled, description: 'AI智能设计，一键生成专属方案', route: '/upload' },
  { id: 2, title: '软装布置', icon: Box, description: '虚拟摆放家具，实时预览效果', route: '/furniture-placement' },
  { id: 3, title: '短视频一键生成', icon: VideoCamera, description: '生成室内设计视频，全方位展示', route: '/video-generation' },
  { id: 4, title: '数字人服务', icon: User, description: '24小时数字人直播，智能互动', route: '/digital-human' }
]

const pricingPlans = [
  {
    id: 0,
    name: '体验版',
    price: 99,
    period: '次',
    features: [
      '所有核心功能',
      '5次设计生成',
      '5次家具摆放',
      '5次视频生成',
      '3次数字人服务',
      '在线客服'
    ]
  },
  {
    id: 1,
    name: '月度套餐',
    price: 1299,
    period: '月',
    features: [
      '所有核心功能',
      '200次设计生成',
      '200次家具摆放',
      '30次视频生成',
      '在线客服支持'
    ]
  },
  {
    id: 2,
    name: '季度套餐',
    price: 2699,
    period: '季度',
    features: [
      '所有核心功能',
      '700次设计生成',
      '700次家具摆放',
      '100次视频生成',
      '优先客服支持'
    ]
  },
  {
    id: 3,
    name: '年度套餐',
    price: 3999,
    period: '年',
    popular: true,
    features: [
      '所有核心功能',
      '无限次设计生成',
      '无限次家具摆放',
      '365次视频生成',
      '专属客户经理',
      '7×24小时服务'
    ]
  }
]

const aiSolutions = [
  {
    id: 1,
    title: '装修装饰',
    icon: HomeFilled,
    description: '智能生成设计方案，创造理想家居',
    features: ['上千种风格选择', 'AI精准推荐方案', '个性化定制设计'],
    color: '#e3f2fd',
    iconBg: '#42a5f5',
    route: '/upload'
  },
  {
    id: 2,
    title: '软装布置',
    icon: Box,
    description: '无需实物，瞬间预览家具摆放效果',
    features: ['实时预览效果', '多种家具选择', '一键智能摆放'],
    color: '#e8f5e9',
    iconBg: '#66bb6a',
    route: '/furniture-placement'
  },
  {
    id: 3,
    title: '宣传视频',
    icon: VideoCamera,
    description: '一键生成营销内容',
    features: ['3分钟快速生成', '1080P高清画质', '多角度展示'],
    color: '#fff3e0',
    iconBg: '#ff9800',
    route: '/video-generation'
  },
  {
    id: 4,
    title: 'AI数字人制作',
    icon: User,
    description: '数字人专业分享，让获客更加容易',
    features: ['99%真人相似度', '超高清4K画面', 'AI智能配音支持'],
    color: '#ffe4e9',
    iconBg: '#ff6b9d',
    badge: 'NEW',
    route: '/digital-human'
  }
]

const coreFeatures = [
  { id: 1, title: '装修装饰', icon: HomeFilled, description: 'AI智能设计，一键生成专属装修方案' },
  { id: 2, title: '软装布置', icon: Box, description: '虚拟摆放家具，实时预览装修效果' },
  { id: 3, title: '短视频一键生成', icon: VideoCamera, description: '生成室内设计视频，全方位展示效果' },
  { id: 4, title: 'AI数字人', icon: User, description: '数字人讲解方案，专业贴心服务' },
  { id: 5, title: '风格识别', icon: Brush, description: '智能识别户型，推荐最佳设计风格' },
  { id: 6, title: '高清渲染', icon: MagicStick, description: '4K高清渲染，呈现真实装修效果' }
]

const digitalHumanCases = [
  { id: 1, image: 'https://images.unsplash.com/photo-1600210492493-0946911123ea?w=300&q=70&auto=format&fit=crop', name: '现代简约', role: '客厅设计' },
  { id: 2, image: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=300&q=70&auto=format&fit=crop', name: '北欧风格', role: '卧室设计' },
  { id: 3, image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=300&q=70&auto=format&fit=crop', name: '轻奢风格', role: '餐厅设计' },
  { id: 4, image: 'https://images.unsplash.com/photo-1600210491892-03d54c0aaf87?w=300&q=70&auto=format&fit=crop', name: '中式风格', role: '书房设计' },
  { id: 5, image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=300&q=70&auto=format&fit=crop', name: '日式风格', role: '茶室设计' },
  { id: 6, image: 'https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=300&q=70&auto=format&fit=crop', name: '美式风格', role: '客厅设计' },
  { id: 7, image: 'https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=300&q=70&auto=format&fit=crop', name: '工业风格', role: 'LOFT设计' },
  { id: 8, image: 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=300&q=70&auto=format&fit=crop', name: '田园风格', role: '阳台设计' }
]

const applicationScenarios = [
  {
    id: 1,
    title: '新房装修',
    image: 'https://images.unsplash.com/photo-1600210492493-0946911123ea?w=300&q=70&auto=format&fit=crop',
    description: '为新房提供全方位设计方案，从户型分析到风格选择，AI智能生成多套方案供您选择'
  },
  {
    id: 2,
    title: '旧房改造',
    image: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=300&q=70&auto=format&fit=crop',
    description: '智能识别现有户型，提供改造建议，让老房焕发新生，提升居住品质和空间利用率'
  },
  {
    id: 3,
    title: '局部翻新',
    image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=300&q=70&auto=format&fit=crop',
    description: '针对客厅、卧室、厨房等单个空间，提供精准设计方案，快速实现局部空间升级'
  },
  {
    id: 4,
    title: '软装搭配',
    image: 'https://images.unsplash.com/photo-1600210491892-03d54c0aaf87?w=300&q=70&auto=format&fit=crop',
    description: '虚拟摆放家具、装饰品，实时预览搭配效果，找到最适合您的软装方案'
  },
  {
    id: 5,
    title: '商业空间',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=300&q=70&auto=format&fit=crop',
    description: '为办公室、店铺、餐厅等商业空间提供专业设计，打造独特品牌形象'
  }
]

const advantages = [
  { id: 1, value: '10000+', label: '设计案例' },
  { id: 2, value: '50+', label: '装修风格' },
  { id: 3, value: '3分钟', label: '快速生成' },
  { id: 4, value: '98%', label: '客户满意度' }
]

const comparisonData = [
  { id: 1, feature: '设计方案', ours: 'AI智能生成，多套方案可选', others: '单一方案，选择有限' },
  { id: 2, feature: '设计速度', ours: '3分钟快速生成，即时预览', others: '需要3-5天，等待时间长' },
  { id: 3, feature: '设计风格', ours: '50+种风格，满足各种需求', others: '风格单一，选择较少' },
  { id: 4, feature: '家具摆放', ours: '虚拟摆放，实时预览效果', others: '无虚拟预览功能' },
  { id: 5, feature: '视频展示', ours: '支持视频生成，全方位展示', others: '仅提供静态图片' },
  { id: 6, feature: '修改调整', ours: '随时修改，无限次调整', others: '修改次数有限，额外收费' },
  { id: 7, feature: '平台支持', ours: '支持PC端和移动端，随时随地使用', others: '仅支持单一平台' }
]

const customerReviews = [
  {
    id: 1,
    name: '张经理',
    role: '美居装饰公司',
    avatar: 'male',
    rating: 5,
    comment: '"用了美家美户的AI设计，签单率提升了40%，客户看到效果图当场就能决定，省了大量沟通时间。"'
  },
  {
    id: 2,
    name: '李总',
    role: '顾家家居河北保定经销商',
    avatar: 'male',
    rating: 5,
    comment: '"软装布置功能太实用了，客户可以直接看到家具摆放效果，成交率大幅提升，强烈推荐！"'
  },
  {
    id: 3,
    name: '王女士',
    role: '宜家家居河北保定经销商',
    avatar: 'female',
    rating: 5,
    comment: '"数字人视频功能让我们的营销更专业，客户信任度明显提高，投入产出比非常高。"'
  },
  {
    id: 4,
    name: '陈经理',
    role: '尚品宅配装饰',
    avatar: 'male',
    rating: 5,
    comment: '"AI设计速度快，效果好，客户满意度很高，帮我们节省了大量设计成本。"'
  },
  {
    id: 5,
    name: '刘总',
    role: '索菲亚家居河北石家庄经销商',
    avatar: 'male',
    rating: 5,
    comment: '"用美家美户做方案展示，客户体验感特别好，复购率提升了30%以上。"'
  },
  {
    id: 6,
    name: '赵女士',
    role: '欧派家居河北唐山经销商',
    avatar: 'female',
    rating: 5,
    comment: '"视频生成功能让我们的产品展示更生动，客户转化率明显提高，非常值得投资。"'
  }
]

onMounted(() => {
  setTimeout(() => { showContent.value = true }, 100)
  startAutoPlay()
  startCaseAutoPlay()
  setupScrollAnimation()
  preloadImages()
  setupLazyLoading()
})

onUnmounted(() => { 
  stopAutoPlay()
  stopCaseAutoPlay()
})

// 预加载首屏关键图片
const preloadImages = () => {
  // 预加载轮播图
  carouselSlides.forEach(slide => {
    const img = new Image()
    img.src = slide.image
  })
}

// 设置图片懒加载
const setupLazyLoading = () => {
  const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement
        const dataSrc = img.getAttribute('data-src')
        if (dataSrc) {
          img.src = dataSrc
          img.removeAttribute('data-src')
          imageObserver.unobserve(img)
        }
      }
    })
  }, {
    rootMargin: '50px' // 提前50px开始加载
  })

  // 观察所有带有 data-src 的图片
  setTimeout(() => {
    const lazyImages = document.querySelectorAll('img[data-src]')
    lazyImages.forEach(img => imageObserver.observe(img))
  }, 100)
}

const startAutoPlay = () => { autoPlayTimer = window.setInterval(() => { nextSlide() }, 5000) }
const stopAutoPlay = () => { if (autoPlayTimer) { clearInterval(autoPlayTimer); autoPlayTimer = null } }
const nextSlide = () => { currentSlide.value = (currentSlide.value + 1) % carouselSlides.length }
const prevSlide = () => { currentSlide.value = (currentSlide.value - 1 + carouselSlides.length) % carouselSlides.length }
const goToSlide = (index: number) => { currentSlide.value = index; stopAutoPlay(); startAutoPlay() }
const goToService = (route: string) => { 
  // 检查用户是否已登录
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录后再使用此功能')
    setTimeout(() => {
      router.push('/login')
    }, 1500)
    return
  }
  
  router.push(route) 
}

// 显示联系邮箱提示
const showContactEmail = () => {
  ElMessage.info('如有需要，请联系邮箱：meijiameihu@yatianshare.cn')
}

// 购买套餐
const showPaymentModal = ref(false)
const showPaymentQRCode = ref(false)
const selectedPlanId = ref<number | null>(null)
const selectedPaymentMethod = ref<'wechat' | 'alipay'>('wechat')

const handlePurchase = (planId: number) => {
  // 检查用户是否已登录
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录后再购买套餐')
    setTimeout(() => {
      router.push('/login')
    }, 1500)
    return
  }
  
  selectedPlanId.value = planId
  showPaymentModal.value = true
}

const closePaymentModal = () => {
  showPaymentModal.value = false
  showPaymentQRCode.value = false
  selectedPlanId.value = null
  selectedPaymentMethod.value = 'wechat'
}

const selectPaymentMethod = (method: 'wechat' | 'alipay') => {
  selectedPaymentMethod.value = method
}

const confirmPayment = () => {
  // 显示支付二维码页面
  showPaymentModal.value = false
  showPaymentQRCode.value = true
}

const completePayment = () => {
  // 模拟支付完成
  closePaymentModal()
  ElMessage.success('支付成功！')
  // 可以跳转到我的套餐页面
  setTimeout(() => {
    router.push('/my-packages')
  }, 1500)
}

// 获取选中的套餐信息
const selectedPlan = computed(() => {
  if (!selectedPlanId.value) return null
  return pricingPlans.find(plan => plan.id === selectedPlanId.value)
})

// 案例轮播控制
const casesPerView = 4 // 每次显示4个案例
const totalCaseSlides = Math.ceil(digitalHumanCases.length / casesPerView)

const startCaseAutoPlay = () => { 
  caseAutoPlayTimer = window.setInterval(() => { 
    nextCaseSlide() 
  }, 3000) 
}

const stopCaseAutoPlay = () => { 
  if (caseAutoPlayTimer) { 
    clearInterval(caseAutoPlayTimer)
    caseAutoPlayTimer = null 
  } 
}

const nextCaseSlide = () => { 
  currentCaseSlide.value = (currentCaseSlide.value + 1) % totalCaseSlides 
}

const prevCaseSlide = () => { 
  currentCaseSlide.value = (currentCaseSlide.value - 1 + totalCaseSlides) % totalCaseSlides 
}

const goToCaseSlide = (index: number) => { 
  currentCaseSlide.value = index
  stopCaseAutoPlay()
  startCaseAutoPlay() 
}

// 滚动动画
const setupScrollAnimation = () => {
  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('section-visible')
      }
    })
  }, observerOptions)

  // 观察所有section
  const sections = document.querySelectorAll('.animate-section')
  sections.forEach(section => observer.observe(section))
}

// 图片放大功能
const openImageModal = (imageUrl: string) => {
  selectedImage.value = imageUrl
}

const closeImageModal = () => {
  selectedImage.value = null
}

onMounted(() => {
  setTimeout(() => { showContent.value = true }, 100)
  startAutoPlay()
  setupScrollAnimation()
})
</script>

<template>
  <div class="home-page">
    <NavigationBar />
    <div class="hero-section" :class="{ 'hero--visible': showContent }">
      <div class="carousel-wrapper">
        <div class="carousel-slides" :style="{ transform: `translateX(-${currentSlide * 100}%)` }">
          <div v-for="slide in carouselSlides" :key="slide.id" class="carousel-slide">
            <img :src="slide.image" :alt="slide.title" class="slide-bg" />
          </div>
        </div>
        <button class="carousel-btn carousel-btn--prev" @click="prevSlide">‹</button>
        <button class="carousel-btn carousel-btn--next" @click="nextSlide">›</button>
        <div class="carousel-indicators">
          <button v-for="(slide, index) in carouselSlides" :key="slide.id" class="indicator" :class="{ 'indicator--active': currentSlide === index }" @click="goToSlide(index)"></button>
        </div>
      </div>
    </div>

    <!-- AI解决方案section -->
    <section class="ai-solutions-section animate-section">
      <div class="solutions-container">
        <h2 class="solutions-title">AI赋能家居装饰全生态</h2>
        <p class="solutions-subtitle">让锁客更加简单</p>
        <div class="solutions-grid">
          <div 
            v-for="solution in aiSolutions" 
            :key="solution.id" 
            class="solution-card"
            :style="{ background: solution.color }"
            @click="goToService(solution.route)"
          >
            <div v-if="solution.badge" class="solution-badge">{{ solution.badge }}</div>
            <div class="solution-icon" :style="{ background: solution.iconBg }">
              <el-icon :size="24" color="#fff">
                <component :is="solution.icon" />
              </el-icon>
            </div>
            <h3 class="solution-title">{{ solution.title }}</h3>
            <p class="solution-description">{{ solution.description }}</p>
            <ul class="solution-features">
              <li v-for="(feature, index) in solution.features" :key="index">
                <span class="feature-check">✓</span> {{ feature }}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <!-- 6大核心功能section -->
    <section class="core-features-section animate-section">
      <div class="features-container">
        <h2 class="features-title">6大核心功能，满足全场景需求</h2>
        <p class="features-subtitle">从设计方案到效果展示，一站式解决所有装修需求</p>
        <div class="features-grid">
          <div 
            v-for="feature in coreFeatures" 
            :key="feature.id" 
            class="feature-item"
          >
            <div class="feature-icon-box">
              <el-icon :size="28" color="#fff">
                <component :is="feature.icon" />
              </el-icon>
            </div>
            <h3 class="feature-item-title">{{ feature.title }}</h3>
            <p class="feature-item-description">{{ feature.description }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- 设计案例展示section -->
    <section class="digital-cases-section animate-section">
      <div class="cases-container">
        <h2 class="cases-title">精选设计案例</h2>
        <p class="cases-subtitle">看看我们为客户打造的精美家居设计作品</p>
        
        <div class="cases-carousel-wrapper">
          <div class="cases-carousel-container">
            <div 
              class="cases-carousel-track" 
              :style="{ transform: `translateX(-${currentCaseSlide * 100}%)` }"
            >
              <div 
                v-for="slideIndex in totalCaseSlides" 
                :key="slideIndex" 
                class="cases-slide"
              >
                <div class="cases-slide-grid">
                  <div 
                    v-for="caseItem in digitalHumanCases.slice((slideIndex - 1) * casesPerView, slideIndex * casesPerView)" 
                    :key="caseItem.id" 
                    class="case-card"
                    @click="openImageModal(caseItem.image)"
                  >
                    <div class="case-image">
                      <img :data-src="caseItem.image" :alt="caseItem.name" loading="lazy" />
                      <div class="image-overlay"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- 轮播控制按钮 -->
          <button class="case-carousel-btn case-carousel-btn--prev" @click="prevCaseSlide">‹</button>
          <button class="case-carousel-btn case-carousel-btn--next" @click="nextCaseSlide">›</button>
          
          <!-- 轮播指示器 -->
          <div class="case-carousel-indicators">
            <button 
              v-for="(slide, index) in totalCaseSlides" 
              :key="index" 
              class="case-indicator" 
              :class="{ 'case-indicator--active': currentCaseSlide === index }" 
              @click="goToCaseSlide(index)"
            ></button>
          </div>
        </div>
      </div>
    </section>

    <!-- 图片放大模态框 -->
    <div v-if="selectedImage" class="image-modal" @click="closeImageModal">
      <div class="modal-content">
        <button class="modal-close" @click="closeImageModal">✕</button>
        <img :src="selectedImage" alt="放大图片" class="modal-image" />
      </div>
    </div>

    <!-- 支付方式选择模态框 -->
    <div v-if="showPaymentModal" class="payment-modal" @click="closePaymentModal">
      <div class="payment-modal-content" @click.stop>
        <button class="payment-modal-close" @click="closePaymentModal">✕</button>
        <h2 class="payment-modal-title">选择支付方式</h2>
        
        <div class="payment-methods-modal">
          <div 
            class="payment-method-item"
            :class="{ active: selectedPaymentMethod === 'wechat' }"
            @click="selectPaymentMethod('wechat')"
          >
            <div class="payment-method-icon">
              <svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
                <path d="M664.250054 368.541681c10.015098 0 19.892049 0.732687 29.67281 1.795902-26.647917-122.810047-159.358451-214.077703-310.826188-214.077703-169.353083 0-308.085774 114.232694-308.085774 259.274068 0 83.708494 46.165436 152.460344 123.281791 205.78483l-30.80868 91.730191 107.688651-53.455469c38.558178 7.53665 69.459978 15.308661 107.924012 15.308661 9.66308 0 19.230993-0.470721 28.752858-1.225921-6.025227-20.36584-9.521864-41.723264-9.521864-63.862493C402.328693 476.632491 517.908058 368.541681 664.250054 368.541681zM498.62897 285.87389c23.200398 0 38.557154 15.120372 38.557154 38.061874 0 22.846334-15.356756 38.156018-38.557154 38.156018-23.107277 0-46.260603-15.309684-46.260603-38.156018C452.368366 300.994262 475.522716 285.87389 498.62897 285.87389zM283.016307 362.090758c-23.107277 0-46.402843-15.309684-46.402843-38.156018 0-22.941502 23.295566-38.061874 46.402843-38.061874 23.081695 0 38.46301 15.120372 38.46301 38.061874C321.479317 346.782098 306.098002 362.090758 283.016307 362.090758zM945.448458 606.151333c0-121.888048-123.258255-221.236753-261.683954-221.236753-146.57838 0-262.015505 99.348706-262.015505 221.236753 0 122.06508 115.437126 221.200938 262.015505 221.200938 30.66644 0 61.617359-7.609305 92.423993-15.262612l84.513836 45.786813-23.178909-76.17082C899.379213 735.776599 945.448458 674.90216 945.448458 606.151333zM598.803483 567.994292c-15.332197 0-30.807656-15.096836-30.807656-30.501688 0-15.190981 15.47546-30.477129 30.807656-30.477129 23.295566 0 38.558178 15.286148 38.558178 30.477129C637.361661 552.897456 622.099049 567.994292 598.803483 567.994292zM768.25071 567.994292c-15.213493 0-30.594809-15.096836-30.594809-30.501688 0-15.190981 15.381315-30.477129 30.594809-30.477129 23.107277 0 38.558178 15.286148 38.558178 30.477129C806.808888 552.897456 791.357987 567.994292 768.25071 567.994292z" fill="#00C800"/>
              </svg>
            </div>
            <div class="payment-method-name">微信支付</div>
            <div class="payment-method-arrow">›</div>
          </div>

          <div 
            class="payment-method-item"
            :class="{ active: selectedPaymentMethod === 'alipay' }"
            @click="selectPaymentMethod('alipay')"
          >
            <div class="payment-method-icon">
              <img src="/images/alipay-icon.png" alt="支付宝" />
            </div>
            <div class="payment-method-name">支付宝支付</div>
            <div class="payment-method-arrow">›</div>
          </div>
        </div>

        <button class="payment-confirm-btn" @click="confirmPayment">
          确认支付
        </button>
      </div>
    </div>

    <!-- 支付二维码模态框 -->
    <div v-if="showPaymentQRCode" class="payment-modal" @click="closePaymentModal">
      <div class="payment-qrcode-content" @click.stop>
        <button class="payment-modal-close" @click="closePaymentModal">✕</button>
        
        <h2 class="payment-amount-title">支付金额</h2>
        <div class="payment-amount">¥{{ selectedPlan?.price }}</div>
        
        <div class="qrcode-divider"></div>
        
        <div class="qrcode-display">
          <div class="qrcode-box">
            <div class="qrcode-placeholder">
              <div class="qr-icon-large">
                <svg v-if="selectedPaymentMethod === 'wechat'" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
                  <path d="M664.250054 368.541681c10.015098 0 19.892049 0.732687 29.67281 1.795902-26.647917-122.810047-159.358451-214.077703-310.826188-214.077703-169.353083 0-308.085774 114.232694-308.085774 259.274068 0 83.708494 46.165436 152.460344 123.281791 205.78483l-30.80868 91.730191 107.688651-53.455469c38.558178 7.53665 69.459978 15.308661 107.924012 15.308661 9.66308 0 19.230993-0.470721 28.752858-1.225921-6.025227-20.36584-9.521864-41.723264-9.521864-63.862493C402.328693 476.632491 517.908058 368.541681 664.250054 368.541681zM498.62897 285.87389c23.200398 0 38.557154 15.120372 38.557154 38.061874 0 22.846334-15.356756 38.156018-38.557154 38.156018-23.107277 0-46.260603-15.309684-46.260603-38.156018C452.368366 300.994262 475.522716 285.87389 498.62897 285.87389zM283.016307 362.090758c-23.107277 0-46.402843-15.309684-46.402843-38.156018 0-22.941502 23.295566-38.061874 46.402843-38.061874 23.081695 0 38.46301 15.120372 38.46301 38.061874C321.479317 346.782098 306.098002 362.090758 283.016307 362.090758zM945.448458 606.151333c0-121.888048-123.258255-221.236753-261.683954-221.236753-146.57838 0-262.015505 99.348706-262.015505 221.236753 0 122.06508 115.437126 221.200938 262.015505 221.200938 30.66644 0 61.617359-7.609305 92.423993-15.262612l84.513836 45.786813-23.178909-76.17082C899.379213 735.776599 945.448458 674.90216 945.448458 606.151333zM598.803483 567.994292c-15.332197 0-30.807656-15.096836-30.807656-30.501688 0-15.190981 15.47546-30.477129 30.807656-30.477129 23.295566 0 38.558178 15.286148 38.558178 30.477129C637.361661 552.897456 622.099049 567.994292 598.803483 567.994292zM768.25071 567.994292c-15.213493 0-30.594809-15.096836-30.594809-30.501688 0-15.190981 15.381315-30.477129 30.594809-30.477129 23.107277 0 38.558178 15.286148 38.558178 30.477129C806.808888 552.897456 791.357987 567.994292 768.25071 567.994292z" fill="#00C800"/>
                </svg>
                <img v-else src="/images/alipay-icon.png" alt="支付宝" />
              </div>
            </div>
          </div>
        </div>
        
        <p class="qrcode-hint">
          {{ selectedPaymentMethod === 'wechat' ? '请使用微信扫一扫' : '请使用支付宝扫一扫' }}
        </p>
        
        <button class="payment-complete-btn" @click="completePayment">
          我已完成支付
        </button>
      </div>
    </div>

    <!-- 应用场景section -->
    <section class="scenarios-section animate-section">
      <div class="scenarios-container">
        <h2 class="scenarios-title">广泛应用场景，满足各类装修需求</h2>
        <p class="scenarios-subtitle">从新房装修到旧房改造，AI智能设计助力打造理想家居</p>
        <div class="scenarios-grid">
          <div 
            v-for="scenario in applicationScenarios" 
            :key="scenario.id" 
            class="scenario-card"
          >
            <div class="scenario-image">
              <img :data-src="scenario.image" :alt="scenario.title" loading="lazy" />
              <div class="scenario-overlay"></div>
            </div>
            <div class="scenario-content">
              <h3 class="scenario-title">{{ scenario.title }}</h3>
              <p class="scenario-description">{{ scenario.description }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 为什么选择我们section -->
    <section class="why-choose-section animate-section">
      <div class="why-choose-container">
        <h2 class="why-choose-title">为什么选择美家美户?</h2>
        <p class="why-choose-subtitle">专业AI家居设计技术，为您提供优质服务</p>
        
        <!-- 优势数据 -->
        <div class="advantages-grid">
          <div 
            v-for="advantage in advantages" 
            :key="advantage.id" 
            class="advantage-item"
          >
            <div class="advantage-value">{{ advantage.value }}</div>
            <div class="advantage-label">{{ advantage.label }}</div>
          </div>
        </div>

        <!-- 对比表格 -->
        <div class="comparison-table">
          <div class="table-header">
            <div class="header-cell feature-col">对比项目</div>
            <div class="header-cell ours-col">美家美户</div>
            <div class="header-cell others-col">传统设计</div>
          </div>
          <div class="table-body">
            <div 
              v-for="row in comparisonData" 
              :key="row.id" 
              class="table-row"
            >
              <div class="table-cell feature-col">{{ row.feature }}</div>
              <div class="table-cell ours-col">
                <span class="check-icon-blue">✓</span> {{ row.ours }}
              </div>
              <div class="table-cell others-col">
                <span class="cross-icon">✗</span> {{ row.others }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 客户真实评价section -->
    <section class="reviews-section animate-section">
      <div class="reviews-container">
        <h2 class="reviews-title">真实客户评价</h2>
        <p class="reviews-subtitle">看看装修公司和家具商的使用体验，让您对我们的服务更放心</p>
        <div class="reviews-grid">
          <div 
            v-for="review in customerReviews" 
            :key="review.id" 
            class="review-card"
          >
            <div class="review-header">
              <div class="reviewer-avatar" :class="review.avatar">
                <el-icon :size="28" color="#fff">
                  <User />
                </el-icon>
              </div>
              <div class="reviewer-info">
                <h4 class="reviewer-name">{{ review.name }}</h4>
                <p class="reviewer-role">{{ review.role }}</p>
              </div>
            </div>
            <div class="review-rating">
              <span v-for="star in review.rating" :key="star" class="star">⭐</span>
            </div>
            <p class="review-comment">{{ review.comment }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- 页脚section -->
    <footer class="footer-section">
      <div class="footer-container">
        <div class="footer-content">
          <!-- 左侧品牌信息 -->
          <div class="footer-brand">
            <div class="brand-logo">
              <img src="/images/bottom.jpg" alt="美家美户" class="footer-logo-image" />
            </div>
            <p class="brand-slogan">您的省钱专家</p>
          </div>

          <!-- 右侧导航链接 -->
          <div class="footer-links">
            <div class="link-column">
              <h4 class="column-title">核心功能</h4>
              <ul class="link-list">
                <li><a @click.prevent="goToService('/upload')" class="link-active">装修装饰</a></li>
                <li><a @click.prevent="goToService('/furniture-placement')" class="link-active">软装布置</a></li>
                <li><a @click.prevent="goToService('/video-generation')" class="link-active">宣传视频</a></li>
                <li><a @click.prevent="goToService('/digital-human')" class="link-active">AI数字人</a></li>
              </ul>
            </div>
            <div class="link-column">
              <h4 class="column-title">关于我们</h4>
              <ul class="link-list">
                <li><a href="/about" class="link-active">公司介绍</a></li>
                <li><a href="/partner" class="link-active">加入我们</a></li>
              </ul>
            </div>
            <div class="link-column">
              <h4 class="column-title">帮助中心</h4>
              <ul class="link-list">
                <li><span class="link-text" @click="showContactEmail">使用指南</span></li>
                <li><span class="link-text" @click="showContactEmail">常见问题</span></li>
                <li><span class="link-text" @click="showContactEmail">意见反馈</span></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<style lang="scss" scoped>
// 滚动动画
.animate-section {
  opacity: 0;
  transform: translateY(50px);
  transition: opacity 0.8s ease-out, transform 0.8s ease-out;
  
  &.section-visible {
    opacity: 1;
    transform: translateY(0);
  }
}

.home-page { min-height: 100vh; background: linear-gradient(180deg, #e8f4ff 0%, #f5f9ff 100%); padding-top: 70px; }
.hero-section { position: relative; width: 100%; opacity: 0; transform: translateY(20px); transition: all 0.6s ease; &.hero--visible { opacity: 1; transform: translateY(0); } }
.carousel-wrapper { position: relative; width: 100%; height: 480px; overflow: hidden; }
.carousel-slides { display: flex; height: 100%; transition: transform 0.5s ease-in-out; }
.carousel-slide { min-width: 100%; height: 100%; position: relative; display: flex; align-items: center; justify-content: center; }
.slide-bg { position: absolute; width: 100%; height: 100%; object-fit: cover; z-index: 1; background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%); }
.carousel-btn { 
  position: absolute; 
  top: 50%; 
  transform: translateY(-50%); 
  width: 48px; 
  height: 48px; 
  background: transparent; 
  border: none; 
  font-size: 2.5rem; 
  color: white; 
  cursor: pointer; 
  transition: all 0.3s ease; 
  z-index: 10; 
  display: flex; 
  align-items: center; 
  justify-content: center; 
  line-height: 1; 
  padding: 0; 
  font-weight: 300; 
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  
  &:hover { 
    color: rgba(255, 255, 255, 0.8); 
    transform: translateY(-50%) scale(1.2); 
    text-shadow: 0 4px 12px rgba(0, 0, 0, 0.5); 
  } 
  
  &--prev { left: 1.5rem; } 
  &--next { right: 1.5rem; } 
}
.carousel-indicators { position: absolute; bottom: 30px; left: 50%; transform: translateX(-50%); display: flex; gap: 0.6rem; z-index: 10; }
.indicator { width: 10px; height: 10px; border-radius: 50%; background: rgba(255, 255, 255, 0.5); border: none; cursor: pointer; transition: all 0.3s ease; &:hover { background: rgba(255, 255, 255, 0.8); } &--active { width: 30px; border-radius: 5px; background: white; } }

// 套餐定价section
.pricing-section { padding: 3rem 2rem; background: white; }
.pricing-container { max-width: 1400px; margin: 0 auto; text-align: center; }
.pricing-title { font-size: 1.8rem; font-weight: 700; color: #333; margin-bottom: 0.5rem; }
.pricing-subtitle { font-size: 0.95rem; color: #666; margin-bottom: 2rem; }
.pricing-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.5rem; align-items: stretch; }
.pricing-card { 
  position: relative; 
  background: #FFFFFF; 
  padding: 2rem 1.5rem; 
  border-radius: 24px; 
  border: 2px solid #e0e0e0; 
  transition: all 0.3s ease; 
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08); 
  display: flex; 
  flex-direction: column;
  min-height: 468px;
  
  &:hover { 
    transform: translateY(-6px); 
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12); 
    border-color: #2196f3; 
  } 
  
  &--popular { 
    border: 2px solid #2196f3; 
    box-shadow: 0 4px 20px rgba(33, 150, 243, 0.25); 
  } 
}
.popular-badge { position: absolute; top: -10px; left: 50%; transform: translateX(-50%); background: linear-gradient(135deg, #ff6b6b 0%, #ff8e53 100%); color: white; padding: 0.2rem 0.7rem; border-radius: 12px; font-size: 0.65rem; font-weight: 600; box-shadow: 0 2px 8px rgba(255, 107, 107, 0.3); white-space: nowrap; }
.plan-name { font-size: 1rem; font-weight: 600; color: #333; margin-bottom: 0.8rem; }
.plan-price { margin-bottom: 1.2rem; }
.price-symbol { font-size: 0.9rem; color: #2196f3; font-weight: 600; vertical-align: top; }
.price-amount { font-size: 1.8rem; font-weight: 700; color: #2196f3; margin: 0 0.2rem; }
.price-period { font-size: 0.8rem; color: #666; }
.plan-features { list-style: none; padding: 0; margin: 0 0 1.2rem 0; text-align: left; flex: 1; li { padding: 0.4rem 0; color: #555; font-size: 0.8rem; display: flex; align-items: flex-start; gap: 0.4rem; border-bottom: 1px solid #f5f5f5; &:last-child { border-bottom: none; } } }
.feature-icon { color: #2196f3; font-weight: bold; font-size: 0.9rem; flex-shrink: 0; margin-top: 0.1rem; }
.plan-button { width: 100%; padding: 0.6rem 1rem; background: linear-gradient(135deg, #42a5f5 0%, #2196f3 100%); color: white; border: none; border-radius: 8px; font-size: 0.9rem; font-weight: 600; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 2px 8px rgba(33, 150, 243, 0.25); margin-top: auto; &:hover { background: linear-gradient(135deg, #2196f3 0%, #1976d2 100%); transform: translateY(-2px); box-shadow: 0 4px 12px rgba(33, 150, 243, 0.35); } &--popular { background: linear-gradient(135deg, #ff6b6b 0%, #ff8e53 100%); box-shadow: 0 2px 8px rgba(255, 107, 107, 0.3); &:hover { background: linear-gradient(135deg, #ff8e53 0%, #ff6b6b 100%); box-shadow: 0 4px 12px rgba(255, 107, 107, 0.4); } } }

// AI解决方案section
.ai-solutions-section { padding: 3rem 2rem; background: white; }
.solutions-container { max-width: 1400px; margin: 0 auto; }
.solutions-title { font-size: 1.8rem; font-weight: 700; color: #333; text-align: center; margin-bottom: 0.5rem; }
.solutions-subtitle { font-size: 0.95rem; color: #666; text-align: center; margin-bottom: 2.5rem; }
.solutions-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.2rem; }
.solution-card { position: relative; padding: 1.5rem 1.2rem; border-radius: 16px; transition: all 0.3s ease; box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06); cursor: pointer; &:hover { transform: translateY(-8px); box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12); .solution-icon { transform: scale(1.1) rotate(5deg); } } }
.solution-badge { position: absolute; top: 12px; right: 12px; background: linear-gradient(135deg, #ff6b6b 0%, #ff8e53 100%); color: white; padding: 0.25rem 0.7rem; border-radius: 12px; font-size: 0.7rem; font-weight: 600; box-shadow: 0 2px 8px rgba(255, 107, 107, 0.3); }
.solution-icon { width: 45px; height: 45px; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-bottom: 0.8rem; transition: all 0.3s ease; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); }
.solution-title { font-size: 1.1rem; font-weight: 600; color: #333; margin-bottom: 0.4rem; }
.solution-description { font-size: 0.85rem; color: #666; margin-bottom: 1rem; line-height: 1.5; }
.solution-features { list-style: none; padding: 0; margin: 0; li { padding: 0.4rem 0; color: #555; font-size: 0.8rem; display: flex; align-items: center; gap: 0.4rem; } }
.feature-check { color: #2196f3; font-weight: bold; font-size: 0.9rem; }

// 6大核心功能section
.core-features-section { padding: 3rem 2rem; background: linear-gradient(135deg, #42a5f5 0%, #2196f3 50%, #1976d2 100%); }
.features-container { max-width: 1400px; margin: 0 auto; }
.features-title { font-size: 1.8rem; font-weight: 700; color: white; text-align: center; margin-bottom: 0.5rem; }
.features-subtitle { font-size: 0.95rem; color: rgba(255, 255, 255, 0.9); text-align: center; margin-bottom: 2.5rem; }
.features-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; }
.feature-item { background: white; padding: 1.5rem 1.2rem; border-radius: 16px; text-align: center; transition: all 0.3s ease; box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08); &:hover { transform: translateY(-8px); box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15); .feature-icon-box { transform: scale(1.1); } } }
.feature-icon-box { width: 50px; height: 50px; margin: 0 auto 1rem; background: linear-gradient(135deg, #42a5f5 0%, #2196f3 100%); border-radius: 12px; display: flex; align-items: center; justify-content: center; transition: all 0.3s ease; box-shadow: 0 2px 8px rgba(33, 150, 243, 0.25); }
.feature-item-title { font-size: 1.1rem; font-weight: 600; color: #333; margin-bottom: 0.5rem; }
.feature-item-description { font-size: 0.85rem; color: #666; line-height: 1.5; }

// 数字人制作案例section
.digital-cases-section { padding: 3rem 2rem; background: #f8f9fa; }
.cases-container { max-width: 1400px; margin: 0 auto; text-align: center; }
.cases-title { font-size: 1.8rem; font-weight: 700; color: #333; margin-bottom: 0.5rem; }
.cases-subtitle { font-size: 0.95rem; color: #666; margin-bottom: 2rem; }
.cases-carousel-wrapper { position: relative; padding: 0 3.5rem; }
.cases-carousel-container { overflow: hidden; border-radius: 16px; }
.cases-carousel-track { display: flex; transition: transform 0.5s ease-in-out; }
.cases-slide { min-width: 100%; }
.cases-slide-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.2rem; padding: 0 0.5rem; }
.case-card { position: relative; border-radius: 16px; overflow: hidden; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08); &:hover { transform: translateY(-6px); box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12); .image-overlay { opacity: 1; } } }
.case-image { width: 100%; height: 320px; position: relative; img { width: 100%; height: 100%; object-fit: cover; background: linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%); transition: opacity 0.3s ease; &[data-src] { opacity: 0; } &:not([data-src]) { opacity: 1; } } }
.image-overlay { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(33, 150, 243, 0.15); opacity: 0; transition: all 0.3s ease; }
.case-carousel-btn { 
  position: absolute; 
  top: 50%; 
  transform: translateY(-50%); 
  width: 48px; 
  height: 48px; 
  background: transparent; 
  border: none; 
  font-size: 2.5rem; 
  color: #2196f3; 
  cursor: pointer; 
  transition: all 0.3s ease; 
  z-index: 10; 
  display: flex; 
  align-items: center; 
  justify-content: center; 
  line-height: 1; 
  padding: 0; 
  font-weight: 300; 
  text-shadow: 0 2px 8px rgba(33, 150, 243, 0.5);
  
  &:hover { 
    color: rgba(33, 150, 243, 0.7); 
    transform: translateY(-50%) scale(1.2); 
    text-shadow: 0 4px 12px rgba(33, 150, 243, 0.7); 
  } 
  
  &--prev { left: 0; } 
  &--next { right: 0; } 
}
.case-carousel-indicators { display: flex; justify-content: center; gap: 0.6rem; margin-top: 1.5rem; }
.case-indicator { width: 10px; height: 10px; border-radius: 50%; background: #bdc3c7; border: none; cursor: pointer; transition: all 0.3s ease; &:hover { background: #95a5a6; } &--active { width: 30px; border-radius: 5px; background: #2196f3; } }

// 图片放大模态框
.image-modal { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.9); display: flex; align-items: center; justify-content: center; z-index: 9999; animation: fadeIn 0.3s ease; }
.modal-content { position: relative; max-width: 90vw; max-height: 90vh; }
.modal-close { position: absolute; top: -40px; right: 0; background: transparent; border: none; color: white; font-size: 2rem; cursor: pointer; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; transition: all 0.3s ease; &:hover { transform: scale(1.2); } }
.modal-image { max-width: 90vw; max-height: 90vh; object-fit: contain; border-radius: 8px; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5); }

// 支付方式选择模态框
.payment-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  animation: fadeIn 0.3s ease;
}

.payment-modal-content {
  position: relative;
  background: white;
  border-radius: 20px;
  padding: 2.5rem 2rem;
  width: 90%;
  max-width: 480px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  animation: slideUp 0.3s ease;
}

.payment-modal-close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: transparent;
  border: none;
  color: #999;
  font-size: 1.8rem;
  cursor: pointer;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  border-radius: 50%;
  
  &:hover {
    background: #f5f5f5;
    color: #333;
  }
}

.payment-modal-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #333;
  text-align: center;
  margin-bottom: 2rem;
}

.payment-methods-modal {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
}

.payment-method-item {
  display: flex;
  align-items: center;
  padding: 1.2rem 1.5rem;
  background: #f8f9fa;
  border: 2px solid #e8e8e8;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: #f0f4ff;
    border-color: #2196f3;
  }
  
  &.active {
    background: #e3f2fd;
    border-color: #2196f3;
    box-shadow: 0 2px 8px rgba(33, 150, 243, 0.2);
  }
}

.payment-method-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 1rem;
  flex-shrink: 0;
  
  svg {
    width: 100%;
    height: 100%;
  }
  
  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
}

.payment-method-name {
  flex: 1;
  font-size: 1.1rem;
  font-weight: 600;
  color: #333;
}

.payment-method-arrow {
  font-size: 1.5rem;
  color: #2196f3;
  font-weight: 300;
}

.payment-confirm-btn {
  width: 100%;
  padding: 1rem;
  background: linear-gradient(135deg, #42a5f5 0%, #2196f3 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(33, 150, 243, 0.3);
  
  &:hover {
    background: linear-gradient(135deg, #2196f3 0%, #1976d2 100%);
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(33, 150, 243, 0.4);
  }
  
  &:active {
    transform: translateY(0);
  }
}

// 支付二维码页面
.payment-qrcode-content {
  position: relative;
  background: white;
  border-radius: 20px;
  padding: 2.5rem 2rem;
  width: 90%;
  max-width: 480px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  animation: slideUp 0.3s ease;
  text-align: center;
}

.payment-amount-title {
  font-size: 1.2rem;
  font-weight: 600;
  color: #666;
  margin-bottom: 0.8rem;
}

.payment-amount {
  font-size: 3rem;
  font-weight: 700;
  color: #333;
  margin-bottom: 1.5rem;
}

.qrcode-divider {
  width: 100%;
  height: 1px;
  background: linear-gradient(to right, transparent, #e0e0e0, transparent);
  margin-bottom: 2rem;
}

.qrcode-display {
  display: flex;
  justify-content: center;
  margin-bottom: 1.5rem;
}

.qrcode-box {
  width: 280px;
  height: 280px;
  background: white;
  border: 2px solid #e8e8e8;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.qrcode-placeholder {
  width: 240px;
  height: 240px;
  background: #f5f5f5;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.qr-icon-large {
  width: 120px;
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  svg {
    width: 100%;
    height: 100%;
  }
  
  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
}

.qrcode-hint {
  font-size: 1rem;
  color: #999;
  margin-bottom: 2rem;
}

.payment-complete-btn {
  width: 100%;
  padding: 1rem;
  background: linear-gradient(135deg, #00C800 0%, #00A000 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 200, 0, 0.3);
  
  &:hover {
    background: linear-gradient(135deg, #00A000 0%, #008000 100%);
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(0, 200, 0, 0.4);
  }
  
  &:active {
    transform: translateY(0);
  }
}

@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// 视频生成功能section
.video-generation-section { padding: 3rem 2rem; background: white; }
.video-container { max-width: 1400px; margin: 0 auto; text-align: center; }
.video-title { font-size: 1.8rem; font-weight: 700; color: #333; margin-bottom: 0.5rem; }
.video-subtitle { font-size: 0.95rem; color: #666; margin-bottom: 2.5rem; }
.video-content { }
.video-features { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; margin-bottom: 2rem; }
.video-feature-card { background: linear-gradient(135deg, #f5f9ff 0%, #e8f4ff 100%); padding: 2rem 1.5rem; border-radius: 16px; text-align: center; transition: all 0.3s ease; box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06); &:hover { transform: translateY(-8px); box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12); .video-feature-icon { transform: scale(1.1) rotate(5deg); } } }
.video-feature-icon { width: 60px; height: 60px; margin: 0 auto 1rem; background: linear-gradient(135deg, #42a5f5 0%, #2196f3 100%); border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 1.8rem; transition: all 0.3s ease; box-shadow: 0 2px 8px rgba(33, 150, 243, 0.25); }
.video-feature-title { font-size: 1.2rem; font-weight: 600; color: #333; margin-bottom: 0.5rem; }
.video-feature-desc { font-size: 0.9rem; color: #666; margin-bottom: 1.2rem; line-height: 1.5; }
.video-feature-list { list-style: none; padding: 0; margin: 0; text-align: left; li { padding: 0.5rem 0; color: #555; font-size: 0.85rem; display: flex; align-items: center; gap: 0.5rem; } }
.video-cta { margin-top: 2rem; }
.video-start-btn { padding: 0.8rem 2.5rem; background: linear-gradient(135deg, #42a5f5 0%, #2196f3 100%); color: white; border: none; border-radius: 24px; font-size: 1rem; font-weight: 600; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 2px 12px rgba(33, 150, 243, 0.25); &:hover { background: linear-gradient(135deg, #2196f3 0%, #1976d2 100%); transform: translateY(-2px); box-shadow: 0 4px 16px rgba(33, 150, 243, 0.35); } }

// 数字人制作流程section
.workflow-section { padding: 3rem 2rem; background: linear-gradient(135deg, #42a5f5 0%, #2196f3 50%, #1976d2 100%); }
.workflow-container { max-width: 1400px; margin: 0 auto; text-align: center; }
.workflow-title { font-size: 1.8rem; font-weight: 700; color: white; margin-bottom: 0.5rem; }
.workflow-subtitle { font-size: 0.95rem; color: rgba(255, 255, 255, 0.9); margin-bottom: 2.5rem; }
.workflow-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; margin-bottom: 2rem; }
.workflow-card { position: relative; background: white; padding: 2rem 1.5rem; border-radius: 16px; transition: all 0.3s ease; box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08); &:hover { transform: translateY(-8px); box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15); .workflow-icon { transform: scale(1.1); } } }
.workflow-number { position: absolute; top: 15px; left: 15px; font-size: 1rem; font-weight: 700; color: #2196f3; background: rgba(33, 150, 243, 0.1); width: 38px; height: 38px; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
.workflow-icon { width: 60px; height: 60px; margin: 0 auto 1rem; background: linear-gradient(135deg, #42a5f5 0%, #2196f3 100%); border-radius: 16px; display: flex; align-items: center; justify-content: center; transition: all 0.3s ease; box-shadow: 0 2px 8px rgba(33, 150, 243, 0.25); }
.workflow-emoji { font-size: 1.8rem; filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1)); }
.workflow-card-title { font-size: 1.2rem; font-weight: 600; color: #333; margin-bottom: 0.5rem; }
.workflow-card-desc { font-size: 0.9rem; color: #666; margin-bottom: 1.2rem; line-height: 1.5; }
.workflow-features { list-style: none; padding: 0; margin: 0; text-align: left; li { padding: 0.5rem 0; color: #555; font-size: 0.85rem; display: flex; align-items: center; gap: 0.5rem; } }
.check-mark { color: #2196f3; font-weight: bold; font-size: 1rem; }
.workflow-start-btn { padding: 0.8rem 2.5rem; background: white; color: #2196f3; border: none; border-radius: 24px; font-size: 1rem; font-weight: 600; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 2px 12px rgba(0, 0, 0, 0.12); &:hover { background: #f5f5f5; transform: translateY(-2px); box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15); } }

// 应用场景section
.scenarios-section { padding: 3rem 2rem; background: #f5f5f5; }
.scenarios-container { max-width: 1400px; margin: 0 auto; text-align: center; }
.scenarios-title { font-size: 1.8rem; font-weight: 700; color: #333; margin-bottom: 0.5rem; }
.scenarios-subtitle { font-size: 0.95rem; color: #666; margin-bottom: 2.5rem; }
.scenarios-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 1.2rem; }
.scenario-card { background: white; border-radius: 16px; overflow: hidden; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06); &:hover { transform: translateY(-8px); box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12); .scenario-overlay { opacity: 0.3; } .scenario-image img { transform: scale(1.1); } } }
.scenario-image { position: relative; width: 100%; height: 160px; overflow: hidden; img { width: 100%; height: 100%; object-fit: cover; transition: all 0.4s ease; background: linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%); &[data-src] { opacity: 0; } &:not([data-src]) { opacity: 1; } } }
.scenario-overlay { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(180deg, transparent 0%, rgba(0, 0, 0, 0.5) 100%); opacity: 0.5; transition: all 0.3s ease; }
.scenario-content { padding: 1.2rem 1rem; text-align: center; }
.scenario-title { font-size: 1.1rem; font-weight: 600; color: #333; margin-bottom: 0.5rem; }
.scenario-description { font-size: 0.8rem; color: #666; line-height: 1.5; }

// 为什么选择我们section
.why-choose-section { padding: 3rem 2rem; background: white; }
.why-choose-container { max-width: 1400px; margin: 0 auto; text-align: center; }
.why-choose-title { font-size: 1.8rem; font-weight: 700; color: #333; margin-bottom: 0.5rem; }
.why-choose-subtitle { font-size: 0.95rem; color: #666; margin-bottom: 2.5rem; }
.advantages-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 2rem; margin-bottom: 3rem; }
.advantage-item { text-align: center; }
.advantage-value { font-size: 2.2rem; font-weight: 700; color: #2196f3; margin-bottom: 0.3rem; }
.advantage-label { font-size: 0.95rem; color: #666; }
.comparison-table { background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06); }
.table-header { display: grid; grid-template-columns: 180px 1fr 1fr; background: linear-gradient(135deg, #42a5f5 0%, #2196f3 100%); }
.header-cell { padding: 1.2rem 1.5rem; font-size: 1.05rem; font-weight: 600; color: white; text-align: center; &.feature-col { text-align: left; background: #333; } &.ours-col { background: linear-gradient(135deg, #42a5f5 0%, #2196f3 100%); } &.others-col { background: #757575; } }
.table-body { }
.table-row { display: grid; grid-template-columns: 180px 1fr 1fr; border-bottom: 1px solid #e0e0e0; transition: all 0.3s ease; &:hover { background: #f5f9ff; } &:last-child { border-bottom: none; } }
.table-cell { padding: 1.2rem 1.5rem; font-size: 0.85rem; color: #555; display: flex; align-items: center; gap: 0.4rem; &.feature-col { font-weight: 600; color: #333; background: #f5f5f5; justify-content: flex-start; } &.ours-col { background: rgba(33, 150, 243, 0.05); color: #2196f3; justify-content: center; } &.others-col { background: #fafafa; color: #757575; justify-content: center; } }
.check-icon-blue { color: #2196f3; font-weight: bold; font-size: 1.1rem; }
.cross-icon { color: #757575; font-weight: bold; font-size: 1.1rem; }

// 客户真实评价section
.reviews-section { padding: 3rem 2rem; background: linear-gradient(135deg, #42a5f5 0%, #2196f3 50%, #1976d2 100%); }
.reviews-container { max-width: 1400px; margin: 0 auto; text-align: center; }
.reviews-title { font-size: 1.8rem; font-weight: 700; color: white; margin-bottom: 0.5rem; }
.reviews-subtitle { font-size: 0.95rem; color: rgba(255, 255, 255, 0.9); margin-bottom: 2.5rem; }
.reviews-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; }
.review-card { background: white; padding: 1.8rem 1.5rem; border-radius: 16px; text-align: left; transition: all 0.3s ease; box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08); &:hover { transform: translateY(-8px); box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15); } }
.review-header { display: flex; align-items: center; gap: 0.8rem; margin-bottom: 0.8rem; }
.reviewer-avatar { 
  width: 50px; 
  height: 50px; 
  background: linear-gradient(135deg, #42a5f5 0%, #2196f3 100%); 
  border-radius: 50%; 
  display: flex; 
  align-items: center; 
  justify-content: center; 
  box-shadow: 0 2px 8px rgba(33, 150, 243, 0.25); 
  
  &.female {
    background: linear-gradient(135deg, #ff6b9d 0%, #ff8fab 100%);
    box-shadow: 0 2px 8px rgba(255, 107, 157, 0.25);
  }
  
  &.male {
    background: linear-gradient(135deg, #42a5f5 0%, #2196f3 100%);
    box-shadow: 0 2px 8px rgba(33, 150, 243, 0.25);
  }
}
.reviewer-info { flex: 1; }
.reviewer-name { font-size: 1.05rem; font-weight: 600; color: #333; margin-bottom: 0.2rem; }
.reviewer-role { font-size: 0.8rem; color: #666; }
.review-rating { margin-bottom: 0.8rem; }
.star { font-size: 0.95rem; margin-right: 0.2rem; }
.review-comment { font-size: 0.85rem; color: #555; line-height: 1.6; font-style: italic; }

// 页脚section
.footer-section { background: #232330; color: white; padding: 3rem 2rem 1.5rem; }
.footer-container { max-width: 1400px; margin: 0 auto; }
.footer-content { display: grid; grid-template-columns: 400px 1fr; gap: 4rem; margin-bottom: 2rem; }
.footer-brand { 
  display: flex;
  flex-direction: column;
  align-items: center;
}
.brand-logo { 
  display: flex; 
  align-items: center; 
  justify-content: center;
  margin-bottom: 1.5rem; 
}
.footer-logo-image { 
  height: 80px; 
  width: auto; 
  object-fit: contain; 
}
.brand-slogan { 
  font-size: 0.9rem; 
  color: #bdc3c7; 
  margin-bottom: 1.8rem; 
  line-height: 1.6; 
  text-align: center;
}
.qr-codes { display: flex; gap: 2rem; margin-bottom: 1.8rem; }
.qr-item { text-align: center; }
.qr-placeholder { width: 90px; height: 90px; background: white; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 2.8rem; margin-bottom: 0.5rem; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); }
.qr-label { font-size: 0.8rem; color: #bdc3c7; }
.contact-info { p { display: flex; align-items: center; gap: 0.8rem; margin-bottom: 0.8rem; font-size: 0.85rem; color: #bdc3c7; line-height: 1.6; .icon { font-size: 1rem; color: #2196f3; } } }
.footer-links { display: grid; grid-template-columns: repeat(3, 1fr); gap: 3rem; }
.link-column { }
.column-title { font-size: 1rem; font-weight: 600; color: white; margin-bottom: 1.2rem; }
.link-list { list-style: none; padding: 0; margin: 0; li { margin-bottom: 0.8rem; a.link-active { color: #e0e0e0; font-size: 0.85rem; text-decoration: none; transition: all 0.3s ease; display: inline-block; cursor: pointer; &:hover { color: #2196f3; transform: translateX(3px); } } .link-text { color: #bdc3c7; font-size: 0.85rem; cursor: pointer; transition: all 0.3s ease; &:hover { color: #2196f3; } } } }
.footer-bottom { border-top: 1px solid rgba(255, 255, 255, 0.1); padding-top: 1.5rem; display: flex; justify-content: space-between; align-items: center; }
.copyright { font-size: 0.8rem; color: #95a5a6; }
.footer-badges { display: flex; gap: 0.8rem; align-items: center; }
.badge { font-size: 0.75rem; color: #95a5a6; }

@media (max-width: 1200px) { .solutions-grid { grid-template-columns: repeat(2, 1fr); gap: 1.2rem; } .features-grid { grid-template-columns: repeat(2, 1fr); } .workflow-grid { grid-template-columns: repeat(2, 1fr); } .scenarios-grid { grid-template-columns: repeat(3, 1fr); } .advantages-grid { grid-template-columns: repeat(2, 1fr); } .reviews-grid { grid-template-columns: repeat(2, 1fr); } .cases-slide-grid { grid-template-columns: repeat(3, 1fr); } .video-features { grid-template-columns: repeat(2, 1fr); } .pricing-grid { grid-template-columns: repeat(2, 1fr); } .footer-content { grid-template-columns: 1fr; gap: 2.5rem; } .footer-links { grid-template-columns: repeat(3, 1fr); gap: 2rem; } .table-header, .table-row { grid-template-columns: 140px 1fr 1fr; } }
@media (max-width: 768px) { .carousel-wrapper { height: 500px; } .solutions-grid { grid-template-columns: 1fr; gap: 2rem; } .features-grid { grid-template-columns: 1fr; gap: 1.5rem; } .workflow-grid { grid-template-columns: 1fr; gap: 2rem; } .scenarios-grid { grid-template-columns: 1fr; gap: 1.5rem; } .advantages-grid { grid-template-columns: repeat(2, 1fr); gap: 2rem; } .reviews-grid { grid-template-columns: 1fr; gap: 1.5rem; } .cases-slide-grid { grid-template-columns: repeat(2, 1fr); gap: 1rem; } .video-features { grid-template-columns: 1fr; gap: 1.5rem; } .pricing-grid { grid-template-columns: 1fr; gap: 1.5rem; } .cases-carousel-wrapper { padding: 0 3rem; } .case-carousel-btn { width: 40px; height: 40px; font-size: 1.5rem; } .case-image { height: 300px; } .footer-content { grid-template-columns: 1fr; } .footer-links { grid-template-columns: 1fr; gap: 2rem; } .qr-codes { flex-direction: row; gap: 1.5rem; justify-content: center; } .footer-bottom { flex-direction: column; gap: 1rem; text-align: center; } .table-header, .table-row { grid-template-columns: 1fr; } .header-cell, .table-cell { text-align: center !important; justify-content: center !important; } .carousel-indicators { bottom: 2rem; } .carousel-btn { width: 44px; height: 44px; font-size: 1.8rem; top: 40%; &--prev { left: 1rem; } &--next { right: 1rem; } } }
</style>
