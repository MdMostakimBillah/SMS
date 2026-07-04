import { useState } from 'react'
import { Clock, Download, Trash2 } from 'lucide-react'
import { getAuditLog, clearAuditLog, exportAuditLog, type AuditEvent } from '@/lib/faceAudit'

interface AuditLogProps {
  isBn: boolean
}

const EVENT_LABELS: Record<string, { en: string; bn: string }> = {
  enrolled: { en: 'Enrolled', bn: 'নিবন্ধিত' },
  recognized: { en: 'Recognized', bn: 'শনাক্ত' },
  rejected: { en: 'Rejected', bn: 'প্রত্যাখ্ত' },
  deleted: { en: 'Deleted', bn: 'মুছে ফেলা' },
  exported: { en: 'Exported', bn: 'রপ্তানি' },
  imported: { en: 'Imported', bn: 'আমদানি' },
}

export default function AuditLog({ isBn }: AuditLogProps) {
  const [open, setOpen] = useState(false)
  const [log, setLog] = useState<AuditEvent[]>([])
  const [cleared, setCleared] = useState(false)

  const refresh = () => {
    setLog(getAuditLog(50))
    setCleared(false)
  }

  const handleOpen = () => {
    if (!open) refresh()
    setOpen(!open)
  }

  const handleClear = () => {
    clearAuditLog()
    setCleared(true)
    setLog([])
  }

  const handleExport = () => {
    const data = exportAuditLog()
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `face-audit-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="border border-[var(--border)] rounded-xl bg-[var(--bg-primary)] overflow-hidden">
      <button
        onClick={handleOpen}
        className="w-full flex items-center justify-between px-4 py-3 border-b border-[var(--border)] cursor-pointer bg-transparent border-l-0 border-r-0 border-t-0 hover:bg-[var(--bg-secondary)]/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Clock size={14} className="text-[var(--brand)]" />
          <span className="text-[0.8125rem] font-semibold text-[var(--text-primary)]">
            {isBn ? 'অডিট লগ' : 'Audit Log'}
          </span>
          {log.length > 0 && (
            <span className="text-[0.625rem] text-[var(--text-muted)]">({log.length})</span>
          )}
        </div>
        <div className="text-[0.625rem] text-[var(--text-muted)]">
          {open ? '▲' : '▼'}
        </div>
      </button>

      {open && (
        <div className="p-3">
          <div className="flex gap-2 mb-3">
            <button
              onClick={refresh}
              className="px-3 py-1.5 rounded-lg text-[0.625rem] font-semibold bg-[var(--bg-secondary)] text-[var(--text-secondary)] border border-[var(--border)] cursor-pointer hover:bg-[var(--bg-primary)] transition-colors"
            >
              {isBn ? 'রিফ্রেশ' : 'Refresh'}
            </button>
            <button
              onClick={handleExport}
              className="px-3 py-1.5 rounded-lg text-[0.625rem] font-semibold bg-[var(--bg-secondary)] text-[var(--text-secondary)] border border-[var(--border)] cursor-pointer hover:bg-[var(--bg-primary)] transition-colors flex items-center gap-1"
            >
              <Download size={10} />
              {isBn ? 'রপ্তানি' : 'Export'}
            </button>
            <button
              onClick={handleClear}
              className="px-3 py-1.5 rounded-lg text-[0.625rem] font-semibold bg-[var(--red-light)] text-[var(--red)] border border-transparent cursor-pointer hover:bg-[var(--red)] hover:text-white transition-all flex items-center gap-1"
            >
              <Trash2 size={10} />
              {isBn ? 'পরিষ্কার' : 'Clear'}
            </button>
          </div>

          {cleared && (
            <div className="text-center py-4 text-[0.75rem] text-[var(--text-muted)]">
              {isBn ? 'লগ পরিষ্কার হয়েছে' : 'Log cleared'}
            </div>
          )}

          {!cleared && log.length === 0 && (
            <div className="text-center py-4 text-[0.75rem] text-[var(--text-muted)]">
              {isBn ? 'কোনো লগ নেই' : 'No audit entries'}
            </div>
          )}

          {!cleared && log.length > 0 && (
            <div className="max-h-[200px] overflow-auto">
              {log.slice().reverse().map((event, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 py-2 border-b border-[var(--border)] last:border-0"
                >
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    event.type === 'enrolled' ? 'bg-[var(--green)]'
                      : event.type === 'recognized' ? 'bg-[var(--teal)]'
                        : event.type === 'rejected' ? 'bg-[var(--red)]'
                          : 'bg-[var(--text-muted)]'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[0.6875rem] font-medium text-[var(--text-primary)]">
                      {isBn ? EVENT_LABELS[event.type]?.bn : EVENT_LABELS[event.type]?.en}
                      {event.personName && (
                        <span className="text-[var(--text-muted)] ml-1">— {event.personName}</span>
                      )}
                    </div>
                    <div className="text-[0.5625rem] text-[var(--text-muted)]">
                      {event.confidence != null && `${(event.confidence * 100).toFixed(0)}% `}
                      {event.qualityScore != null && `Q:${event.qualityScore} `}
                      {event.reason && event.reason}
                    </div>
                  </div>
                  <div className="text-[0.5625rem] text-[var(--text-muted)] font-mono shrink-0">
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
