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

// 2. Sync client-safe VITE_LOGIN_PATH & VITE_SUPER_ADMIN_EMAIL from local .env to .env.production (git-tracked)
try {
  const envPath = path.join(rootDir, '.env')
  const prodEnvPath = path.join(rootDir, '.env.production')
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8')
    let prodContent = fs.existsSync(prodEnvPath) ? fs.readFileSync(prodEnvPath, 'utf-8') : ''
    
    const matchPath = envContent.match(/^VITE_LOGIN_PATH\s*=\s*(.+)$/m)
    if (matchPath) {
      const loginPathVal = matchPath[1].trim().replace(/^["']|["']$/g, '')
      if (/^VITE_LOGIN_PATH\s*=/m.test(prodContent)) {
        prodContent = prodContent.replace(/^VITE_LOGIN_PATH\s*=.*$/m, `VITE_LOGIN_PATH=${loginPathVal}`)
      } else {
        prodContent += `\nVITE_LOGIN_PATH=${loginPathVal}\n`
      }
    }

    const matchEmail = envContent.match(/^(?:VITE_)?SUPER_ADMIN_EMAIL\s*=\s*(.+)$/m)
    if (matchEmail) {
      const emailVal = matchEmail[1].trim().replace(/^["']|["']$/g, '')
      if (/^VITE_SUPER_ADMIN_EMAIL\s*=/m.test(prodContent)) {
        prodContent = prodContent.replace(/^VITE_SUPER_ADMIN_EMAIL\s*=.*$/m, `VITE_SUPER_ADMIN_EMAIL=${emailVal}`)
      } else {
        prodContent += `\nVITE_SUPER_ADMIN_EMAIL=${emailVal}\n`
      }
    }

    fs.writeFileSync(prodEnvPath, prodContent.trim() + '\n')
  }
} catch {
  // ignore
}
