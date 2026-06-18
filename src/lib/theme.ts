function hexToHSL(hex: string): { h: number; s: number; l: number } {
  let r = parseInt(hex.slice(1, 3), 16) / 255
  let g = parseInt(hex.slice(3, 5), 16) / 255
  let b = parseInt(hex.slice(5, 7), 16) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
    }
  }

  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) }
}

function hslToString(h: number, s: number, l: number): string {
  return `hsl(${h}, ${s}%, ${l}%)`
}

function hslA(h: number, s: number, l: number, a: number): string {
  return `hsla(${h}, ${s}%, ${l}%, ${a})`
}

export function applyThemeColor(hex: string) {
  if (!hex || !/^#[0-9a-fA-F]{6}$/.test(hex)) return

  const { h, s, l } = hexToHSL(hex)
  const root = document.documentElement

  // Light theme
  const brand2Light = hslToString(h, Math.min(s, 80), Math.min(l + 12, 75))

  root.style.setProperty('--brand', hex)
  root.style.setProperty('--brand-2', brand2Light)
  root.style.setProperty('--brand-light', hslA(h, Math.min(s, 80), Math.min(l + 38, 97), 1))

  // Dark theme
  const brandDark = hslToString(h, Math.min(s, 70), Math.min(l + 20, 80))
  const brand2Dark = hslToString(h, Math.min(s, 65), Math.min(l + 30, 90))

  const sheet = document.getElementById('theme-overrides') as HTMLStyleElement | null
  const style = sheet || document.createElement('style')
  style.id = 'theme-overrides'
  style.textContent = `
    [data-theme="light"] {
      --brand: ${hex};
      --brand-2: ${brand2Light};
      --brand-light: ${hslA(h, Math.min(s, 80), Math.min(l + 38, 97), 1)};
    }
    [data-theme="dark"] {
      --brand: ${brandDark};
      --brand-2: ${brand2Dark};
      --brand-light: ${hslA(h, Math.min(s, 60), Math.min(l + 20, 80), 0.1)};
    }
  `
  if (!sheet) document.head.appendChild(style)
}
