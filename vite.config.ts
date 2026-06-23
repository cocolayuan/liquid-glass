import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages 部署在 /liquid-glass/ 子路径下；本地 dev 用 '/'
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/liquid-glass/' : '/',
  plugins: [react()],
}))
