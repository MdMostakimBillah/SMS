declare module 'qrcode' {
  interface QRCodeOptions {
    width?: number
    margin?: number
    color?: {
      dark?: string
      light?: string
    }
    errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H'
    type?: 'image/png' | 'image/jpeg' | 'image/webp'
  }

  function toDataURL(text: string, options?: QRCodeOptions): Promise<string>
  function toDataURL(text: string, callback: (err: Error | null, url: string) => void): void
  function toDataURL(text: string, options: QRCodeOptions, callback: (err: Error | null, url: string) => void): void

  function toString(text: string, options?: QRCodeOptions): Promise<string>

  export { toDataURL, toString }
  export default { toDataURL, toString }
}
