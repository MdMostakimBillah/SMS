import { Users, GraduationCap, ShieldAlert, KeyRound, Printer, Sparkles, CheckCircle2 } from 'lucide-react'
import type { AccountsHeaderProps } from '../types'

export function AccountsHeader({
  isBn,
  totalCount,
  studentCount,
  parentCount,
  activeCount,
  lockedCount,
  selectedCount,
  onOpenBulkModal,
  onOpenExportModal,
}: AccountsHeaderProps) {
  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div
        className="anim-card relative overflow-hidden rounded-3xl p-6 shadow-sm border border-[var(--border)]"
        style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)' }}
      >
        <div
          className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #fff 1px, transparent 1px)', backgroundSize: '24px 24px' }}
        />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-white/10 backdrop-blur-sm border border-white/20">
              <KeyRound size={28} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-[1.25rem] font-bold text-white">
                  {isBn ? 'শিক্ষার্থী ও অভিভাবক অ্যাকাউন্ট নিয়ন্ত্রণ' : 'Student & Parent Credentials'}
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[0.6875rem] font-semibold bg-white/15 text-white/90 border border-white/20">
                  {isBn ? 'সুপার অ্যাডমিন' : 'Super Admin'}
                </span>
              </div>
              <p className="text-[0.8125rem] text-white/70 mt-1 max-w-xl">
                {isBn
                  ? 'সকল প্রতিষ্ঠানের শিক্ষার্থী ও অভিভাবকদের ইউজারনেম ও পাসওয়ার্ড দেখুন, পরিবর্তন বা রিসেট করুন এবং স্লিপ প্রিন্ট করুন।'
                  : 'Manage, inspect, reset, and export usernames and passwords for all students and parents across all institutions.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={onOpenExportModal}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-[0.8125rem] font-medium bg-white/15 hover:bg-white/25 text-white border border-white/20 backdrop-blur-sm transition-all cursor-pointer"
              title={isBn ? 'ক্রেডেনশিয়াল কার্ড বা স্লিপ প্রিন্ট ও এক্সপোর্ট করুন' : 'Export and Print Credential Slips'}
            >
              <Printer size={16} />
              <span>{isBn ? 'স্লিপ প্রিন্ট / এক্সপোর্ট' : 'Print Slips / Export'}</span>
            </button>

            <button
              onClick={onOpenBulkModal}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[0.8125rem] font-semibold bg-[var(--brand)] hover:brightness-110 text-white shadow-md shadow-indigo-900/30 transition-all cursor-pointer border-none"
            >
              <Sparkles size={16} />
              <span>
                {selectedCount > 0
                  ? isBn
                    ? `বাল্ক অ্যাকশন (${selectedCount})`
                    : `Bulk Action (${selectedCount})`
                  : isBn
                  ? 'বাল্ক রিসেট'
                  : 'Bulk Reset'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-primary)] p-3.5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-indigo-500/10 text-indigo-500">
            <KeyRound size={18} />
          </div>
          <div className="min-w-0">
            <div className="text-[0.6875rem] font-medium text-[var(--text-muted)] truncate">
              {isBn ? 'মোট অ্যাকাউন্ট' : 'Total Accounts'}
            </div>
            <div className="text-[1.125rem] font-bold text-[var(--text-primary)] leading-tight">
              {totalCount.toLocaleString()}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-primary)] p-3.5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-blue-500/10 text-blue-500">
            <GraduationCap size={18} />
          </div>
          <div className="min-w-0">
            <div className="text-[0.6875rem] font-medium text-[var(--text-muted)] truncate">
              {isBn ? 'শিক্ষার্থী অ্যাকাউন্ট' : 'Student Accounts'}
            </div>
            <div className="text-[1.125rem] font-bold text-[var(--text-primary)] leading-tight">
              {studentCount.toLocaleString()}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-primary)] p-3.5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-purple-500/10 text-purple-500">
            <Users size={18} />
          </div>
          <div className="min-w-0">
            <div className="text-[0.6875rem] font-medium text-[var(--text-muted)] truncate">
              {isBn ? 'অভিভাবক অ্যাকাউন্ট' : 'Parent Accounts'}
            </div>
            <div className="text-[1.125rem] font-bold text-[var(--text-primary)] leading-tight">
              {parentCount.toLocaleString()}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-primary)] p-3.5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-emerald-500/10 text-emerald-500">
            <CheckCircle2 size={18} />
          </div>
          <div className="min-w-0">
            <div className="text-[0.6875rem] font-medium text-[var(--text-muted)] truncate">
              {isBn ? 'সক্রিয় অ্যাকাউন্ট' : 'Active Accounts'}
            </div>
            <div className="text-[1.125rem] font-bold text-[var(--text-primary)] leading-tight">
              {activeCount.toLocaleString()}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-primary)] p-3.5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-amber-500/10 text-amber-500">
            <ShieldAlert size={18} />
          </div>
          <div className="min-w-0">
            <div className="text-[0.6875rem] font-medium text-[var(--text-muted)] truncate">
              {isBn ? 'লকড / পেন্ডিং' : 'Locked / Pending'}
            </div>
            <div className="text-[1.125rem] font-bold text-[var(--text-primary)] leading-tight">
              {lockedCount.toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
