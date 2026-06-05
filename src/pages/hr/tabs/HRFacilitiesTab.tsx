import { Briefcase, Users, HandCoins, Plus, Edit2, Trash2, Save, FileText } from 'lucide-react'
import { sectionCls, sectionTitleCls } from '@/pages/hr/utils'
import { PaginationControls } from '@/components/shared/PaginationControls'

interface HRFacilitiesTabProps {
  isBn: boolean
  isMobile: boolean
  teachers: any[]
  departments: any[]
  facilities: any[]
  teacherFacilities: any[]
  filteredAssignments: any[]
  paginatedAssignments: any[]
  selectedAssign: string[]
  setSelectedAssign: React.Dispatch<React.SetStateAction<string[]>>
  toggleAssign: (id: string) => void
  page: number
  setPage: (p: number | ((prev: number) => number)) => void
  perPage: number
  setPerPage: (n: number) => void
  assignmentTotalPages: number
  selectedFacStaff: string
  setSelectedFacStaff: (id: string) => void
  facStaffFilter: string
  setFacStaffFilter: (id: string) => void
  facStaffSearch: string
  setFacStaffSearch: (q: string) => void
  filteredFacStaff: any[]
  selectedStaffFacilities: any[]
  toggleStaffFacility: (facilityId: string) => void
  updateStaffFacilityAmount: (facilityId: string, amount: number) => void
  handleSaveStaffFacilities: () => void
  assignDateFrom: string
  setAssignDateFrom: (d: string) => void
  assignDateTo: string
  setAssignDateTo: (d: string) => void
  setFacModalType: (type: string) => void
  setFacForm: (form: any) => void
  setEditFac: (fac: any) => void
  setFacDeleteConfirm: (id: string | null) => void
  setAssignDeleteConfirm: (id: string | null) => void
  setShowPDFModal: (type: string) => void
  inputCls: string
}

export default function HRFacilitiesTab({
  isBn,
  isMobile,
  teachers,
  departments,
  facilities,
  filteredAssignments,
  paginatedAssignments,
  selectedAssign,
  setSelectedAssign,
  toggleAssign,
  page,
  setPage,
  perPage,
  setPerPage,
  assignmentTotalPages,
  selectedFacStaff,
  setSelectedFacStaff,
  facStaffFilter,
  setFacStaffFilter,
  facStaffSearch,
  setFacStaffSearch,
  filteredFacStaff,
  selectedStaffFacilities,
  toggleStaffFacility,
  updateStaffFacilityAmount,
  handleSaveStaffFacilities,
  assignDateFrom,
  setAssignDateFrom,
  assignDateTo,
  setAssignDateTo,
  setFacModalType,
  setFacForm,
  setEditFac,
  setFacDeleteConfirm,
  setAssignDeleteConfirm,
  setShowPDFModal,
  inputCls,
}: HRFacilitiesTabProps) {
  const facCls = sectionCls(isMobile)

  return (
    <>
      {/* Facility Definitions */}
      <div className={facCls}>
        <div className="flex justify-between items-center mb-[0.875rem] flex-wrap gap-2">
          <div className={sectionTitleCls}>
            <Briefcase size={15} className="text-[var(--purple)]" />
            {isBn ? 'সুবিধার ধরন' : 'Facility Types'}
          </div>
          <button
            onClick={() => {
              setFacForm({ name: '', nameBn: '', defaultAmount: '', type: 'monthly' })
              setEditFac(null)
              setFacModalType('add-facility')
            }}
            className="flex items-center gap-[0.3125rem] py-[0.4375rem] px-[0.875rem] rounded-lg bg-[var(--purple-light)] border border-[var(--purple)] text-[var(--purple)] text-xs font-medium cursor-pointer font-[inherit]"
          >
            <Plus size={14} />
            {isBn ? 'নতুন সুবিধা' : 'Add Facility'}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs min-w-[31.25rem]">
            <thead>
              <tr className="bg-[var(--bg-secondary)] border-b border-[var(--border)]">
                {[
                  { l: '#', w: '3.125rem', align: 'center' as const },
                  { l: isBn ? 'নাম (ইংরেজি)' : 'Name (EN)', align: 'left' as const },
                  { l: isBn ? 'নাম (বাংলা)' : 'Name (BN)', align: 'left' as const },
                  { l: isBn ? 'ধরন' : 'Type', w: '5.625rem', align: 'center' as const },
                  { l: isBn ? 'ডিফল্ট পরিমাণ' : 'Default Amount', w: '7.5rem', align: 'right' as const },
                  { l: isBn ? 'অবস্থা' : 'Status', w: '5rem', align: 'center' as const },
                  { l: isBn ? 'অ্যাকশন' : 'Action', w: '5.625rem', align: 'center' as const },
                ].map((h) => (
                  <th
                    key={h.l}
                    className="py-[0.625rem] px-2 h.align text-[0.625rem] font-semibold text-[var(--text-muted)] uppercase tracking-[0.025rem] whitespace-nowrap"
                  >
                    {h.l}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {facilities.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-[1.875rem] text-center text-[var(--text-muted)]">
                    <Briefcase size={24} className="block m-[0 auto 6px] opacity-30" />
                    {isBn ? 'কোনো সুবিধা পাওয়া যায়নি' : 'No facilities found'}
                  </td>
                </tr>
              ) : (
                facilities.map((f, i) => (
                  <tr
                    key={f.id}
                    className="border-b border-[var(--border)]"
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-secondary)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td className="py-[0.625rem] px-2 text-[var(--text-muted)] text-[0.6875rem] text-center">{i + 1}</td>
                    <td className="py-[0.625rem] px-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-md bg-[var(--purple-light)] flex items-center justify-center shrink-0">
                          <Briefcase size={13} className="text-[var(--purple)]" />
                        </div>
                        <span className="text-xs font-medium text-[var(--text-primary)]">{f.name}</span>
                      </div>
                    </td>
                    <td className="py-[0.625rem] px-2 text-xs text-[var(--text-secondary)]">{f.nameBn || '—'}</td>
                    <td className="py-[0.625rem] px-2 text-center">
                      <span
                        className={`text-[0.625rem] py-[0.125rem] px-2 rounded-full font-medium ${f.type === 'monthly' ? 'bg-[var(--brand-light)]' : 'bg-[var(--amber-light)]'} ${f.type === 'monthly' ? 'text-[var(--brand)]' : 'text-[var(--amber)]'}`}
                      >
                        {f.type === 'monthly' ? (isBn ? 'মাসিক' : 'Monthly') : isBn ? 'এককালীন' : 'One-time'}
                      </span>
                    </td>
                    <td className="py-[0.625rem] px-2 text-xs font-semibold text-[var(--text-primary)] text-right">
                      ৳{f.defaultAmount.toLocaleString()}
                    </td>
                    <td className="py-[0.625rem] px-2 text-center">
                      <span
                        className={`text-[0.625rem] py-[0.1875rem] px-2 rounded-full font-medium ${f.isActive ? 'bg-[var(--green-light)]' : 'bg-[var(--red-light)]'} ${f.isActive ? 'text-[var(--green)]' : 'text-[var(--red)]'}`}
                      >
                        {f.isActive ? (isBn ? 'সক্রিয়' : 'Active') : isBn ? 'নিষ্ক্রিয়' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-[0.625rem] px-2 text-center">
                      <div className="flex gap-1 justify-center">
                        <button
                          onClick={() => {
                            setFacForm({ name: f.name, nameBn: f.nameBn, defaultAmount: String(f.defaultAmount), type: f.type })
                            setEditFac(f)
                            setFacModalType('edit-facility')
                          }}
                          title={isBn ? 'এডিট' : 'Edit'}
                          className="w-[1.625rem] h-[1.625rem] rounded-md bg-[var(--amber-light)] border-none cursor-pointer flex items-center justify-center text-[var(--amber)]"
                        >
                          <Edit2 size={11} />
                        </button>
                        <button
                          onClick={() => setFacDeleteConfirm(f.id)}
                          title={isBn ? 'মুছুন' : 'Delete'}
                          className="w-[1.625rem] h-[1.625rem] rounded-md bg-[var(--red-light)] border-none cursor-pointer flex items-center justify-center text-[var(--red)]"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Staff Facility Panel — select staff and manage all their facilities */}
      <div className={facCls}>
        <div className="flex justify-between items-center mb-[0.875rem] flex-wrap gap-2">
          <div className={sectionTitleCls}>
            <Users size={15} className="text-[var(--brand)]" />
            {isBn ? 'কর্মচারী সুবিধা প্যানেল' : 'Staff Facility Panel'}
          </div>
        </div>

        {/* Staff selector + filters */}
        <div className={`grid gap-[0.625rem] mb-[0.875rem] ${isMobile ? 'grid-cols-1' : 'grid-cols-3'}`}>
          <div>
            <label className="text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-[0.3125rem] block">
              {isBn ? 'কর্মচারী নির্বাচন' : 'Select Staff'}
            </label>
            <select
              value={selectedFacStaff}
              onChange={(e) => setSelectedFacStaff(e.target.value)}
              className="w-full h-9 py-0 px-[0.625rem] rounded-md border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-xs font-[inherit] outline-none box-border appearance-auto"
            >
              <option value="">{isBn ? 'নির্বাচন করুন...' : 'Select staff...'}</option>
              {filteredFacStaff.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nameEn} ({t.designation})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-[0.3125rem] block">
              {isBn ? 'বিভাগ' : 'Department'}
            </label>
            <select
              value={facStaffFilter}
              onChange={(e) => setFacStaffFilter(e.target.value)}
              className="w-full h-9 py-0 px-[0.625rem] rounded-md border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-xs font-[inherit] outline-none box-border appearance-auto"
            >
              <option value="">{isBn ? 'সব বিভাগ' : 'All Departments'}</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {isBn ? d.nameBn : d.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-[0.3125rem] block">
              {isBn ? 'অনুসন্ধান' : 'Search'}
            </label>
            <input
              value={facStaffSearch}
              onChange={(e) => setFacStaffSearch(e.target.value)}
              className="w-full h-9 py-0 px-[0.625rem] rounded-md border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-xs font-[inherit] outline-none box-border"
              placeholder={isBn ? 'নাম, আইডি...' : 'Name, ID...'}
            />
          </div>
        </div>

        {/* Facility checklist for selected staff */}
        {selectedFacStaff && (
          <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-[0.625rem] p-[0.875rem]">
            <div className="flex justify-between items-center mb-3">
              <div>
                <div className="text-[0.8125rem] font-semibold text-[var(--text-primary)]">
                  {teachers.find((t) => t.id === selectedFacStaff)?.nameEn || ''}
                </div>
                <div className="text-[0.6875rem] text-[var(--text-muted)]">
                  {isBn ? 'সুবিধা চেক করুন এবং পরিমাণ সেট করুন' : 'Check facilities and set amounts'}
                </div>
              </div>
              <button
                onClick={handleSaveStaffFacilities}
                className="flex items-center gap-[0.3125rem] py-[0.4375rem] px-[0.875rem] rounded-lg bg-[var(--brand)] border-none text-white text-xs font-medium cursor-pointer font-[inherit]"
              >
                <Save size={13} />
                {isBn ? 'সংরক্ষণ' : 'Save'}
              </button>
            </div>

            <div className={`grid gap-2 ${isMobile ? 'grid-cols-1' : 'grid-cols-3'}`}>
              {selectedStaffFacilities.map((sf) => (
                <div
                  key={sf.facility.id}
                  className="flex items-center gap-[0.625rem] p-[0.625rem] rounded-lg bg-[var(--bg-primary)] transition-all"
                >
                  <input
                    type="checkbox"
                    checked={sf.assigned}
                    onChange={() => toggleStaffFacility(sf.facility.id)}
                    className="w-[0.9375rem] h-[0.9375rem] cursor-pointer accent-[var(--brand)] shrink-0"
                  />
                  <div className="flex-1 min-w-[0]">
                    <div className="text-xs font-medium text-[var(--text-primary)]">{isBn ? sf.facility.nameBn : sf.facility.name}</div>
                    <div className="text-[0.625rem] text-[var(--text-muted)]">{sf.facility.name}</div>
                  </div>
                  {sf.assigned && (
                    <div className="flex items-center gap-[0.1875rem] shrink-0">
                      <span className="text-[0.6875rem] text-[var(--text-muted)]">৳</span>
                      <input
                        type="number"
                        value={sf.amount}
                        onChange={(e) => updateStaffFacilityAmount(sf.facility.id, Number(e.target.value) || 0)}
                        className={`${inputCls} w-[4.375rem] py-1 px-[0.375rem] text-[0.6875rem] text-right`}
                        placeholder="0"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="mt-3 py-2 px-3 rounded-lg bg-[var(--bg-primary)] border border-[var(--border)] flex justify-between items-center">
              <span className="text-[0.6875rem] text-[var(--text-muted)]">
                {isBn ? 'মোট সুবিধা' : 'Total Facilities'}: {selectedStaffFacilities.filter((sf) => sf.assigned).length} /{' '}
                {facilities.length}
              </span>
              <span className="text-[0.8125rem] font-bold text-[var(--green)]">
                ৳
                {selectedStaffFacilities
                  .filter((sf) => sf.assigned)
                  .reduce((s, sf) => s + sf.amount, 0)
                  .toLocaleString()}
              </span>
            </div>
          </div>
        )}

        {!selectedFacStaff && (
          <div className="p-[1.875rem] text-center text-[var(--text-muted)] text-xs">
            <Users size={24} className="block m-[0 auto 8px] opacity-30" />
            {isBn ? 'একজন কর্মচারী নির্বাচন করুন তার সুবিধা দেখতে' : 'Select a staff member to manage their facilities'}
          </div>
        )}
      </div>

      {/* All Assignments Summary */}
      <div className={facCls}>
        <div className="flex justify-between items-center mb-[0.875rem] flex-wrap gap-2">
          <div className={sectionTitleCls}>
            <HandCoins size={15} className="text-[var(--teal)]" />
            {isBn ? 'সকল বরাদ্দ' : 'All Assignments'}
            <span className="text-[0.6875rem] font-medium text-[var(--text-muted)] ml-2">({filteredAssignments.length})</span>
          </div>
          <div className="flex gap-1.5 items-center shrink-0">
            <input
              type="date"
              value={assignDateFrom}
              onChange={(e) => {
                setAssignDateFrom(e.target.value)
                setPage(1)
              }}
              className={`${inputCls} w-[8.125rem] shrink-0 py-[0.3125rem] px-2 text-[0.6875rem]`}
            />
            <span className="text-[0.6875rem] text-[var(--text-muted)] shrink-0">—</span>
            <input
              type="date"
              value={assignDateTo}
              onChange={(e) => {
                setAssignDateTo(e.target.value)
                setPage(1)
              }}
              className={`${inputCls} w-[8.125rem] shrink-0 py-[0.3125rem] px-2 text-[0.6875rem]`}
            />
            {selectedAssign.length > 0 && (
              <button
                onClick={() => setShowPDFModal('assignment')}
                className="flex items-center gap-[0.3125rem] py-[0.375rem] px-[0.625rem] rounded-lg bg-[var(--red-light)] border border-[var(--red)] text-[var(--red)] text-[0.6875rem] font-medium cursor-pointer font-[inherit] shrink-0"
              >
                <FileText size={12} />
                PDF ({selectedAssign.length})
              </button>
            )}
          </div>
        </div>

        {filteredAssignments.length === 0 ? (
          <div className="p-5 text-center text-[var(--text-muted)] text-xs">{isBn ? 'কোনো বরাদ্দ নেই' : 'No assignments yet'}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs min-w-[34.375rem]">
              <thead>
                <tr className="bg-[var(--bg-secondary)] border-b border-[var(--border)]">
                  <th className="p-2 w-9">
                    <input
                      type="checkbox"
                      checked={selectedAssign.length === filteredAssignments.length && filteredAssignments.length > 0}
                      onChange={() =>
                        setSelectedAssign((p: string[]) =>
                          p.length === filteredAssignments.length ? [] : filteredAssignments.map((tf: any) => tf.id)
                        )
                      }
                      className="w-[0.8125rem] h-[0.8125rem] cursor-pointer accent-[var(--brand)]"
                    />
                  </th>
                  {[
                    { l: '#', w: '2.5rem', align: 'center' as const },
                    { l: isBn ? 'কর্মচারী' : 'Employee', align: 'left' as const },
                    { l: isBn ? 'সুবিধা' : 'Facility', align: 'left' as const },
                    { l: isBn ? 'পরিমাণ' : 'Amount', w: '6.25rem', align: 'right' as const },
                    { l: '', w: '3.75rem', align: 'center' as const },
                  ].map((h) => (
                    <th
                      key={h.l}
                      className={`p-2 text-[0.625rem] font-semibold text-[var(--text-muted)] uppercase tracking-[0.025rem] whitespace-nowrap ${h.align === 'center' ? 'text-center' : h.align === 'right' ? 'text-right' : 'text-left'}`}
                      style={h.w ? { width: h.w } : undefined}
                    >
                      {h.l}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedAssignments.map((tf, i) => {
                  const t = teachers.find((tx) => tx.id === tf.teacherId)
                  const fac = facilities.find((f) => f.id === tf.facilityId)
                  const isSelected = selectedAssign.includes(tf.id)
                  return (
                    <tr
                      key={tf.id}
                      className={`border-b border-b-[0.0313rem] border-[var(--border)] ${isSelected ? 'bg-[var(--brand-light)]' : 'bg-transparent'}`}
                      onMouseEnter={(e) => {
                        if (!isSelected) e.currentTarget.style.background = 'var(--bg-secondary)'
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) e.currentTarget.style.background = 'transparent'
                      }}
                    >
                      <td className="p-2">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleAssign(tf.id)}
                          className="w-[0.8125rem] h-[0.8125rem] cursor-pointer accent-[var(--brand)]"
                        />
                      </td>
                      <td className="p-2 text-[var(--text-muted)] text-[0.625rem] text-center">{i + 1}</td>
                      <td className="p-2 text-[0.6875rem] font-medium text-[var(--text-primary)]">{t?.nameEn || tf.teacherId}</td>
                      <td className="p-2 text-[0.6875rem] text-[var(--text-secondary)]">{isBn ? fac?.nameBn || fac?.name : fac?.name}</td>
                      <td className="p-2 text-[0.6875rem] font-semibold text-[var(--green)] text-right">৳{tf.amount.toLocaleString()}</td>
                      <td className="p-2 text-center">
                        <button
                          onClick={() => setAssignDeleteConfirm(tf.id)}
                          title={isBn ? 'মুছুন' : 'Delete'}
                          className="w-[1.375rem] h-[1.375rem] rounded-[0.3125rem] bg-[var(--red-light)] border-none cursor-pointer flex items-center justify-center text-[var(--red)]"
                        >
                          <Trash2 size={10} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="bg-[var(--bg-secondary)] border-t border-t-2 border-[var(--border)]">
                  <td colSpan={4} className="p-2 text-[0.6875rem] font-bold text-[var(--text-primary)]">
                    {isBn ? 'মোট' : 'Total'}
                  </td>
                  <td className="p-2 text-xs font-bold text-[var(--green)] text-right">
                    ৳{filteredAssignments.reduce((sum, tf) => sum + tf.amount, 0).toLocaleString()}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
        <PaginationControls
          page={page}
          setPage={(p) => typeof p === 'number' ? setPage(p) : setPage(p(page))}
          totalPages={assignmentTotalPages}
          total={filteredAssignments.length}
          perPage={perPage}
          setPerPage={setPerPage}
          isBn={isBn}
        />
        {selectedAssign.length > 0 && (
          <div className="mt-2 text-[0.6875rem] text-[var(--brand)] bg-[var(--brand-light)] py-1 px-[0.625rem] rounded-md inline-block">
            {selectedAssign.length} {isBn ? 'নির্বাচিত' : 'selected'}
          </div>
        )}
      </div>
    </>
  )
}
