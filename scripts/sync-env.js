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

// 2. Sync client-safe vars from local .env to .env.production (git-tracked)
try {
  const envPath = path.join(rootDir, '.env')
  const prodEnvPath = path.join(rootDir, '.env.production')
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8')
    let prodContent = fs.existsSync(prodEnvPath) ? fs.readFileSync(prodEnvPath, 'utf-8') : ''
    
    const syncVar = (key, fallbackMatch) => {
      const match = envContent.match(fallbackMatch || new RegExp(`^${key}\\s*=\\s*(.+)$`, 'm'))
      if (match) {
        const val = match[1].trim().replace(/^["']|["']$/g, '')
        const keyRegex = new RegExp(`^${key}\\s*=.*$`, 'm')
        if (keyRegex.test(prodContent)) {
          prodContent = prodContent.replace(keyRegex, `${key}=${val}`)
        } else {
          prodContent += `\n${key}=${val}\n`
        }
      }
    }

    syncVar('VITE_LOGIN_PATH')
    syncVar('VITE_SUPER_ADMIN_EMAIL', /^(?:VITE_)?SUPER_ADMIN_EMAIL\s*=\s*(.+)$/m)
    syncVar('VITE_EMAILJS_SERVICE_ID')
    syncVar('VITE_EMAILJS_TEMPLATE_ID')
    syncVar('VITE_EMAILJS_PUBLIC_KEY')

    fs.writeFileSync(prodEnvPath, prodContent.trim() + '\n')
  }
} catch {
  // ignore
}
