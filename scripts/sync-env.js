import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')

// 1. Write public/version.txt
try {
  const versionPath = path.join(rootDir, 'public', 'version.txt')
  fs.writeFileSync(versionPath, String(Date.now()))
} catch {
  // ignore
}

// 2. Sync client-safe VITE_LOGIN_PATH from local .env to .env.production (git-tracked)
try {
  const envPath = path.join(rootDir, '.env')
  const prodEnvPath = path.join(rootDir, '.env.production')
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8')
    const match = envContent.match(/^VITE_LOGIN_PATH\s*=\s*(.+)$/m)
    if (match) {
      const loginPathVal = match[1].trim()
      let prodContent = fs.existsSync(prodEnvPath) ? fs.readFileSync(prodEnvPath, 'utf-8') : ''
      if (/^VITE_LOGIN_PATH\s*=/m.test(prodContent)) {
        prodContent = prodContent.replace(/^VITE_LOGIN_PATH\s*=.*$/m, `VITE_LOGIN_PATH=${loginPathVal}`)
      } else {
        prodContent += `\n# Production frontend environment configuration (safe for git)\nVITE_LOGIN_PATH=${loginPathVal}\n`
      }
      fs.writeFileSync(prodEnvPath, prodContent.trim() + '\n')
    }
  }
} catch {
  // ignore
}
