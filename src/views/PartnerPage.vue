<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import NavigationBar from '@/components/NavigationBar.vue'

// 表单数据
const partnerForm = ref({
  province: '',
  city: '',
  district: '',
  contactName: '',
  contactPhone: '',
  bankName: '',
  accountName: '',
  bankCardNumber: ''
})
const submitting = ref(false)
const submitted = ref(false)

// 省份数据
const provinces = [
  '北京市', '天津市', '上海市', '重庆市', '河北省', '山西省', '辽宁省', '吉林省',
  '黑龙江省', '江苏省', '浙江省', '安徽省', '福建省', '江西省', '山东省', '河南省',
  '湖北省', '湖南省', '广东省', '海南省', '四川省', '贵州省', '云南省', '陕西省',
  '甘肃省', '青海省', '台湾省', '内蒙古自治区', '广西壮族自治区', '西藏自治区',
  '宁夏回族自治区', '新疆维吾尔自治区', '香港特别行政区', '澳门特别行政区'
]

// 合伙人优势
const advantages = [
  { icon: 'door', title: '零门槛加入', desc: '无需加盟费，免费成为城市合伙人' },
  { icon: 'coin', title: '高额分成', desc: '享受区域内订单的丰厚佣金回报' },
  { icon: 'shield', title: '独家代理', desc: '区域独家授权，避免同行竞争' },
  { icon: 'book', title: '全程培训', desc: '专业团队提供运营培训和技术支持' },
  { icon: 'megaphone', title: '营销支持', desc: '提供宣传物料和营销方案支持' },
  { icon: 'handshake', title: '长期合作', desc: '建立长期稳定的合作伙伴关系' }
]

// 提交表单
const submitForm = async () => {
  // 验证表单
  if (!partnerForm.value.province) {
    ElMessage.warning('请选择省份')
    return
  }
  if (!partnerForm.value.city.trim()) {
    ElMessage.warning('请输入城市')
    return
  }
  if (!partnerForm.value.district.trim()) {
    ElMessage.warning('请输入区/县')
    return
  }
  if (!partnerForm.value.contactName.trim()) {
    ElMessage.warning('请输入联系人姓名')
    return
  }
  if (!partnerForm.value.contactPhone.trim()) {
    ElMessage.warning('请输入联系电话')
    return
  }
  // 验证手机号格式
  const phoneRegex = /^1[3-9]\d{9}$/
  if (!phoneRegex.test(partnerForm.value.contactPhone)) {
    ElMessage.warning('请输入正确的手机号码')
    return
  }
  if (!partnerForm.value.bankName.trim()) {
    ElMessage.warning('请输入开户行')
    return
  }
  if (!partnerForm.value.accountName.trim()) {
    ElMessage.warning('请输入收款账户户名')
    return
  }
  if (!partnerForm.value.bankCardNumber.trim()) {
    ElMessage.warning('请输入银行卡号')
    return
  }
  // 验证银行卡号格式（16-19位数字）
  const bankCardRegex = /^\d{16,19}$/
  if (!bankCardRegex.test(partnerForm.value.bankCardNumber.replace(/\s/g, ''))) {
    ElMessage.warning('请输入正确的银行卡号')
    return
  }

  submitting.value = true
  
  try {
    // 模拟提交
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // 保存到本地存储
    const partnerApplications = JSON.parse(localStorage.getItem('partner_applications') || '[]')
    partnerApplications.push({
      ...partnerForm.value,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      status: 'pending'
    })
    localStorage.setItem('partner_applications', JSON.stringify(partnerApplications))
    
    submitted.value = true
    ElMessage.success('申请提交成功！')
  } catch (error) {
    ElMessage.error('提交失败，请稍后重试')
  } finally {
    submitting.value = false
  }
}

// 重新申请
const resetForm = () => {
  submitted.value = false
  partnerForm.value = {
    province: '',
    city: '',
    district: '',
    contactName: '',
    contactPhone: '',
    bankName: '',
    accountName: '',
    bankCardNumber: ''
  }
}
</script>

<template>
  <div class="partner-page">
    <NavigationBar />
    
    <div class="container">
      <!-- 页面头部 -->
      <div class="header">
        <h1>
          <svg class="title-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
          </svg>
          美家美户城市合伙人计划
        </h1>
        <p class="subtitle">AI+家居装饰新风口，与我们一起开创智能家居新时代</p>
      </div>

      <!-- 优势介绍 -->
      <div class="advantages-section">
        <h2>为什么选择我们</h2>
        <div class="advantages-grid">
          <div v-for="item in advantages" :key="item.title" class="advantage-card">
            <div class="advantage-icon">
              <!-- 零门槛 -->
              <svg v-if="item.icon === 'door'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M3 21h18M9 21V3h6v18M9 12h.01"/>
              </svg>
              <!-- 高额分成 -->
              <svg v-else-if="item.icon === 'coin'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <circle cx="12" cy="12" r="9"/>
                <path d="M12 7v10M9 10h6M9 14h6"/>
              </svg>
              <!-- 独家代理 -->
              <svg v-else-if="item.icon === 'shield'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M12 2l8 4v6c0 5.5-3.5 10-8 11-4.5-1-8-5.5-8-11V6l8-4z"/>
                <path d="M9 12l2 2 4-4"/>
              </svg>
              <!-- 全程培训 -->
              <svg v-else-if="item.icon === 'book'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                <path d="M8 7h8M8 11h6"/>
              </svg>
              <!-- 营销支持 -->
              <svg v-else-if="item.icon === 'megaphone'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M3 11v2a1 1 0 0 0 1 1h2l4 4V6L6 10H4a1 1 0 0 0-1 1z"/>
                <path d="M15 8a4 4 0 0 1 0 8"/>
                <path d="M18 5a8 8 0 0 1 0 14"/>
              </svg>
              <!-- 长期合作 -->
              <svg v-else-if="item.icon === 'handshake'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M20 11l-8 8-4-4"/>
                <path d="M4 11l4 4"/>
                <path d="M4 7h4l4-4 4 4h4"/>
              </svg>
            </div>
            <h3>{{ item.title }}</h3>
            <p>{{ item.desc }}</p>
          </div>
        </div>
      </div>

      <!-- 申请表单 -->
      <div class="form-section">
        <div class="form-card">
          <template v-if="!submitted">
            <h2>免费加入</h2>
            <p class="form-hint">填写以下信息，我们会尽快与您联系</p>
            
            <div class="form-content">
              <div class="form-group">
                <label>省份 <span class="required">*</span></label>
                <select v-model="partnerForm.province" class="form-select">
                  <option value="">请选择省份</option>
                  <option v-for="province in provinces" :key="province" :value="province">
                    {{ province }}
                  </option>
                </select>
              </div>
              
              <div class="form-row">
                <div class="form-group">
                  <label>城市 <span class="required">*</span></label>
                  <input 
                    v-model="partnerForm.city" 
                    type="text" 
                    class="form-input" 
                    placeholder="请输入城市"
                  />
                </div>
                <div class="form-group">
                  <label>区/县 <span class="required">*</span></label>
                  <input 
                    v-model="partnerForm.district" 
                    type="text" 
                    class="form-input" 
                    placeholder="请输入区/县"
                  />
                </div>
              </div>
              
              <div class="form-group">
                <label>联系人 <span class="required">*</span></label>
                <input 
                  v-model="partnerForm.contactName" 
                  type="text" 
                  class="form-input" 
                  placeholder="请输入联系人姓名"
                />
              </div>
              
              <div class="form-group">
                <label>联系电话 <span class="required">*</span></label>
                <input 
                  v-model="partnerForm.contactPhone" 
                  type="tel" 
                  class="form-input" 
                  placeholder="请输入手机号码"
                  maxlength="11"
                />
              </div>
              
              <div class="form-group">
                <label>开户行 <span class="required">*</span></label>
                <input 
                  v-model="partnerForm.bankName" 
                  type="text" 
                  class="form-input" 
                  placeholder="请输入开户行名称，如：中国工商银行XX支行"
                />
              </div>
              
              <div class="form-group">
                <label>收款账户户名 <span class="required">*</span></label>
                <input 
                  v-model="partnerForm.accountName" 
                  type="text" 
                  class="form-input" 
                  placeholder="请输入收款账户户名"
                />
              </div>
              
              <div class="form-group">
                <label>银行卡号 <span class="required">*</span></label>
                <input 
                  v-model="partnerForm.bankCardNumber" 
                  type="text" 
                  class="form-input" 
                  placeholder="请输入银行卡号"
                  maxlength="23"
                />
              </div>
              
              <button 
                class="submit-btn" 
                :disabled="submitting"
                @click="submitForm"
              >
                {{ submitting ? '提交中...' : '提交申请' }}
              </button>
            </div>
          </template>
          
          <!-- 提交成功 -->
          <template v-else>
            <div class="success-state">
              <div class="success-icon">✅</div>
              <h2>申请已提交</h2>
              <p>感谢您的申请！我们的工作人员会在1-3个工作日内与您联系。</p>
              <button class="reset-btn" @click="resetForm">再次申请</button>
            </div>
          </template>
        </div>
      </div>

      <!-- 联系方式 -->
      <div class="contact-section">
        <h3>💡 如有疑问，请联系我们</h3>
        <p>meijiameihu@yatianshare.cn</p>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.partner-page {
  min-height: 100vh;
  background: linear-gradient(to bottom, 
    #f0f4ff 0%, 
    #e8f0ff 30%, 
    #f5f7fa 60%, 
    #f5f7fa 100%
  );
  padding: 100px 2rem 2rem;
}

.container {
  max-width: 1000px;
  margin: 0 auto;
}

.header {
  text-align: center;
  margin-bottom: 3rem;
  animation: fadeIn 0.5s ease-out;

  h1 {
    display: inline-flex;
    align-items: center;
    gap: 0.75rem;
    font-size: 2.5rem;
    font-weight: 700;
    background: linear-gradient(135deg, #1890ff 0%, #1890ff 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin-bottom: 1rem;

    .title-icon {
      width: 40px;
      height: 40px;
      stroke: #1890ff;
      flex-shrink: 0;
    }
  }

  .subtitle {
    font-size: 1.125rem;
    color: #4a5568;
  }
}

.advantages-section {
  margin-bottom: 3rem;

  h2 {
    text-align: center;
    font-size: 1.5rem;
    font-weight: 600;
    color: #1a1a1a;
    margin-bottom: 2rem;
  }
}

.advantages-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
}

.advantage-card {
  background: #fafafa;
  border-radius: 1rem;
  padding: 1.5rem;
  text-align: center;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);

    .advantage-icon {
      background: #1890ff;
      
      svg {
        stroke: white;
      }
    }
  }

  .advantage-icon {
    width: 48px;
    height: 48px;
    margin: 0 auto 1rem;
    background: #e6f4ff;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;

    svg {
      width: 24px;
      height: 24px;
      stroke: #1890ff;
      transition: all 0.3s ease;
    }
  }

  h3 {
    font-size: 1.125rem;
    font-weight: 600;
    color: #1a1a1a;
    margin-bottom: 0.5rem;
  }

  p {
    font-size: 0.875rem;
    color: #666;
    line-height: 1.5;
  }
}

.form-section {
  margin-bottom: 2rem;
}

.form-card {
  background: #fafafa;
  border-radius: 1.5rem;
  padding: 2.5rem;
  box-shadow: 0 6px 30px rgba(0, 0, 0, 0.08);
  animation: slideUp 0.5s ease-out;

  h2 {
    text-align: center;
    font-size: 1.5rem;
    font-weight: 600;
    color: #1a1a1a;
    margin-bottom: 0.5rem;
  }

  .form-hint {
    text-align: center;
    font-size: 0.875rem;
    color: #666;
    margin-bottom: 2rem;
  }
}

.form-content {
  max-width: 500px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  label {
    font-size: 0.875rem;
    font-weight: 500;
    color: #333;

    .required {
      color: #f5222d;
    }
  }
}

.form-input,
.form-select {
  padding: 0.875rem 1rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 0.9375rem;
  color: #333;
  background: white;
  transition: all 0.2s ease;
  width: 100%;

  &:focus {
    outline: none;
    border-color: #1890ff;
    box-shadow: 0 0 0 3px rgba(24, 144, 255, 0.1);
  }

  &::placeholder {
    color: #999;
  }
}

.form-select {
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 1rem center;
  padding-right: 2.5rem;
}

.submit-btn {
  width: 100%;
  padding: 1rem;
  background: linear-gradient(135deg, #1890ff 0%, #1890ff 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 0.5rem;
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.3);

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(24, 144, 255, 0.4);
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
}

.success-state {
  text-align: center;
  padding: 2rem 0;

  .success-icon {
    font-size: 4rem;
    margin-bottom: 1.5rem;
  }

  h2 {
    margin-bottom: 1rem;
  }

  p {
    color: #666;
    margin-bottom: 2rem;
  }

  .reset-btn {
    padding: 0.75rem 2rem;
    background: white;
    color: #1890ff;
    border: 2px solid #1890ff;
    border-radius: 8px;
    font-size: 0.9375rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover {
      background: #1890ff;
      color: white;
    }
  }
}

.contact-section {
  text-align: center;
  padding: 2rem;
  background: #fafafa;
  border-radius: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);

  h3 {
    font-size: 1.125rem;
    font-weight: 600;
    color: #1890ff;
    margin-bottom: 0.75rem;
  }

  p {
    font-size: 0.875rem;
    color: #666;
  }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 768px) {
  .partner-page {
    padding: 80px 1rem 1rem;
  }

  .header h1 {
    font-size: 2rem;
  }

  .advantages-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .form-card {
    padding: 1.5rem;
  }

  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>
