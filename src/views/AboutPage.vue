<script setup lang="ts">
import NavigationBar from '@/components/NavigationBar.vue'
</script>

<template>
  <div class="about-page">
    <NavigationBar />
    
    <div class="about-container">
      <div class="about-hero">
        <h1>关于美家美户</h1>
        <p class="hero-subtitle">AI 把梦想的家画进现实！</p>
      </div>

      <div class="about-content">
        <section class="about-section">
          <h2>我们的使命</h2>
          <p>让AI赋能你的专业，让效果图秒级可见，让意向单即刻可签。</p>
        </section>

        <section class="about-section">
          <h2>核心功能</h2>
          <div class="features-grid">
            <div class="feature-card">
              <div class="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                  <polyline points="9 22 9 12 15 12 15 22"></polyline>
                </svg>
              </div>
              <h3>装修装饰</h3>
              <p>上传户型图，AI 自动生成多种风格的设计方案</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="8" width="18" height="4" rx="1"></rect>
                  <path d="M12 8v13"></path>
                  <path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"></path>
                  <path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5"></path>
                </svg>
              </div>
              <h3>软装布置</h3>
              <p>虚拟摆放家具，实时预览效果</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polygon points="23 7 16 12 23 17 23 7"></polygon>
                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
                </svg>
              </div>
              <h3>短视频一键生成</h3>
              <p>生成室内设计视频，全方位展示效果</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </div>
              <h3>AI数字人</h3>
              <p>数字人专业分享，让获客更加容易</p>
            </div>
          </div>
        </section>

        <section class="about-section">
          <h2>联系我们</h2>
          <p>如有任何问题或建议，欢迎联系我们：</p>
          <p>邮箱：meijiameihu@yatianshare.cn</p>
        </section>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.about-page {
  min-height: 100vh;
  background: linear-gradient(to bottom, 
    #f0f4ff 0%, 
    #e8f0ff 30%, 
    #f5f7fa 60%, 
    #f5f7fa 100%
  );
  padding-top: 70px;
}

.about-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 4rem 2rem;
}

.about-hero {
  text-align: center;
  margin-bottom: 4rem;

  h1 {
    font-size: 3rem;
    font-weight: 700;
    background: linear-gradient(135deg, #1890ff 0%, #1890ff 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin-bottom: 1rem;
  }

  .hero-subtitle {
    font-size: 1.25rem;
    color: #4a5568;
  }
}

.about-content {
  background: #fafafa;
  border-radius: 2rem;
  padding: 3rem;
  box-shadow: 0 6px 30px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.06);
}

.about-section {
  margin-bottom: 3rem;

  &:last-child {
    margin-bottom: 0;
  }

  h2 {
    font-size: 2rem;
    font-weight: 600;
    color: #2d3748;
    margin-bottom: 1.5rem;
  }

  p {
    font-size: 1.125rem;
    color: #4a5568;
    line-height: 1.8;
    margin-bottom: 1rem;
  }
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
  margin-top: 2rem;
}

.feature-card {
  text-align: center;
  padding: 2.5rem 2rem;
  background: white;
  border-radius: 1.5rem;
  transition: all 0.3s ease;
  border: 2px solid transparent;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);

  &:hover {
    transform: translateY(-8px);
    border-color: #1890ff;
    box-shadow: 0 12px 24px rgba(24, 144, 255, 0.15);
    
    .feature-icon {
      transform: scale(1.1);
      background: linear-gradient(135deg, #1890ff 0%, #1890ff 100%);
      
      svg {
        stroke: white;
      }
    }
  }

  .feature-icon {
    width: 80px;
    height: 80px;
    margin: 0 auto 1.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, rgba(24, 144, 255, 0.1) 0%, rgba(24, 144, 255, 0.05) 100%);
    border-radius: 1.25rem;
    transition: all 0.3s ease;
    
    svg {
      width: 40px;
      height: 40px;
      stroke: #1890ff;
      transition: all 0.3s ease;
    }
  }

  h3 {
    font-size: 1.25rem;
    font-weight: 600;
    color: #2d3748;
    margin-bottom: 0.75rem;
  }

  p {
    font-size: 0.9375rem;
    color: #718096;
    margin: 0;
    line-height: 1.6;
  }
}

@media (max-width: 768px) {
  .features-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
}
</style>
