import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // السماح للأجهزة الأخرى على الشبكة المحلية بفتح نسخة التطوير
  server: {
    host: true,
    port: 5173,
  },
})
