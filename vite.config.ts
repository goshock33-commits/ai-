import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // 显式加载环境变量
  const env = loadEnv(mode, process.cwd(), '')
  
  // 调试：打印环境变量
  console.log('🔍 Vite 加载的环境变量:')
  console.log('  - VITE_GRSAI_API_KEY:', env.VITE_GRSAI_API_KEY ? `${env.VITE_GRSAI_API_KEY.substring(0, 10)}...` : '❌ 未找到')
  console.log('  - Mode:', mode)
  console.log('  - CWD:', process.cwd())
  
  return {
    plugins: [vue()],
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
      },
    },
    server: {
      proxy: {
        // 代理302.AI API请求
        '/api/302ai': {
          target: 'https://api.302.ai',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/302ai/, ''),
          configure: (proxy) => {
            proxy.on('proxyReq', (_proxyReq, req) => {
              console.log('🔄 代理请求:', req.method, req.url)
            })
          }
        }
      }
    },
    build: {
      target: 'es2015',
      minify: 'terser',
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor': ['vue', 'vue-router', 'pinia'],
            'ui': ['element-plus'],
          }
        }
      }
    },
    optimizeDeps: {
      include: ['vue', 'vue-router', 'pinia', 'element-plus']
    }
  }
})
