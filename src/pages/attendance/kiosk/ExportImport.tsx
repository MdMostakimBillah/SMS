import { useState } from 'react'
import { Download, Upload, Lock } from 'lucide-react'
import { exportFaces, importFaces, downloadBlob, mergeFaces } from '@/lib/faceExport'
import { logAuditEvent } from '@/lib/faceAudit'
import type { RegisteredFace } from '@/hooks/useFaceApi'

interface ExportImportProps {
  isBn: boolean
  faces: RegisteredFace[]
  onImport: (faces: RegisteredFace[]) => void
}

export default function ExportImport({ isBn, faces, onImport }: ExportImportProps) {
  const [exportPassword, setExportPassword] = useState('')
  const [importPassword, setImportPassword] = useState('')
  const [importFile, setImportFile] = useState<File | null>(null)
  const [status, setStatus] = useState<'idle' | 'exporting' | 'importing' | 'done' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const handleExport = async () => {
    if (!exportPassword) return
    setStatus('exporting')
    try {
      const blob = await exportFaces(exportPassword, faces)
      downloadBlob(blob, `edutech-faces-${new Date().toISOString().slice(0, 10)}.json`)
      logAuditEvent({ type: 'exported', faceCount: faces.length })
      setStatus('done')
      setExportPassword('')
      setTimeout(() => setStatus('idle'), 2000)
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Export failed')
      setStatus('error')
    }
  }

  const handleImport = async () => {
    if (!importFile || !importPassword) return
    setStatus('importing')
    try {
      const imported = await importFaces(importFile, importPassword)
      const merged = mergeFaces(faces, imported)
      onImport(merged)
      logAuditEvent({ type: 'imported', faceCount: imported.length })
      setStatus('done')
      setImportFile(null)
      setImportPassword('')
      setTimeout(() => setStatus('idle'), 2000)
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Import failed — wrong password?')
      setStatus('error')
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div className="border border-[var(--border)] rounded-xl bg-[var(--bg-primary)] p-4">
        <div className="flex items-center gap-2 mb-3">
          <Download size={14} className="text-[var(--brand)]" />
          <span className="text-[0.8125rem] font-semibold text-[var(--text-primary)]">
            {isBn ? 'এক্সপোর্ট' : 'Export'}
          </span>
        </div>
        <div className="text-[0.6875rem] text-[var(--text-muted)] mb-3">
          {isBn ? 'নিবন্ধিত মুখ এনক্রিপ্ট করে ডাউনলোড করুন' : 'Download encrypted face enrollments'}
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-2.5 py-2">
            <Lock size={12} className="text-[var(--text-muted)] shrink-0" />
            <input
              type="password"
              value={exportPassword}
              onChange={(e) => setExportPassword(e.target.value)}
              placeholder={isBn ? 'পাসওয়ার্ড' : 'Password'}
              className="flex-1 border-none bg-transparent outline-none text-[0.75rem] text-[var(--text-primary)]"
            />
          </div>
          <button
            onClick={handleExport}
            disabled={!exportPassword || status === 'exporting'}
            className="w-full py-2 rounded-lg text-[0.75rem] font-semibold bg-[var(--brand)] text-white border-none cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Download size={12} />
            {status === 'exporting'
              ? isBn ? 'এক্সপোর্ট হচ্ছে...' : 'Exporting...'
              : isBn ? `এক্সপোর্ট (${faces.length})` : `Export (${faces.length})`}
          </button>
        </div>
      </div>

      <div className="border border-[var(--border)] rounded-xl bg-[var(--bg-primary)] p-4">
        <div className="flex items-center gap-2 mb-3">
          <Upload size={14} className="text-[var(--green)]" />
          <span className="text-[0.8125rem] font-semibold text-[var(--text-primary)]">
            {isBn ? 'ইমপোর্ট' : 'Import'}
          </span>
        </div>
        <div className="text-[0.6875rem] text-[var(--text-muted)] mb-3">
          {isBn ? 'এনক্রিপ্টেড ফাইল থেকে মুখ আমদানি করুন' : 'Import faces from encrypted file'}
        </div>
        <div className="space-y-2">
          <input
            type="file"
            accept=".json"
            onChange={(e) => setImportFile(e.target.files?.[0] || null)}
            className="w-full text-[0.6875rem] text-[var(--text-muted)] file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[0.625rem] file:font-semibold file:bg-[var(--bg-secondary)] file:text-[var(--text-secondary)]"
          />
          <div className="flex items-center gap-1.5 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-2.5 py-2">
            <Lock size={12} className="text-[var(--text-muted)] shrink-0" />
            <input
              type="password"
              value={importPassword}
              onChange={(e) => setImportPassword(e.target.value)}
              placeholder={isBn ? 'পাসওয়ার্ড' : 'Password'}
              className="flex-1 border-none bg-transparent outline-none text-[0.75rem] text-[var(--text-primary)]"
            />
          </div>
          <button
            onClick={handleImport}
            disabled={!importFile || !importPassword || status === 'importing'}
            className="w-full py-2 rounded-lg text-[0.75rem] font-semibold bg-[var(--green)] text-white border-none cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Upload size={12} />
            {status === 'importing'
              ? isBn ? 'ইমপোর্ট হচ্ছে...' : 'Importing...'
              : isBn ? 'ইমপোর্ট' : 'Import'}
          </button>
        </div>
        {status === 'error' && (
          <div className="mt-2 text-[0.6875rem] text-[var(--red)]">{errorMsg}</div>
        )}
        {status === 'done' && (
          <div className="mt-2 text-[0.6875rem] text-[var(--green)]">
            {isBn ? 'সফল!' : 'Done!'}
          </div>
        )}
      </div>
    </div>
  )
}
