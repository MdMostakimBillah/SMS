import { X, Save } from 'lucide-react'
import { modalOverlayCls, modalStyleCls, inputCls, labelCls } from '@/pages/hr/utils'
import { HRPDFOptionsModal } from '@/components/shared/HRPDFOptionsModal'
import { DeleteConfirmDialog } from '@/components/shared/DeleteConfirmDialog'
import type { Teacher } from '@/pages/teachers/types'
import type { Facility } from '@/store/hrStore'

interface HRModalsProps {
  modalType: 'increment' | 'bonus' | 'promotion' | 'fund' | null
  setModalType: (v: 'increment' | 'bonus' | 'promotion' | 'fund' | null) => void
  incForm: { teacherId: string; type: 'annual' | 'performance' | 'special'; percentage: string; reason: string }
  setIncForm: React.Dispatch<React.SetStateAction<{ teacherId: string; type: 'annual' | 'performance' | 'special'; percentage: string; reason: string }>>
  bonForm: { teacherId: string; type: 'festival' | 'performance' | 'attendance' | 'special'; amount: string; reason: string; month: string }
  setBonForm: React.Dispatch<React.SetStateAction<{ teacherId: string; type: 'festival' | 'performance' | 'attendance' | 'special'; amount: string; reason: string; month: string }>>
  proForm: { teacherId: string; fromDesignation: string; toDesignation: string; reason: string }
  setProForm: React.Dispatch<React.SetStateAction<{ teacherId: string; fromDesignation: string; toDesignation: string; reason: string }>>
  fundForm: { type: 'contribution' | 'bonus_pool' | 'increment_pool' | 'withdrawal'; amount: string; description: string }
  setFundForm: React.Dispatch<React.SetStateAction<{ type: 'contribution' | 'bonus_pool' | 'increment_pool' | 'withdrawal'; amount: string; description: string }>>
  activeTeachers: Teacher[]
  allDesignations: string[]
  handleAddIncrement: () => void
  handleAddBonus: () => void
  handleAddPromotion: () => void
  handleAddFund: () => void

  showPDFModal: 'increment' | 'bonus' | 'promotion' | 'fund' | 'assignment' | 'salary' | null
  setShowPDFModal: (v: 'increment' | 'bonus' | 'promotion' | 'fund' | 'assignment' | 'salary' | null) => void
  increments: unknown[]
  filteredBonuses: unknown[]
  filteredPromotions: unknown[]
  filteredAssignments: unknown[]
  funds: unknown[]
  handlePDFDownload: (type: string, opts: unknown) => void

  facModalType: 'add-facility' | 'edit-facility' | 'assign' | 'edit-assign' | null
  setFacModalType: (v: 'add-facility' | 'edit-facility' | 'assign' | 'edit-assign' | null) => void
  facForm: { name: string; nameBn: string; defaultAmount: string; type: 'monthly' | 'oneTime' }
  setFacForm: React.Dispatch<React.SetStateAction<{ name: string; nameBn: string; defaultAmount: string; type: 'monthly' | 'oneTime' }>>
  editFac: Facility | null
  setEditFac: (v: Facility | null) => void
  handleAddFacility: () => void
  handleEditFacility: () => void

  assignForm: { teacherId: string; facilityId: string; amount: string }
  setAssignForm: React.Dispatch<React.SetStateAction<{ teacherId: string; facilityId: string; amount: string }>>
  editAssign: { id: string; teacherId: string; facilityId: string; amount: number } | null
  setEditAssign: (v: { id: string; teacherId: string; facilityId: string; amount: number } | null) => void
  facilities: Facility[]
  handleAssignFacility: () => void
  handleEditAssign: () => void

  facDeleteConfirm: string | null
  setFacDeleteConfirm: (v: string | null) => void
  deleteFacility: (id: string) => void

  assignDeleteConfirm: string | null
  setAssignDeleteConfirm: (v: string | null) => void
  removeTeacherFacility: (id: string) => void

  isBn: boolean
  isMobile: boolean
}

export default function HRModals({
  modalType,
  setModalType,
  incForm,
  setIncForm,
  bonForm,
  setBonForm,
  proForm,
  setProForm,
  fundForm,
  setFundForm,
  activeTeachers,
  allDesignations,
  handleAddIncrement,
  handleAddBonus,
  handleAddPromotion,
  handleAddFund,
  showPDFModal,
  setShowPDFModal,
  increments,
  filteredBonuses,
  filteredPromotions,
  filteredAssignments,
  funds,
  handlePDFDownload,
  facModalType,
  setFacModalType,
  facForm,
  setFacForm,
  editFac: _editFac,
  setEditFac,
  handleAddFacility,
  handleEditFacility,
  assignForm,
  setAssignForm,
  editAssign: _editAssign,
  setEditAssign,
  facilities,
  handleAssignFacility,
  handleEditAssign,
  facDeleteConfirm,
  setFacDeleteConfirm,
  deleteFacility,
  assignDeleteConfirm,
  setAssignDeleteConfirm,
  removeTeacherFacility,
  isBn,
  isMobile: _isMobile,
}: HRModalsProps) {
  return (
    <>
      {/* ─── MODAL ─── */}
      {modalType && (
        <div className={modalOverlayCls} onClick={() => setModalType(null)}>
          <div className={`modal-content ${modalStyleCls}`} onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-base font-semibold text-[var(--text-primary)]">
                {modalType === 'increment' && (isBn ? 'বেতন বৃদ্ধি যোগ' : 'Add Increment')}
                {modalType === 'bonus' && (isBn ? 'বোনাস যোগ' : 'Add Bonus')}
                {modalType === 'promotion' && (isBn ? 'পদোন্নতি যোগ' : 'Add Promotion')}
                {modalType === 'fund' && (isBn ? 'লেনদেন যোগ' : 'Add Transaction')}
              </h2>
              <button
                onClick={() => setModalType(null)}
                className="p-[6px] rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] cursor-pointer text-[var(--text-muted)] flex"
              >
                <X size={16} />
              </button>
            </div>

            {modalType === 'increment' && (
              <div className="flex flex-col gap-3">
                <div>
                  <label className={labelCls}>{isBn ? 'শিক্ষক' : 'Teacher'}</label>
                  <select
                    value={incForm.teacherId}
                    onChange={(e) => setIncForm((p) => ({ ...p, teacherId: e.target.value }))}
                    className={inputCls}
                  >
                    <option value="">{isBn ? 'নির্বাচন করুন' : 'Select...'}</option>
                    {activeTeachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.nameEn}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>{isBn ? 'ধরন' : 'Type'}</label>
                  <select
                    value={incForm.type}
                    onChange={(e) => setIncForm((p) => ({ ...p, type: e.target.value as any }))}
                    className={inputCls}
                  >
                    <option value="annual">{isBn ? 'বার্ষিক' : 'Annual'}</option>
                    <option value="performance">{isBn ? 'কর্মদক্ষতা' : 'Performance'}</option>
                    <option value="special">{isBn ? 'বিশেষ' : 'Special'}</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>{isBn ? 'শতাংশ' : 'Percentage (%)'}</label>
                  <input
                    type="number"
                    value={incForm.percentage}
                    onChange={(e) => setIncForm((p) => ({ ...p, percentage: e.target.value }))}
                    className={inputCls}
                    placeholder="5"
                  />
                </div>
                <div>
                  <label className={labelCls}>{isBn ? 'কারণ' : 'Reason'}</label>
                  <input
                    value={incForm.reason}
                    onChange={(e) => setIncForm((p) => ({ ...p, reason: e.target.value }))}
                    className={inputCls}
                  />
                </div>
                <button
                  onClick={handleAddIncrement}
                  className="p-[9px] rounded-lg bg-[var(--green)] border-none text-white text-[13px] font-medium cursor-pointer font-[inherit] flex items-center justify-center gap-1.5"
                >
                  <Save size={14} />
                  {isBn ? 'সংরক্ষণ' : 'Save'}
                </button>
              </div>
            )}

            {modalType === 'bonus' && (
              <div className="flex flex-col gap-3">
                <div>
                  <label className={labelCls}>{isBn ? 'শিক্ষক' : 'Teacher'}</label>
                  <select
                    value={bonForm.teacherId}
                    onChange={(e) => setBonForm((p) => ({ ...p, teacherId: e.target.value }))}
                    className={inputCls}
                  >
                    <option value="">{isBn ? 'নির্বাচন করুন' : 'Select...'}</option>
                    {activeTeachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.nameEn}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>{isBn ? 'ধরন' : 'Type'}</label>
                  <select
                    value={bonForm.type}
                    onChange={(e) => setBonForm((p) => ({ ...p, type: e.target.value as any }))}
                    className={inputCls}
                  >
                    <option value="festival">{isBn ? 'উৎসব' : 'Festival'}</option>
                    <option value="performance">{isBn ? 'কর্মদক্ষতা' : 'Performance'}</option>
                    <option value="attendance">{isBn ? 'উপস্থিতি' : 'Attendance'}</option>
                    <option value="special">{isBn ? 'বিশেষ' : 'Special'}</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>{isBn ? 'পরিমাণ' : 'Amount (৳)'}</label>
                  <input
                    type="number"
                    value={bonForm.amount}
                    onChange={(e) => setBonForm((p) => ({ ...p, amount: e.target.value }))}
                    className={inputCls}
                    placeholder="5000"
                  />
                </div>
                <div>
                  <label className={labelCls}>{isBn ? 'কারণ' : 'Reason'}</label>
                  <input
                    value={bonForm.reason}
                    onChange={(e) => setBonForm((p) => ({ ...p, reason: e.target.value }))}
                    className={inputCls}
                  />
                </div>
                <button
                  onClick={handleAddBonus}
                  className="p-[9px] rounded-lg bg-[var(--amber)] border-none text-white text-[13px] font-medium cursor-pointer font-[inherit] flex items-center justify-center gap-1.5"
                >
                  <Save size={14} />
                  {isBn ? 'সংরক্ষণ' : 'Save'}
                </button>
              </div>
            )}

            {modalType === 'promotion' && (
              <div className="flex flex-col gap-3">
                <div>
                  <label className={labelCls}>{isBn ? 'শিক্ষক' : 'Teacher'}</label>
                  <select
                    value={proForm.teacherId}
                    onChange={(e) => {
                      const t = activeTeachers.find((tx) => tx.id === e.target.value)
                      setProForm((p) => ({ ...p, teacherId: e.target.value, fromDesignation: t?.designation || '' }))
                    }}
                    className={inputCls}
                  >
                    <option value="">{isBn ? 'নির্বাচন করুন' : 'Select...'}</option>
                    {activeTeachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.nameEn} ({t.designation})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>{isBn ? 'বর্তমান পদবি' : 'From'}</label>
                  <select
                    value={proForm.fromDesignation}
                    onChange={(e) => setProForm((p) => ({ ...p, fromDesignation: e.target.value }))}
                    className={inputCls}
                  >
                    <option value="">{isBn ? 'নির্বাচন করুন' : 'Select...'}</option>
                    {allDesignations.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>{isBn ? 'নতুন পদবি' : 'To'}</label>
                  <select
                    value={proForm.toDesignation}
                    onChange={(e) => setProForm((p) => ({ ...p, toDesignation: e.target.value }))}
                    className={inputCls}
                  >
                    <option value="">{isBn ? 'নির্বাচন করুন' : 'Select...'}</option>
                    {allDesignations.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>{isBn ? 'কারণ' : 'Reason'}</label>
                  <input
                    value={proForm.reason}
                    onChange={(e) => setProForm((p) => ({ ...p, reason: e.target.value }))}
                    className={inputCls}
                  />
                </div>
                <button
                  onClick={handleAddPromotion}
                  className="p-[9px] rounded-lg bg-[var(--purple)] border-none text-white text-[13px] font-medium cursor-pointer font-[inherit] flex items-center justify-center gap-1.5"
                >
                  <Save size={14} />
                  {isBn ? 'সংরক্ষণ' : 'Save'}
                </button>
              </div>
            )}

            {modalType === 'fund' && (
              <div className="flex flex-col gap-3">
                <div>
                  <label className={labelCls}>{isBn ? 'ধরন' : 'Type'}</label>
                  <select
                    value={fundForm.type}
                    onChange={(e) => setFundForm((p) => ({ ...p, type: e.target.value as any }))}
                    className={inputCls}
                  >
                    <option value="contribution">{isBn ? 'অনুদান' : 'Contribution'}</option>
                    <option value="bonus_pool">{isBn ? 'বোনাস পুল' : 'Bonus Pool'}</option>
                    <option value="increment_pool">{isBn ? 'বৃদ্ধি পুল' : 'Increment Pool'}</option>
                    <option value="withdrawal">{isBn ? 'উত্তোলন' : 'Withdrawal'}</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>{isBn ? 'পরিমাণ' : 'Amount (৳)'}</label>
                  <input
                    type="number"
                    value={fundForm.amount}
                    onChange={(e) => setFundForm((p) => ({ ...p, amount: e.target.value }))}
                    className={inputCls}
                    placeholder="10000"
                  />
                </div>
                <div>
                  <label className={labelCls}>{isBn ? 'বিবরণ' : 'Description'}</label>
                  <input
                    value={fundForm.description}
                    onChange={(e) => setFundForm((p) => ({ ...p, description: e.target.value }))}
                    className={inputCls}
                  />
                </div>
                <button
                  onClick={handleAddFund}
                  className="p-[9px] rounded-lg bg-[var(--brand)] border-none text-white text-[13px] font-medium cursor-pointer font-[inherit] flex items-center justify-center gap-1.5"
                >
                  <Save size={14} />
                  {isBn ? 'সংরক্ষণ' : 'Save'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── PDF MODAL ─── */}
      {showPDFModal && (
        <HRPDFOptionsModal
          type={showPDFModal}
          count={
            showPDFModal === 'increment'
              ? increments.length
              : showPDFModal === 'bonus'
                ? filteredBonuses.length
                : showPDFModal === 'promotion'
                  ? filteredPromotions.length
                  : showPDFModal === 'assignment'
                    ? filteredAssignments.length
                    : showPDFModal === 'salary'
                      ? activeTeachers.length
                      : funds.length
          }
          isBn={isBn}
          onClose={() => setShowPDFModal(null)}
          onDownload={(opts) => handlePDFDownload(showPDFModal, opts)}
        />
      )}

      {/* ─── FACILITY ADD/EDIT MODAL ─── */}
      {(facModalType === 'add-facility' || facModalType === 'edit-facility') && (
        <div
          className={modalOverlayCls}
          onClick={() => {
            setFacModalType(null)
            setEditFac(null)
          }}
        >
          <div className={`modal-content ${modalStyleCls}`} onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-base font-semibold text-[var(--text-primary)]">
                {facModalType === 'add-facility'
                  ? isBn
                    ? 'নতুন সুবিধা যোগ'
                    : 'Add Facility'
                  : isBn
                    ? 'সুবিধা এডিট করুন'
                    : 'Edit Facility'}
              </h2>
              <button
                onClick={() => {
                  setFacModalType(null)
                  setEditFac(null)
                }}
                className="p-[6px] rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] cursor-pointer text-[var(--text-muted)] flex"
              >
                <X size={16} />
              </button>
            </div>
            <div className="flex flex-col gap-3">
              <div>
                <label className={labelCls}>{isBn ? 'নাম (ইংরেজি) *' : 'Name (English) *'}</label>
                <input
                  value={facForm.name}
                  onChange={(e) => setFacForm((p) => ({ ...p, name: e.target.value }))}
                  className={inputCls}
                  placeholder={isBn ? 'সুবিধার নাম' : 'Facility name'}
                />
              </div>
              <div>
                <label className={labelCls}>{isBn ? 'নাম (বাংলা)' : 'Name (Bangla)'}</label>
                <input
                  value={facForm.nameBn}
                  onChange={(e) => setFacForm((p) => ({ ...p, nameBn: e.target.value }))}
                  className={inputCls}
                  placeholder={isBn ? 'বাংলায় নাম' : 'Bangla name'}
                />
              </div>
              <div>
                <label className={labelCls}>{isBn ? 'ডিফল্ট পরিমাণ (৳)' : 'Default Amount (৳)'}</label>
                <input
                  type="number"
                  value={facForm.defaultAmount}
                  onChange={(e) => setFacForm((p) => ({ ...p, defaultAmount: e.target.value }))}
                  className={inputCls}
                  placeholder="0"
                />
              </div>
              <div>
                <label className={labelCls}>{isBn ? 'ধরন' : 'Type'}</label>
                <select
                  value={facForm.type}
                  onChange={(e) => setFacForm((p) => ({ ...p, type: e.target.value as 'monthly' | 'oneTime' }))}
                  className={inputCls}
                >
                  <option value="monthly">{isBn ? 'মাসিক' : 'Monthly'}</option>
                  <option value="oneTime">{isBn ? 'এককালীন' : 'One-time'}</option>
                </select>
              </div>
              <button
                onClick={facModalType === 'add-facility' ? handleAddFacility : handleEditFacility}
                className="p-[9px] rounded-lg bg-[var(--purple)] border-none text-white text-[13px] font-medium cursor-pointer font-[inherit] flex items-center justify-center gap-1.5"
              >
                <Save size={14} />
                {isBn ? 'সংরক্ষণ' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── FACILITY ASSIGN MODAL ─── */}
      {(facModalType === 'assign' || facModalType === 'edit-assign') && (
        <div
          className={modalOverlayCls}
          onClick={() => {
            setFacModalType(null)
            setEditAssign(null)
          }}
        >
          <div className={`modal-content ${modalStyleCls}`} onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-base font-semibold text-[var(--text-primary)]">
                {facModalType === 'assign'
                  ? isBn
                    ? 'সুবিধা বরাদ্দ করুন'
                    : 'Assign Facility'
                  : isBn
                    ? 'বরাদ্দ এডিট করুন'
                    : 'Edit Assignment'}
              </h2>
              <button
                onClick={() => {
                  setFacModalType(null)
                  setEditAssign(null)
                }}
                className="p-[6px] rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] cursor-pointer text-[var(--text-muted)] flex"
              >
                <X size={16} />
              </button>
            </div>
            <div className="flex flex-col gap-3">
              <div>
                <label className={labelCls}>{isBn ? 'কর্মচারী *' : 'Employee *'}</label>
                <select
                  value={assignForm.teacherId}
                  onChange={(e) => setAssignForm((p) => ({ ...p, teacherId: e.target.value }))}
                  className={inputCls}
                  disabled={facModalType === 'edit-assign'}
                >
                  <option value="">{isBn ? 'নির্বাচন করুন' : 'Select...'}</option>
                  {activeTeachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nameEn} ({t.designation})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>{isBn ? 'সুবিধা *' : 'Facility *'}</label>
                <select
                  value={assignForm.facilityId}
                  onChange={(e) => {
                    const fac = facilities.find((f) => f.id === e.target.value)
                    setAssignForm((p) => ({ ...p, facilityId: e.target.value, amount: fac ? String(fac.defaultAmount) : p.amount }))
                  }}
                  className={inputCls}
                  disabled={facModalType === 'edit-assign'}
                >
                  <option value="">{isBn ? 'নির্বাচন করুন' : 'Select...'}</option>
                  {facilities
                    .filter((f) => f.isActive)
                    .map((f) => (
                      <option key={f.id} value={f.id}>
                        {isBn ? f.nameBn : f.name}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>{isBn ? 'পরিমাণ (৳) *' : 'Amount (৳) *'}</label>
                <input
                  type="number"
                  value={assignForm.amount}
                  onChange={(e) => setAssignForm((p) => ({ ...p, amount: e.target.value }))}
                  className={inputCls}
                  placeholder="0"
                />
              </div>
              <button
                onClick={facModalType === 'assign' ? handleAssignFacility : handleEditAssign}
                className="p-[9px] rounded-lg bg-[var(--brand)] border-none text-white text-[13px] font-medium cursor-pointer font-[inherit] flex items-center justify-center gap-1.5"
              >
                <Save size={14} />
                {isBn ? 'সংরক্ষণ' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── FACILITY DELETE CONFIRM ─── */}
      {facDeleteConfirm && (
        <DeleteConfirmDialog
          title={isBn ? 'মুছে ফেলুন?' : 'Delete Facility?'}
          message={
            isBn
              ? 'এই সুবিধাটি স্থায়ীভাবে মুছে ফেলা হবে। সম্পর্কিত সব বরাদ্দও মুছে ফেলা হবে।'
              : 'This facility will be permanently deleted. All related assignments will also be removed.'
          }
          onConfirm={() => {
            deleteFacility(facDeleteConfirm)
            setFacDeleteConfirm(null)
          }}
          onCancel={() => setFacDeleteConfirm(null)}
          isBn={isBn}
        />
      )}

      {/* ─── ASSIGNMENT DELETE CONFIRM ─── */}
      {assignDeleteConfirm && (
        <DeleteConfirmDialog
          title={isBn ? 'মুছে ফেলুন?' : 'Delete Assignment?'}
          message={isBn ? 'এই বরাদ্দটি স্থায়ীভাবে মুছে ফেলা হবে।' : 'This assignment will be permanently deleted.'}
          onConfirm={() => {
            removeTeacherFacility(assignDeleteConfirm)
            setAssignDeleteConfirm(null)
          }}
          onCancel={() => setAssignDeleteConfirm(null)}
          isBn={isBn}
        />
      )}
    </>
  )
}
