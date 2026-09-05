import { MoreVertical, ChevronDown, FileSpreadsheet, FileText } from 'lucide-react'
import { usePermission } from '@/hooks/usePermission'

interface ActionMenuProps {
  showActionMenu: boolean
  setShowActionMenu: (v: boolean) => void
  actionMenuRef: React.RefObject<HTMLDivElement | null>
  exportExcel: () => void
  setShowPDFModal: (v: boolean) => void
  isBn: boolean
}
export function ActionMenu({ showActionMenu, setShowActionMenu, actionMenuRef, exportExcel, setShowPDFModal, isBn }: ActionMenuProps) {
  const { canExport, canPrint } = usePermission()
  return (
    <div style={{ position: 'relative', display: 'flex', gap: '0.375rem' }}>
      <button
        onClick={() => setShowActionMenu(!showActionMenu)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.3125rem',
          padding: '7px 12px',
          borderRadius: '0.5rem',
          background: 'var(--brand-light)',
          border: '1px solid var(--brand)',
          color: 'var(--brand)',
          fontSize: '0.75rem',
          cursor: 'pointer',
          fontFamily: 'inherit',
          fontWeight: 500,
        }}
      >
        <MoreVertical size={13} />
        {isBn ? 'অ্যাকশন' : 'Action'}
        <ChevronDown size={12} />
      </button>
      {showActionMenu && (
        <div
          ref={actionMenuRef}
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: '0.375rem',
            background: 'var(--bg-primary)',
            border: '1px solid var(--border)',
            borderRadius: '0.5rem',
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            minWidth: '12.5rem',
            zIndex: 100,
            overflow: 'hidden',
          }}
        >
          {canExport('students.admission') && (
            <button
              onClick={() => {
                exportExcel()
                setShowActionMenu(false)
              }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.625rem 0.875rem',
                border: 'none',
                background: 'transparent',
                color: 'var(--text-primary)',
                fontSize: '0.8125rem',
                cursor: 'pointer',
                fontFamily: 'inherit',
                textAlign: 'left',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--green-light)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <FileSpreadsheet size={14} style={{ color: 'var(--green)' }} />
              {isBn ? 'এক্সেল ডাউনলোড' : 'Download Excel'}
            </button>
          )}
          <div style={{ height: '1px', background: 'var(--border)', margin: '0 0.5rem' }} />
          {canPrint('students.admission') && (
            <button
              onClick={() => {
                setShowPDFModal(true)
                setShowActionMenu(false)
              }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.625rem 0.875rem',
                border: 'none',
                background: 'transparent',
                color: 'var(--text-primary)',
                fontSize: '0.8125rem',
                cursor: 'pointer',
                fontFamily: 'inherit',
                textAlign: 'left',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--red-light)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <FileText size={14} style={{ color: 'var(--red)' }} />
              {isBn ? 'পিডিএফ ডাউনলোড' : 'Download PDF'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
