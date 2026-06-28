import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'

const keyPath = path.resolve(__dirname, 'key.pem')
const certPath = path.resolve(__dirname, 'cert.pem')
const httpsEnabled = fs.existsSync(keyPath) && fs.existsSync(certPath)

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    include: ['xlsx'],
  },
  server: {
    host: true,
    port: 5173,
    ...(httpsEnabled ? {
      https: {
        key: fs.readFileSync(keyPath),
        cert: fs.readFileSync(certPath),
      },
    } : {}),
  },
})
