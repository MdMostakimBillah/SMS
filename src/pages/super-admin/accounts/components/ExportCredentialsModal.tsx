import { X, Printer, Download, Building2 } from 'lucide-react'
import type { ExportCredentialsModalProps } from '../types'

export function ExportCredentialsModal({
  isBn,
  accounts,
  isOpen,
  onClose,
}: ExportCredentialsModalProps) {
  if (!isOpen) return null

  const handlePrint = () => {
    window.print()
  }

  const handleDownloadCsv = () => {
    const headers = ['Account Type', 'ID / Staff ID', 'Name', 'Guardian / Department', 'Designation', 'Institution', 'Class', 'Section', 'Roll', 'Username', 'Password', 'Status']
    const rows = accounts.map((a) => [
      a.role === 'teacher' ? 'Teacher' : a.role === 'student' ? 'Student' : 'Parent',
      `"${a.staffId || a.studentId}"`,
      `"${a.studentNameEn}"`,
      `"${a.role === 'teacher' ? (a.department || '') : (a.guardianName || '')}"`,
      `"${a.designation || ''}"`,
      `"${a.schoolName}"`,
      `"${a.class}"`,
      `"${a.section}"`,
      `"${a.roll}"`,
      `"${a.username}"`,
      `"${a.password}"`,
      `"${a.status}"`,
    ])

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `edutech_credentials_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-4xl max-h-[90vh] rounded-2xl border border-[var(--border)] bg-[var(--bg-primary)] p-6 shadow-2xl flex flex-col space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border)] shrink-0 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
              <Printer size={20} />
            </div>
            <div>
              <h3 className="text-[1.0625rem] font-bold text-[var(--text-primary)]">
                {isBn ? 'ক্রেডেনশিয়াল স্লিপ প্রিন্ট ও এক্সপোর্ট' : 'Credential Slips & Export'}
              </h3>
              <p className="text-[0.6875rem] text-[var(--text-muted)]">
                {isBn
                  ? `মোট ${accounts.length} টি স্লিপ প্রস্তুত রয়েছে`
                  : `${accounts.length} account credential slips ready`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadCsv}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[0.75rem] font-medium border border-[var(--border)] bg-[var(--bg-secondary)] hover:bg-[var(--border)] text-[var(--text-primary)] transition-colors cursor-pointer"
            >
              <Download size={13} />
              <span>{isBn ? 'CSV ডাউনলোড' : 'Download CSV'}</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-[0.75rem] font-semibold bg-[var(--brand)] text-white hover:brightness-110 shadow-sm transition-all cursor-pointer border-none"
            >
              <Printer size={13} />
              <span>{isBn ? 'সবগুলো প্রিন্ট করুন' : 'Print Slips'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] bg-transparent border-none cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Slips Grid (Scrollable preview on screen, 2-column or 3-column in print) */}
        <div className="flex-1 overflow-y-auto pr-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 print:grid-cols-2 print:gap-4">
            {accounts.map((acc) => (
              <div
                key={acc.id}
                className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-3.5 space-y-2.5 print:bg-white print:text-black print:border-black/30 break-inside-avoid shadow-sm"
              >
                {/* Slip Header */}
                <div className="flex items-center justify-between border-b border-[var(--border)] pb-2 print:border-black/20">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Building2 size={13} className="text-[var(--brand)] shrink-0 print:text-black" />
                    <span className="text-[0.75rem] font-bold text-[var(--text-primary)] truncate print:text-black">
                      {acc.schoolName || 'EduTech School'}
                    </span>
                  </div>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[0.5625rem] font-bold uppercase shrink-0 ${
                      acc.role === 'teacher'
                        ? 'bg-teal-500/15 text-teal-600 print:bg-gray-100 print:text-black'
                        : acc.role === 'student'
                        ? 'bg-blue-500/15 text-blue-500 print:bg-gray-100 print:text-black'
                        : 'bg-purple-500/15 text-purple-500 print:bg-gray-100 print:text-black'
                    }`}
                  >
                    {acc.role === 'teacher' ? 'Teacher Portal' : acc.role === 'student' ? 'Student Portal' : 'Parent Portal'}
                  </span>
                </div>

                {/* Account Details */}
                <div className="space-y-1 text-[0.6875rem]">
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)] print:text-gray-600">
                      {acc.role === 'teacher' ? (isBn ? 'শিক্ষক:' : 'Teacher:') : acc.role === 'student' ? (isBn ? 'শিক্ষার্থী:' : 'Student:') : (isBn ? 'অভিভাবক:' : 'Guardian:')}
                    </span>
                    <span className="font-semibold text-[var(--text-primary)] print:text-black truncate max-w-[130px]">
                      {acc.role === 'parent' ? acc.guardianName || 'Guardian' : acc.studentNameEn}
                    </span>
                  </div>
                  {acc.role === 'teacher' && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-[var(--text-muted)] print:text-gray-600">{isBn ? 'পদবী ও বিভাগ:' : 'Designation:'}</span>
                        <span className="font-medium text-[var(--text-primary)] print:text-black truncate max-w-[130px]">
                          {acc.designation || 'Teacher'} {acc.department ? `(${acc.department})` : ''}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[var(--text-muted)] print:text-gray-600">Staff ID:</span>
                        <span className="font-mono font-medium text-[var(--text-primary)] print:text-black">{acc.staffId || acc.studentId}</span>
                      </div>
                    </>
                  )}
                  {acc.role === 'parent' && (
                    <div className="flex justify-between">
                      <span className="text-[var(--text-muted)] print:text-gray-600">{isBn ? 'ছাত্র/ছাত্রী:' : 'Child:'}</span>
                      <span className="font-medium text-[var(--text-primary)] print:text-black truncate max-w-[130px]">
                        {acc.studentNameEn}
                      </span>
                    </div>
                  )}
                  {acc.role !== 'teacher' && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-[var(--text-muted)] print:text-gray-600">{isBn ? 'শ্রেণি / রোল:' : 'Class / Roll:'}</span>
                        <span className="font-medium text-[var(--text-primary)] print:text-black">
                          {acc.class} {acc.section ? `(${acc.section})` : ''} • Roll: {acc.roll || '-'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[var(--text-muted)] print:text-gray-600">{isBn ? 'স্টুডেন্ট আইডি:' : 'Student ID:'}</span>
                        <span className="font-mono font-medium text-[var(--text-primary)] print:text-black">{acc.studentId}</span>
                      </div>
                    </>
                  )}
                </div>

                {/* Credentials Box */}
                <div className="rounded-lg bg-[var(--bg-primary)] border border-[var(--border)] p-2 space-y-1 print:border-black/30 print:bg-gray-50">
                  <div className="flex items-center justify-between text-[0.6875rem]">
                    <span className="text-[var(--text-muted)] print:text-gray-600">{isBn ? 'ইউজারনেম:' : 'Username:'}</span>
                    <span className="font-mono font-bold text-[var(--text-primary)] print:text-black select-all">
                      {acc.username}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[0.6875rem]">
                    <span className="text-[var(--text-muted)] print:text-gray-600">{isBn ? 'পাসওয়ার্ড:' : 'Password:'}</span>
                    <span className="font-mono font-bold text-[var(--brand)] print:text-black select-all">
                      {acc.password}
                    </span>
                  </div>
                </div>

                {/* Footer Note */}
                <div className="text-[0.5625rem] text-[var(--text-muted)] text-center print:text-gray-500">
                  {isBn ? 'লগইন করুন: edutech.pro.bd/login' : 'Login at: edutech.pro.bd/login'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end pt-2 border-t border-[var(--border)] shrink-0 print:hidden">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-[0.8125rem] font-medium text-[var(--text-muted)] hover:bg-[var(--bg-secondary)] transition-colors cursor-pointer bg-transparent border-none"
          >
            {isBn ? 'বন্ধ করুন' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  )
}
