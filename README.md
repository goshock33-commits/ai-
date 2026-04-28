# 🏠 AI室内设计平台

基于Vue 3 + Node.js的智能室内设计平台，集成火山引擎视觉智能API，提供文生图、图生图、视频生成等AI功能。

## ✨ 功能特性

- 🎨 **AI室内设计**：文字描述生成室内设计效果图
- 🖼️ **图片转换**：上传图片进行风格转换
- 🪑 **家具摆放**：智能家具布局建议
- 🎬 **视频生成**：文字/图片生成室内设计视频（即梦AI）
- 👤 **数字人生成**：AI数字人形象生成
- 📊 **历史记录**：保存和管理所有生成记录

## 🛠️ 技术栈

### 前端
- Vue 3 + TypeScript
- Vite
- Pinia (状态管理)
- Vue Router
- SCSS

### 后端
- Node.js + Express
- 火山引擎视觉智能API
- 百度翻译API
- 百度语音识别API

## 📦 快速开始

### 1. 克隆项目
```bash
git clone https://github.com/你的用户名/ai-interior-design.git
cd ai-interior-design
```

### 2. 安装依赖
```bash
npm install
```

### 3. 配置环境变量
```bash
# 复制环境变量模板
cp .env.example .env.local

# 编辑 .env.local，填入你的API密钥
# 获取密钥：
# - 火山引擎：https://console.volcengine.com/iam/keymanage/
# - 百度翻译：https://fanyi-api.baidu.com/
# - 百度语音：https://ai.baidu.com/tech/speech
```

### 4. 启动开发服务器

**启动后端：**
```bash
node server/index.js
# 后端运行在 http://localhost:3001
```

**启动前端：**
```bash
npm run dev
# 前端运行在 http://localhost:5173
```

### 5. 访问应用
打开浏览器访问：http://localhost:5173

## 🚀 部署

详细部署指南请查看：
- [部署指南](DEPLOYMENT_GUIDE.md) - 完整的部署流程
- [环境变量安全指南](ENV_SECURITY_GUIDE.md) - 如何安全管理API密钥
- [GitHub上传指南](GITHUB_UPLOAD_GUIDE.md) - 上传代码到GitHub

### 快速部署

**后端部署（Render）：**
1. 连接GitHub仓库
2. 配置：
   - Build Command: `npm install`
   - Start Command: `node server/index.js`
3. 添加环境变量（从 .env.local 复制）

**前端部署（Vercel）：**
1. 导入GitHub仓库
2. 配置：
   - Build Command: `npm run build`
   - Output Directory: `dist`
3. 添加后端URL环境变量

## 📁 项目结构

```
ai-interior-design/
├── server/              # Node.js 后端
│   └── index.js        # Express 服务器
├── src/                # Vue 前端源码
│   ├── components/     # 组件
│   ├── views/         # 页面
│   ├── services/      # API 服务
│   ├── stores/        # 状态管理
│   ├── router/        # 路由配置
│   └── styles/        # 样式文件
├── public/            # 静态资源
├── .env.example       # 环境变量模板
└── package.json       # 依赖配置
```

## 🔑 环境变量

必需的环境变量（在 `.env.local` 中配置）：

```env
# 火山引擎视觉智能API
VITE_VOLC_ACCESS_KEY_ID=你的AccessKeyID
VITE_VOLC_SECRET_ACCESS_KEY=你的SecretAccessKey
VITE_VOLC_REGION=cn-north-1

# 百度翻译API
VITE_BAIDU_TRANSLATE_APP_ID=你的AppID
VITE_BAIDU_TRANSLATE_SECRET_KEY=你的密钥

# 百度语音识别API
VITE_BAIDU_SPEECH_APP_ID=你的AppID
VITE_BAIDU_SPEECH_API_KEY=你的APIKey
VITE_BAIDU_SPEECH_SECRET_KEY=你的密钥

# 后端服务配置
NODE_ENV=development
PORT=3001
```

**⚠️ 重要：** 不要将 `.env.local` 提交到Git！该文件已在 `.gitignore` 中。

## 📖 API文档

- [即梦AI视频生成](即梦AI.md) - 视频生成API使用说明
- [Java后端集成](JAVA_BACKEND_GUIDE.md) - Java后端开发指南

## 🤝 贡献

欢迎提交Issue和Pull Request！

## 📄 许可证

MIT License

## 🆘 常见问题

### Q: 视频生成失败怎么办？
A: 检查火山引擎API密钥是否正确配置，确保账户有足够的余额。

### Q: 如何获取API密钥？
A: 
- 火山引擎：https://console.volcengine.com/iam/keymanage/
- 百度翻译：https://fanyi-api.baidu.com/
- 百度语音：https://ai.baidu.com/tech/speech

### Q: 部署后环境变量如何配置？
A: 在部署平台（Render/Vercel）的环境变量配置界面添加，不要上传 `.env.local` 文件。

### Q: 前端无法连接后端？
A: 检查 `.env.local` 中的 `VITE_API_BASE_URL` 是否正确指向后端地址。

## 📞 联系方式

如有问题，请提交Issue或联系开发者。

---

⭐ 如果这个项目对你有帮助，请给个Star！
