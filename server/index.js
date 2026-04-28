import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import crypto from 'crypto'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// 加载环境变量
// 本地开发：优先加载 .env.local，其次 .env
// 部署环境：使用系统环境变量（Render/Railway等平台配置）
dotenv.config({ path: join(__dirname, '../.env.local') })
dotenv.config({ path: join(__dirname, '../.env') })

const app = express()
const PORT = process.env.PORT || 3001

// 中间件
app.use(cors())
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ limit: '50mb', extended: true }))

// 静态文件服务 - 提供视频文件访问
app.use('/videos', express.static(join(__dirname, '../public/videos')))

/**
 * 生成百度数字人 API 鉴权签名
 * 格式：AppId/Signature/ExpireTime
 */
function generateAuthorization() {
  const APP_ID = process.env.VITE_BAIDU_DH_APP_ID
  const APP_KEY = process.env.VITE_BAIDU_DH_APP_KEY

  if (!APP_ID || !APP_KEY) {
    throw new Error('未配置百度智能云密钥，请在 .env.local 中配置 VITE_BAIDU_DH_APP_ID 和 VITE_BAIDU_DH_APP_KEY')
  }

  // 设置过期时间为1小时后
  const expireTime = new Date(Date.now() + 60 * 60 * 1000).toISOString()

  // 使用 HMAC-SHA256 生成签名
  const data = APP_ID + expireTime
  const signature = crypto
    .createHmac('sha256', APP_KEY)
    .update(data)
    .digest('hex')

  // 返回鉴权字符串：AppId/Signature/ExpireTime
  const authorization = `${APP_ID}/${signature}/${expireTime}`
  
  console.log('🔐 生成鉴权签名:')
  console.log('  App ID:', APP_ID)
  console.log('  过期时间:', expireTime)
  console.log('  签名:', signature.substring(0, 20) + '...')
  
  return authorization
}

/**
 * 创建数字人视频任务
 */
app.post('/api/digital-human/create', async (req, res) => {
  try {
    const { personId, text, voiceId, bgColor, bgImageUrl, personName } = req.body

    // 生成鉴权签名
    const authorization = generateAuthorization()

    // 根据数字人名称判断是横屏还是竖屏
    const isLandscape = personName && personName.includes('横屏')
    const videoWidth = isLandscape ? 1920 : 1080
    const videoHeight = isLandscape ? 1080 : 1920

    console.log(`📐 视频尺寸: ${videoWidth}x${videoHeight} (${isLandscape ? '横屏' : '竖屏'})`)

    // 构建请求体
    const requestBody = {
      figureId: personId,
      driveType: 'TEXT',
      text: text,
      ttsParams: {
        person: voiceId,
        speed: '5',
        pitch: '5',
        volume: '5'
      },
      videoParams: {
        width: videoWidth,
        height: videoHeight,
        transparent: false,
        backgroundColor: '#FFFFFF'
      },
      autoAnimoji: false,
      subtitleParams: {
        enabled: false,
        subtitlePolicy: 'SRT'
      }
    }

    if (bgColor) {
      requestBody.videoParams.backgroundColor = bgColor
    }

    if (bgImageUrl && (bgImageUrl.startsWith('http://') || bgImageUrl.startsWith('https://'))) {
      requestBody.backgroundImageUrl = bgImageUrl
    }

    console.log('📤 发送百度数字人视频创建请求...')

    // 动态导入 node-fetch
    const fetch = (await import('node-fetch')).default

    // 调用百度 API
    const response = await fetch(
      'https://open.xiling.baidu.com/api/digitalhuman/open/v1/video/submit',
      {
        method: 'POST',
        headers: {
          'Authorization': authorization,
          'Content-Type': 'application/json;charset=utf-8'
        },
        body: JSON.stringify(requestBody)
      }
    )

    const data = await response.json()

    if (!data.success || data.code !== 0) {
      return res.status(400).json({
        success: false,
        message: data.message?.global || '创建视频任务失败',
        code: data.code,
        requestId: data.requestId
      })
    }

    res.json({
      success: true,
      taskId: data.result?.taskId
    })
  } catch (error) {
    console.error('❌ 创建视频任务失败:', error)
    res.status(500).json({
      success: false,
      message: error.message || '服务器错误'
    })
  }
})

/**
 * 查询视频任务状态
 */
app.get('/api/digital-human/status/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params

    // 生成鉴权签名
    const authorization = generateAuthorization()

    // 动态导入 node-fetch
    const fetch = (await import('node-fetch')).default

    // 调用百度 API
    const response = await fetch(
      `https://open.xiling.baidu.com/api/digitalhuman/open/v1/video/task?taskId=${taskId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': authorization,
          'Content-Type': 'application/json'
        }
      }
    )

    const data = await response.json()

    if (!data.success || data.code !== 0) {
      return res.status(400).json({
        success: false,
        message: data.message?.global || '查询任务状态失败'
      })
    }

    res.json({
      success: true,
      result: data.result
    })
  } catch (error) {
    console.error('❌ 查询任务状态失败:', error)
    res.status(500).json({
      success: false,
      message: error.message || '服务器错误'
    })
  }
})

/**
 * Grsai nano-banana API 代理
 */
app.post('/api/grsai/nano-banana', async (req, res) => {
  try {
    const { apiKey, model, urls, prompt, aspectRatio, imageSize, webHook } = req.body

    if (!apiKey) {
      return res.status(400).json({ success: false, error: 'API Key 未配置' })
    }

    console.log('🎨 开始调用 Grsai API...')

    // 动态导入 node-fetch
    const fetch = (await import('node-fetch')).default

    // 构建请求体
    const requestBody = {
      model,
      urls,
      prompt,
      aspect_ratio: aspectRatio,
      image_size: imageSize,
      web_hook: webHook
    }

    // 提交任务
    const submitResponse = await fetch('https://api.grsai.com/v1/nano-banana', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    })

    if (!submitResponse.ok) {
      const errorText = await submitResponse.text()
      return res.status(submitResponse.status).json({ 
        success: false, 
        error: `API 返回错误 ${submitResponse.status}: ${errorText}` 
      })
    }

    const submitData = await submitResponse.json()

    if (!submitData.data?.task_id) {
      return res.status(500).json({ 
        success: false, 
        error: '未返回任务ID' 
      })
    }

    const taskId = submitData.data.task_id

    // 轮询查询结果
    const maxAttempts = 30
    const pollInterval = 2000

    for (let i = 0; i < maxAttempts; i++) {
      await new Promise(resolve => setTimeout(resolve, pollInterval))

      const queryResponse = await fetch(
        `https://api.grsai.com/v1/nano-banana/${taskId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${apiKey}`
          }
        }
      )

      if (!queryResponse.ok) {
        continue
      }

      const queryData = await queryResponse.json()

      if (queryData.data?.status === 'succeeded') {
        const imageUrl = queryData.data?.output?.image_url
        if (imageUrl) {
          return res.json({ success: true, imageUrl })
        }
      } else if (queryData.data?.status === 'failed') {
        return res.status(500).json({ 
          success: false, 
          error: '生成失败' 
        })
      }
    }

    return res.status(408).json({ 
      success: false, 
      error: '生成超时，请重试' 
    })

  } catch (error) {
    console.error('❌ Grsai API 错误:', error)
    res.status(500).json({ 
      success: false, 
      error: error.message || '服务器错误' 
    })
  }
})

/**
 * Grsai Sora-2 视频生成 API 代理
 */
app.post('/api/grsai/video/submit', async (req, res) => {
  try {
    const { apiKey, prompt, url, aspectRatio, duration, size } = req.body

    if (!apiKey) {
      return res.status(400).json({ success: false, error: 'API Key 未配置' })
    }

    console.log('🎬 开始调用 Grsai Sora-2 API...')
    console.log('🔑 API Key (前8位):', apiKey.substring(0, 8) + '...')
    console.log('📏 API Key 长度:', apiKey.length)

    const fetch = (await import('node-fetch')).default

    const requestBody = {
      model: 'sora-2',
      prompt: prompt,
      url: url,
      aspectRatio: aspectRatio || '16:9',
      duration: duration || 10,
      size: size || 'small',
      webHook: '-1'
    }

    // Grsai Sora-2 视频生成接口
    const apiUrl = 'https://grsai.dakka.com.cn/v1/video/sora-video'
    console.log('📡 API 端点:', apiUrl)
    console.log('📝 请求体:', JSON.stringify(requestBody, null, 2))

    const submitResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody),
      timeout: 30000 // 30秒超时
    })

    console.log('📥 响应状态:', submitResponse.status, submitResponse.statusText)

    if (!submitResponse.ok) {
      const errorText = await submitResponse.text()
      console.error('❌ API 错误响应:', errorText)
      return res.status(submitResponse.status).json({
        success: false,
        error: `API 返回错误 (${submitResponse.status}): ${errorText}`
      })
    }

    const submitData = await submitResponse.json()
    console.log('📥 API 响应数据:', JSON.stringify(submitData, null, 2))

    if (submitData.code !== 0 || !submitData.data?.id) {
      console.error('❌ 任务提交失败:', submitData)
      return res.status(400).json({
        success: false,
        error: submitData.msg || submitData.message || '任务提交失败'
      })
    }

    console.log('✅ 视频任务提交成功, ID:', submitData.data.id)

    res.json({
      success: true,
      taskId: submitData.data.id
    })

  } catch (error) {
    console.error('❌ Grsai Sora-2 API 错误:', error)
    res.status(500).json({
      success: false,
      error: error.message || '服务器错误'
    })
  }
})

/**
 * Grsai 视频生成结果查询
 */
app.post('/api/grsai/video/result', async (req, res) => {
  try {
    const { apiKey, taskId } = req.body

    if (!apiKey || !taskId) {
      return res.status(400).json({ success: false, error: '缺少必要参数' })
    }

    const fetch = (await import('node-fetch')).default

    // 使用 Grsai 获取结果接口
    const resultResponse = await fetch('https://grsai.dakka.com.cn/v1/draw/result', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ id: taskId }),
      timeout: 10000 // 10秒超时
    })

    if (!resultResponse.ok) {
      return res.status(resultResponse.status).json({
        success: false,
        error: `查询失败: HTTP ${resultResponse.status}`
      })
    }

    const resultData = await resultResponse.json()

    res.json({
      success: true,
      data: resultData
    })

  } catch (error) {
    console.error('❌ 查询视频结果错误:', error)
    res.status(500).json({
      success: false,
      error: error.message || '服务器错误'
    })
  }
})

/**
 * 火山引擎v4签名算法
 * 参考文档：https://www.volcengine.com/docs/6459/67269
 */
function generateVolcEngineSignature(method, path, query, headers, body, timestamp) {
  const ACCESS_KEY_ID = process.env.VITE_VOLC_ACCESS_KEY_ID
  const SECRET_ACCESS_KEY = process.env.VITE_VOLC_SECRET_ACCESS_KEY
  const SERVICE = 'cv'
  const REGION = process.env.VITE_VOLC_REGION || 'cn-north-1'

  if (!ACCESS_KEY_ID || !SECRET_ACCESS_KEY) {
    throw new Error('未配置火山引擎密钥，请在 .env.local 中配置 VITE_VOLC_ACCESS_KEY_ID 和 VITE_VOLC_SECRET_ACCESS_KEY')
  }

  // 1. 创建规范请求
  const canonicalQueryString = Object.keys(query)
    .sort()
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(query[key])}`)
    .join('&')

  const canonicalHeaders = Object.keys(headers)
    .sort()
    .map(key => `${key.toLowerCase()}:${headers[key].trim()}\n`)
    .join('')

  const signedHeaders = Object.keys(headers)
    .sort()
    .map(key => key.toLowerCase())
    .join(';')

  const hashedPayload = crypto
    .createHash('sha256')
    .update(body || '')
    .digest('hex')

  const canonicalRequest = [
    method,
    path,
    canonicalQueryString,
    canonicalHeaders,
    signedHeaders,
    hashedPayload
  ].join('\n')

  // 2. 创建待签名字符串
  const date = timestamp.substring(0, 8)
  const credentialScope = `${date}/${REGION}/${SERVICE}/request`
  
  const hashedCanonicalRequest = crypto
    .createHash('sha256')
    .update(canonicalRequest)
    .digest('hex')

  const stringToSign = [
    'HMAC-SHA256',
    timestamp,
    credentialScope,
    hashedCanonicalRequest
  ].join('\n')

  // 3. 计算签名
  const kDate = crypto
    .createHmac('sha256', SECRET_ACCESS_KEY)
    .update(date)
    .digest()

  const kRegion = crypto
    .createHmac('sha256', kDate)
    .update(REGION)
    .digest()

  const kService = crypto
    .createHmac('sha256', kRegion)
    .update(SERVICE)
    .digest()

  const kSigning = crypto
    .createHmac('sha256', kService)
    .update('request')
    .digest()

  const signature = crypto
    .createHmac('sha256', kSigning)
    .update(stringToSign)
    .digest('hex')

  // 4. 构建Authorization头
  const authorization = `HMAC-SHA256 Credential=${ACCESS_KEY_ID}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`

  return authorization
}

/**
 * 火山引擎文生图API
 */
app.post('/api/volcengine/text-to-image', async (req, res) => {
  try {
    const { prompt, width = 1024, height = 1024, scale = 3.5, seed = -1, req_key, reqKey, use_pre_llm } = req.body
    const finalReqKey = req_key || reqKey || 'high_aes_general_v30l_zt2i'
    const finalUsePreLlm = (use_pre_llm === true || use_pre_llm === 'true') ? true : false

    if (!prompt) {
      return res.status(400).json({ success: false, error: '提示词不能为空' })
    }

    console.log('🎨 开始调用火山引擎文生图API...')
    console.log('📝 提示词:', prompt.substring(0, 50) + '...')

    // 动态导入 node-fetch
    const fetch = (await import('node-fetch')).default

    // 提交任务（带重试机制）
    const maxRetries = 3
    const baseDelay = 2000 // 基础延迟2秒
    let taskId = null

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        // 如果不是第一次尝试，先等待（指数退避）
        if (attempt > 0) {
          const delay = baseDelay * Math.pow(2, attempt - 1)
          console.log(`⏳ 等待 ${delay}ms 后重试 (第${attempt + 1}/${maxRetries}次)`)
          await new Promise(resolve => setTimeout(resolve, delay))
        }

        // 1. 提交任务
        const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
        const host = 'visual.volcengineapi.com'
        const path = '/'
        const query = {
          Action: 'CVProcess',
          Version: '2022-08-31'
        }

        const requestBody = {
          req_key: finalReqKey,
          prompt: prompt,
          width: width,
          height: height,
          scale: scale,
          seed: seed,
          use_pre_llm: finalUsePreLlm
        }

        const bodyJson = JSON.stringify(requestBody)

        const headers = {
          'Host': host,
          'Content-Type': 'application/json',
          'X-Date': timestamp
        }

        const authorization = generateVolcEngineSignature('POST', path, query, headers, bodyJson, timestamp)
        headers['Authorization'] = authorization

        const submitUrl = `https://${host}${path}?${Object.keys(query).map(k => `${k}=${query[k]}`).join('&')}`

        console.log(`📤 提交任务 (尝试 ${attempt + 1}/${maxRetries})...`)
        const submitResponse = await fetch(submitUrl, {
          method: 'POST',
          headers: headers,
          body: bodyJson
        })

        if (!submitResponse.ok) {
          const errorText = await submitResponse.text()
          console.error('❌ 提交任务失败:', errorText)
          
          // 如果是并发限制错误且还有重试次数，继续重试
          if (errorText.includes('50430') && attempt < maxRetries - 1) {
            console.warn('⚠️ API并发限制，准备重试...')
            continue
          }
          
          return res.status(submitResponse.status).json({
            success: false,
            error: `提交任务失败: ${errorText}`
          })
        }

        const submitData = await submitResponse.json()

        // 处理并发限制错误 (50430)
        if (submitData.code === 50430 || submitData.status === 50430) {
          console.warn(`⚠️ API并发限制 [code=${submitData.code || submitData.status}]: ${submitData.message} (尝试 ${attempt + 1}/${maxRetries})`)
          if (attempt < maxRetries - 1) {
            continue // 继续重试
          } else {
            return res.status(429).json({
              success: false,
              error: `API并发限制，请稍后重试: ${submitData.message}`
            })
          }
        }

        // 检查响应状态（支持code和status两种字段）
        const statusCode = submitData.code || submitData.status
        if (statusCode !== 10000) {
          console.error('❌ API返回错误 [code=' + statusCode + ']:', submitData.message)
          return res.status(400).json({
            success: false,
            error: submitData.message || 'API调用失败'
          })
        }

        // 火山引擎返回同步结果，直接包含图片数据
        if (submitData.data && submitData.data.binary_data_base64 && submitData.data.binary_data_base64.length > 0) {
          const base64Image = submitData.data.binary_data_base64[0]
          const dataUrl = `data:image/png;base64,${base64Image}`
          
          console.log(`✅ 图片生成成功 (尝试 ${attempt + 1}/${maxRetries})`)
          console.log(`📊 图片大小: ${(base64Image.length / 1024).toFixed(2)} KB`)
          
          return res.json({
            success: true,
            imageUrl: dataUrl
          })
        }

        // 如果是异步模式，返回task_id
        if (submitData.data && submitData.data.task_id) {
          taskId = submitData.data.task_id
          console.log(`✅ 任务提交成功 (尝试 ${attempt + 1}/${maxRetries})`)
          console.log('🆔 任务ID:', taskId)
          break // 成功，跳出重试循环
        }

        // 响应格式不符合预期
        console.error('❌ API响应格式错误:', submitData)
        return res.status(500).json({
          success: false,
          error: 'API响应格式错误'
        })

      } catch (error) {
        console.error(`❌ 提交任务异常 (尝试 ${attempt + 1}/${maxRetries}):`, error.message)
        
        // 如果是最后一次尝试，返回错误
        if (attempt === maxRetries - 1) {
          return res.status(500).json({
            success: false,
            error: `提交任务失败: ${error.message}`
          })
        }
        // 否则继续重试
      }
    }

    // 如果所有重试都失败（异步模式才会到这里）
    if (!taskId) {
      return res.status(500).json({
        success: false,
        error: '提交任务失败，已达最大重试次数'
      })
    }

    // 注意：当前火山引擎API使用同步模式，直接返回图片数据
    // 如果到达这里说明是异步模式，需要轮询查询结果
    console.log('⚠️ 检测到异步模式，开始轮询查询结果...')
    
    // 异步模式暂不支持，因为当前API返回的是同步结果
    return res.status(500).json({
      success: false,
      error: '当前API配置为同步模式，不支持异步轮询'
    })

  } catch (error) {
    console.error('❌ 火山引擎API错误:', error)
    res.status(500).json({
      success: false,
      error: error.message || '服务器错误'
    })
  }
})

/**
 * 火山引擎图生图API（软装布置）
 */
app.post('/api/volcengine/image-to-image', async (req, res) => {
  try {
    const { prompt, binary_data_base64, width = 1328, height = 1328, strength = 0.5, req_key, reqKey } = req.body
    const finalReqKey = req_key || reqKey || 'high_aes_general_v30l_zt2i' // 使用文生图模型支持图片输入

    if (!prompt) {
      return res.status(400).json({ success: false, error: '提示词不能为空' })
    }

    if (!binary_data_base64 || !Array.isArray(binary_data_base64) || binary_data_base64.length === 0) {
      return res.status(400).json({ success: false, error: '请提供至少一张图片' })
    }

    console.log('🎨 开始调用火山引擎图生图API...')
    console.log('📝 提示词:', prompt.substring(0, 50) + '...')
    console.log('🖼️ 图片数量:', binary_data_base64.length)

    const fetch = (await import('node-fetch')).default

    // 提交任务（带重试机制）
    const maxRetries = 3
    const baseDelay = 2000
    let taskId = null

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          const delay = baseDelay * Math.pow(2, attempt - 1)
          console.log(`⏳ 等待 ${delay}ms 后重试 (第${attempt + 1}/${maxRetries}次)`)
          await new Promise(resolve => setTimeout(resolve, delay))
        }

        const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
        const host = 'visual.volcengineapi.com'
        const path = '/'
        const query = {
          Action: 'CVProcess',
          Version: '2022-08-31'
        }

        const requestBody = {
          req_key: finalReqKey,
          prompt: prompt,
          binary_data_base64: binary_data_base64,
          width: width,
          height: height,
          strength: strength
        }

        const bodyJson = JSON.stringify(requestBody)

        const headers = {
          'Host': host,
          'Content-Type': 'application/json',
          'X-Date': timestamp
        }

        const authorization = generateVolcEngineSignature('POST', path, query, headers, bodyJson, timestamp)
        headers['Authorization'] = authorization

        const submitUrl = `https://${host}${path}?${Object.keys(query).map(k => `${k}=${query[k]}`).join('&')}`

        console.log(`📤 提交图生图任务 (尝试 ${attempt + 1}/${maxRetries})...`)
        const submitResponse = await fetch(submitUrl, {
          method: 'POST',
          headers: headers,
          body: bodyJson
        })

        if (!submitResponse.ok) {
          const errorText = await submitResponse.text()
          console.error('❌ 提交任务失败:', errorText)
          
          if (errorText.includes('50430') && attempt < maxRetries - 1) {
            console.warn('⚠️ API并发限制，准备重试...')
            continue
          }
          
          return res.status(submitResponse.status).json({
            success: false,
            error: `提交任务失败: ${errorText}`
          })
        }

        const submitData = await submitResponse.json()

        if (submitData.code === 50430 || submitData.status === 50430) {
          console.warn(`⚠️ API并发限制 [code=${submitData.code || submitData.status}]: ${submitData.message} (尝试 ${attempt + 1}/${maxRetries})`)
          if (attempt < maxRetries - 1) {
            continue
          } else {
            return res.status(429).json({
              success: false,
              error: `API并发限制，请稍后重试: ${submitData.message}`
            })
          }
        }

        const statusCode = submitData.code || submitData.status
        if (statusCode !== 10000) {
          console.error('❌ API返回错误 [code=' + statusCode + ']:', submitData.message)
          return res.status(400).json({
            success: false,
            error: submitData.message || 'API调用失败'
          })
        }

        // 同步模式：直接返回图片
        if (submitData.data && submitData.data.binary_data_base64 && submitData.data.binary_data_base64.length > 0) {
          const base64Image = submitData.data.binary_data_base64[0]
          const dataUrl = `data:image/png;base64,${base64Image}`
          
          console.log(`✅ 图生图成功 (尝试 ${attempt + 1}/${maxRetries})`)
          console.log(`📊 图片大小: ${(base64Image.length / 1024).toFixed(2)} KB`)
          
          return res.json({
            success: true,
            imageUrl: dataUrl
          })
        }

        console.error('❌ API响应格式错误:', submitData)
        return res.status(500).json({
          success: false,
          error: 'API响应格式错误'
        })

      } catch (error) {
        console.error(`❌ 提交任务异常 (尝试 ${attempt + 1}/${maxRetries}):`, error.message)
        
        if (attempt === maxRetries - 1) {
          return res.status(500).json({
            success: false,
            error: `提交任务失败: ${error.message}`
          })
        }
      }
    }

    return res.status(500).json({
      success: false,
      error: '提交任务失败，已达最大重试次数'
    })

  } catch (error) {
    console.error('❌ 火山引擎图生图API错误:', error)
    res.status(500).json({
      success: false,
      error: error.message || '服务器错误'
    })
  }
})

/**
 * 火山引擎文生视频API（宣传视频）
 */
app.post('/api/volcengine/text-to-video', async (req, res) => {
  try {
    const { prompt, binary_data_base64, duration = 5, seed = -1, req_key, reqKey } = req.body
    const finalReqKey = req_key || reqKey || 'jimeng_t2v_v30_1080p'

    if (!prompt) {
      return res.status(400).json({ success: false, error: '提示词不能为空' })
    }

    console.log('🎬 开始调用火山引擎文生视频API...')
    console.log('📝 提示词:', prompt.substring(0, 50) + '...')
    console.log('⏱️ 时长:', duration, '秒')

    const fetch = (await import('node-fetch')).default

    // 提交任务（带重试机制）
    const maxRetries = 3
    const baseDelay = 2000
    let taskId = null

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          const delay = baseDelay * Math.pow(2, attempt - 1)
          console.log(`⏳ 等待 ${delay}ms 后重试 (第${attempt + 1}/${maxRetries}次)`)
          await new Promise(resolve => setTimeout(resolve, delay))
        }

        const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
        const host = 'visual.volcengineapi.com'
        const path = '/'
        const query = {
          Action: 'CVSync2AsyncSubmitTask',
          Version: '2022-08-31'
        }

        // 即梦AI使用frames参数，不是duration
        // frames = 24 * n + 1，其中n为秒数
        // 限制时长在1-10秒之间
        const clampedDuration = Math.max(1, Math.min(10, duration))
        const frames = 24 * clampedDuration + 1
        console.log(`⏱️ 时长: ${clampedDuration}秒 → ${frames}帧`)
        
        const requestBody = {
          req_key: finalReqKey,
          prompt: prompt,
          frames: frames,
          seed: seed
        }

        // 如果提供了参考图片，添加到请求中
        if (binary_data_base64 && Array.isArray(binary_data_base64) && binary_data_base64.length > 0) {
          requestBody.binary_data_base64 = binary_data_base64
          console.log('🖼️ 使用参考图片')
        }

        const bodyJson = JSON.stringify(requestBody)

        const headers = {
          'Host': host,
          'Content-Type': 'application/json',
          'X-Date': timestamp
        }

        const authorization = generateVolcEngineSignature('POST', path, query, headers, bodyJson, timestamp)
        headers['Authorization'] = authorization

        const submitUrl = `https://${host}${path}?${Object.keys(query).map(k => `${k}=${query[k]}`).join('&')}`

        console.log(`📤 提交视频生成任务 (尝试 ${attempt + 1}/${maxRetries})...`)
        const submitResponse = await fetch(submitUrl, {
          method: 'POST',
          headers: headers,
          body: bodyJson
        })

        if (!submitResponse.ok) {
          const errorText = await submitResponse.text()
          console.error('❌ 提交任务失败:', errorText)
          
          if (errorText.includes('50430') && attempt < maxRetries - 1) {
            console.warn('⚠️ API并发限制，准备重试...')
            continue
          }
          
          return res.status(submitResponse.status).json({
            success: false,
            error: `提交任务失败: ${errorText}`
          })
        }

        const submitData = await submitResponse.json()

        if (submitData.code === 50430 || submitData.status === 50430) {
          console.warn(`⚠️ API并发限制 [code=${submitData.code || submitData.status}]: ${submitData.message} (尝试 ${attempt + 1}/${maxRetries})`)
          if (attempt < maxRetries - 1) {
            continue
          } else {
            return res.status(429).json({
              success: false,
              error: `API并发限制，请稍后重试: ${submitData.message}`
            })
          }
        }

        const statusCode = submitData.code || submitData.status
        if (statusCode !== 10000) {
          console.error('❌ API返回错误 [code=' + statusCode + ']:', submitData.message)
          return res.status(400).json({
            success: false,
            error: submitData.message || 'API调用失败'
          })
        }

        // 视频生成通常是异步的，返回task_id
        if (submitData.data && submitData.data.task_id) {
          taskId = submitData.data.task_id
          console.log(`✅ 任务提交成功 (尝试 ${attempt + 1}/${maxRetries})`)
          console.log('🆔 任务ID:', taskId)
          break
        }

        // 如果是同步返回（某些情况下）
        if (submitData.data && submitData.data.video_url) {
          console.log(`✅ 视频生成成功 (同步模式)`)
          return res.json({
            success: true,
            videoUrl: submitData.data.video_url
          })
        }

        console.error('❌ API响应格式错误:', submitData)
        return res.status(500).json({
          success: false,
          error: 'API响应格式错误'
        })

      } catch (error) {
        console.error(`❌ 提交任务异常 (尝试 ${attempt + 1}/${maxRetries}):`, error.message)
        
        if (attempt === maxRetries - 1) {
          return res.status(500).json({
            success: false,
            error: `提交任务失败: ${error.message}`
          })
        }
      }
    }

    if (!taskId) {
      return res.status(500).json({
        success: false,
        error: '提交任务失败，已达最大重试次数'
      })
    }

    // 轮询查询视频生成结果
    console.log('🔄 开始轮询视频生成结果...')
    const maxAttempts = 600 // 10分钟
    const pollInterval = 1000

    for (let i = 0; i < maxAttempts; i++) {
      await new Promise(resolve => setTimeout(resolve, pollInterval))
      
      if (i % 30 === 0) {
        console.log(`🔄 查询视频状态 (${i + 1}/${maxAttempts})`)
      }

      try {
        const queryTimestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
        const queryBody = JSON.stringify({
          req_key: finalReqKey,
          task_id: taskId
        })

        const queryHeaders = {
          'Host': 'visual.volcengineapi.com',
          'Content-Type': 'application/json',
          'X-Date': queryTimestamp
        }

        const queryQuery = {
          Action: 'CVSync2AsyncGetResult',
          Version: '2022-08-31'
        }

        const queryAuth = generateVolcEngineSignature('POST', '/', queryQuery, queryHeaders, queryBody, queryTimestamp)
        queryHeaders['Authorization'] = queryAuth

        const queryUrl = `https://visual.volcengineapi.com/?Action=CVSync2AsyncGetResult&Version=2022-08-31`
        const queryResponse = await fetch(queryUrl, {
          method: 'POST',
          headers: queryHeaders,
          body: queryBody
        })

        if (!queryResponse.ok) {
          continue
        }

        const queryData = await queryResponse.json()
        const qStatusCode = queryData.code || queryData.status

        if (qStatusCode !== 10000) {
          continue
        }

        const status = queryData.data.status
        
        if (i % 30 === 0 && queryData.data.progress !== undefined) {
          console.log(`📊 生成进度: ${queryData.data.progress}%`)
        }

        if (status === 'done' && queryData.data.video_url) {
          const videoUrl = queryData.data.video_url
          console.log('✅ 视频生成成功! URL:', videoUrl)
          
          // 直接返回原始URL
          return res.json({
            success: true,
            videoUrl: videoUrl
          })
        } else if (status === 'failed') {
          const reason = queryData.data.reason || '未知原因'
          console.error('❌ 视频生成失败:', reason)
          return res.status(500).json({
            success: false,
            error: `生成失败: ${reason}`
          })
        }

      } catch (error) {
        console.warn(`⚠️ 查询异常:`, error.message)
      }
    }

    return res.status(408).json({
      success: false,
      error: '视频生成超时，请重试'
    })

  } catch (error) {
    console.error('❌ 火山引擎文生视频API错误:', error)
    res.status(500).json({
      success: false,
      error: error.message || '服务器错误'
    })
  }
})

/**
 * 视频下载端点 - 下载火山引擎视频到本地并提供访问
 */
app.post('/api/video/download', async (req, res) => {
  try {
    const { url } = req.body
    
    if (!url || typeof url !== 'string') {
      console.error('❌ 缺少URL参数')
      return res.status(400).json({ error: '缺少视频URL参数' })
    }

    console.log('📥 开始下载视频:', url.substring(0, 150))

    const fetch = (await import('node-fetch')).default
    const fs = await import('fs')
    const path = await import('path')
    
    // 创建临时目录
    const tempDir = path.join(__dirname, '../public/temp-videos')
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true })
    }
    
    // 生成唯一文件名
    const videoId = Date.now() + '-' + Math.random().toString(36).substring(7)
    const videoPath = path.join(tempDir, `${videoId}.mp4`)
    
    // 下载视频
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://www.volcengine.com/'
      }
    })

    if (!response.ok) {
      console.error('❌ 视频下载失败:', response.status, response.statusText)
      return res.status(response.status).json({ error: '视频下载失败' })
    }

    // 保存到本地
    const fileStream = fs.createWriteStream(videoPath)
    await new Promise((resolve, reject) => {
      response.body.pipe(fileStream)
      response.body.on('error', reject)
      fileStream.on('finish', resolve)
    })

    console.log('✅ 视频下载完成:', videoPath)
    
    // 返回本地访问URL
    const localUrl = `/temp-videos/${videoId}.mp4`
    res.json({
      success: true,
      url: localUrl,
      videoId
    })

  } catch (error) {
    console.error('❌ 视频下载错误:', error.message)
    res.status(500).json({ error: '视频下载失败: ' + error.message })
  }
})

/**
 * 健康检查
 */
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 Node.js后端服务器运行在 http://localhost:${PORT}`)
  console.log(`📋 百度 App ID: ${process.env.VITE_BAIDU_DH_APP_ID || '未配置'}`)
  console.log(`🔑 百度 App Key: ${process.env.VITE_BAIDU_DH_APP_KEY ? '已配置' : '未配置'}`)
  console.log(`🌋 火山引擎 Access Key: ${process.env.VITE_VOLC_ACCESS_KEY_ID ? '已配置' : '未配置'}`)
  console.log(`📡 可用API端点:`)
  console.log(`   - POST /api/digital-human/create - 百度数字人视频创建`)
  console.log(`   - GET  /api/digital-human/status/:taskId - 查询视频任务状态`)
  console.log(`   - POST /api/grsai/nano-banana - Grsai图像生成`)
  console.log(`   - POST /api/volcengine/text-to-image - 火山引擎文生图`)
  console.log(`   - POST /api/volcengine/image-to-image - 火山引擎图生图（软装布置）`)
  console.log(`   - POST /api/volcengine/text-to-video - 即梦AI文生视频（视频生成）`)
  console.log(`   - GET  /api/health - 健康检查`)
})
