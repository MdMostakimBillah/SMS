import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'
import { brandLogoAnimatedSVG } from './src/lib/brandLogo'

const keyPath = path.resolve(__dirname, 'key.pem')
const certPath = path.resolve(__dirname, 'cert.pem')
const httpsEnabled = fs.existsSync(keyPath) && fs.existsSync(certPath)

// Regenerate public/favicon.svg from the shared brand-logo source. Running it
// here (rather than as a one-off commit) means the tab icon always carries the
// same artwork and the same animation timing as every BrandLogo in the app.
const faviconPath = path.resolve(__dirname, 'public/favicon.svg')
const faviconSVG = brandLogoAnimatedSVG()
if (!fs.existsSync(faviconPath) || fs.readFileSync(faviconPath, 'utf8') !== faviconSVG) {
  fs.writeFileSync(faviconPath, faviconSVG)
}

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
  },
  optimizeDeps: {
    include: ['exceljs'],
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
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
