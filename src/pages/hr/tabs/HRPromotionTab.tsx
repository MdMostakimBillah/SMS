import { Award, FileText, Plus, Edit2, Trash2 } from 'lucide-react'
import { PaginationControls } from '@/components/shared/PaginationControls'
import { DateRangeFilter } from '@/components/shared/DateRangeFilter'
import { sectionCls, sectionTitleCls } from '@/pages/hr/utils'

interface HRPromotionTabProps {
  isBn: boolean
  teachers: any[]
  promotions: any[]
  filteredPromotions: any[]
  paginatedPromotions: any[]
  selected: string[]
  toggle: (id: string) => void
  toggleAll: () => void
  page: number
  setPage: React.Dispatch<React.SetStateAction<number>>
  perPage: number
  setPerPage: (n: number) => void
  totalPages: number
  proDateFrom: string
  setProDateFrom: (v: string) => void
  proDateTo: string
  setProDateTo: (v: string) => void
  setModalType: (type: string) => void
  setProForm: (form: any) => void
  deletePromotion: (id: string) => void
  setShowPDFModal: (type: string) => void
  getTeacherName: (id: string) => string
}

export default function HRPromotionTab({
  isBn,
  filteredPromotions,
  paginatedPromotions,
  selected,
  toggle,
  toggleAll,
  page,
  setPage,
  perPage,
  setPerPage,
  totalPages,
  proDateFrom,
  setProDateFrom,
  proDateTo,
  setProDateTo,
  setModalType,
  setProForm,
  deletePromotion,
  setShowPDFModal,
  getTeacherName,
}: HRPromotionTabProps) {
  return (
    <div className={sectionCls(false)}>
      <div className="flex justify-between items-center mb-[14px]">
        <div className={sectionTitleCls}>
          <Award size={15} className="text-[var(--purple)]" />
          {isBn ? 'পদোন্নতি' : 'Promotions'}
        </div>
        <div className="flex gap-1.5">
          <button
            onClick={() => setShowPDFModal('promotion')}
            className="flex items-center gap-[5px] py-[7px] px-3 rounded-lg bg-[var(--red-light)] border border-[var(--red)] text-[var(--red)] text-xs font-medium cursor-pointer font-[inherit]"
          >
            <FileText size={13} />
            PDF
          </button>
          <button
            onClick={() => setModalType('promotion')}
            className="flex items-center gap-[5px] py-[7px] px-[14px] rounded-lg bg-[var(--purple)] border-none text-white text-xs font-medium cursor-pointer font-[inherit]"
          >
            <Plus size={14} />
            {isBn ? 'যোগ' : 'Add'}
          </button>
        </div>
      </div>
      <DateRangeFilter
        dateFrom={proDateFrom}
        dateTo={proDateTo}
        setDateFrom={(v) => {
          setProDateFrom(v)
          setPage(1)
        }}
        setDateTo={(v) => {
          setProDateTo(v)
          setPage(1)
        }}
        onReset={() => setPage(1)}
        isBn={isBn}
        variant="compact"
      />
      {filteredPromotions.length === 0 ? (
        <div className="p-[30px] text-center text-[var(--text-muted)] text-[13px]">
          {isBn ? 'কোনো পদোন্নতি নেই' : 'No promotions yet'}
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-xs min-w-[600px]">
              <thead>
                <tr className="bg-[var(--bg-secondary)] border-b border-[var(--border)]">
                  <th className="py-[10px] px-2 w-9">
                    <input
                      type="checkbox"
                      checked={selected.length === filteredPromotions.length && filteredPromotions.length > 0}
                      onChange={toggleAll}
                      className="w-[13px] h-[13px] cursor-pointer accent-[var(--brand)]"
                    />
                  </th>
                  {[
                    isBn ? 'তারিখ' : 'Date',
                    isBn ? 'শিক্ষক' : 'Teacher',
                    isBn ? 'পূর্ববর্তী' : 'From',
                    isBn ? 'নতুন' : 'To',
                    isBn ? 'কারণ' : 'Reason',
                    '',
                  ].map((h) => (
                    <th
                      key={h || 'action'}
                      className={`py-[10px] px-2 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-[0.4px] whitespace-nowrap ${h === '' ? 'text-center w-[80px]' : 'text-left'}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedPromotions.map((p) => (
                  <tr
                    key={p.id}
                    className={`border-b border-[var(--border)] ${selected.includes(p.id) ? 'bg-[rgba(99,102,241,0.04)]' : 'bg-transparent'}`}
                    onMouseEnter={(e) => {
                      if (!selected.includes(p.id)) e.currentTarget.style.background = 'var(--bg-secondary)'
                    }}
                    onMouseLeave={(e) => {
                      if (!selected.includes(p.id)) e.currentTarget.style.background = 'transparent'
                    }}
                  >
                    <td className="py-2 px-2">
                      <input
                        type="checkbox"
                        checked={selected.includes(p.id)}
                        onChange={() => toggle(p.id)}
                        className="w-[13px] h-[13px] cursor-pointer accent-[var(--brand)]"
                      />
                    </td>
                    <td className="py-2 px-2 text-[11px] text-[var(--text-muted)]">{p.date}</td>
                    <td className="py-2 px-2 text-xs font-medium text-[var(--text-primary)]">{getTeacherName(p.teacherId)}</td>
                    <td className="py-2 px-2 text-[11px] text-[var(--text-secondary)]">{p.fromDesignation}</td>
                    <td className="py-2 px-2 text-xs font-semibold text-[var(--green)]">{p.toDesignation}</td>
                    <td className="py-2 px-2 text-[11px] text-[var(--text-secondary)]">{p.reason}</td>
                    <td className="py-2 px-2 text-center">
                      <div className="flex gap-1 justify-center">
                        <button
                          onClick={() => {
                            setProForm({
                              teacherId: p.teacherId,
                              fromDesignation: p.fromDesignation,
                              toDesignation: p.toDesignation,
                              reason: p.reason,
                            })
                            setModalType('promotion')
                          }}
                          className="py-1 px-2 rounded border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] cursor-pointer text-[10px] font-[inherit]"
                        >
                          <Edit2 size={11} />
                        </button>
                        <button
                          onClick={() => deletePromotion(p.id)}
                          className="py-1 px-2 rounded border border-[var(--red)] bg-[var(--red-light)] text-[var(--red)] cursor-pointer text-[10px] font-[inherit]"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <PaginationControls
            page={page}
            setPage={setPage}
            perPage={perPage}
            setPerPage={setPerPage}
            total={filteredPromotions.length}
            totalPages={totalPages}
            isBn={isBn}
          />
          {selected.length > 0 && (
            <div className="mt-2 text-[11px] text-[var(--brand)] bg-[var(--brand-light)] py-1 px-[10px] rounded-md inline-block">
              {selected.length} {isBn ? 'নির্বাচিত' : 'selected'}
            </div>
          )}
        </>
      )}
    </div>
  )
}
