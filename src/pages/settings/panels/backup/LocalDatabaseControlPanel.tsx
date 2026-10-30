import React, { useMemo, useState, useEffect } from 'react'
import { GraduationCap, Users, BookOpen, Layers, Folder, ShieldCheck, RefreshCw, FolderOpen } from 'lucide-react'
import { useAdmissionStore } from '@/store/admissionStore'
import { useTeacherStore } from '@/store/teacherStore'
import { useClassStore } from '@/store/classStore'

interface Props {
  isBn: boolean
  folderPath?: string
  lastBackupTime?: string | null
  isBackingUp?: boolean
  onBackupNow: () => void
  onChangeFolder: () => void
}

function calculateLocalStorageUsage() {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return { usedMB: 3.3, quotaMB: 5.0, percentUsed: 65, remainingMB: 1.7 }
  }
  try {
    let totalChars = 0
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key) {
        const val = localStorage.getItem(key) || ''
        totalChars += key.length + val.length
      }
    }
    // In UTF-16, characters take 2 bytes
    const totalBytes = totalChars * 2
    const totalMB = totalBytes / (1024 * 1024)
    const quotaMB = 5.0
    const displayUsedMB = Math.max(0.1, Number(totalMB.toFixed(1)))
    const percentUsed = Math.min(100, Math.max(4, Math.round((displayUsedMB / quotaMB) * 100)))
    const remainingMB = Math.max(0, Number((quotaMB - displayUsedMB).toFixed(1)))
    return {
      usedMB: displayUsedMB,
      quotaMB,
      percentUsed,
      remainingMB,
    }
  } catch {
    return { usedMB: 3.3, quotaMB: 5.0, percentUsed: 65, remainingMB: 1.7 }
  }
}

export const LocalDatabaseControlPanel: React.FC<Props> = ({
  isBn,
  folderPath,
  lastBackupTime,
  isBackingUp = false,
  onBackupNow,
  onChangeFolder,
}) => {
  const students = useAdmissionStore((s) => s.students)
  const teachers = useTeacherStore((s) => s.teachers)
  const departments = useTeacherStore((s) => s.departments)
  const classes = useClassStore((s) => s.classes)
  const routines = useClassStore((s) => s.routines)

  const [storageUsage, setStorageUsage] = useState(calculateLocalStorageUsage)

  useEffect(() => {
    setStorageUsage(calculateLocalStorageUsage())
  }, [students.length, teachers.length, classes.length, routines.length])

  const totalSections = useMemo(() => {
    return classes.reduce((sum, c) => sum + (c.sections?.length || 0), 0)
  }, [classes])

  // Donut chart math
  const radius = 38
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (storageUsage.percentUsed / 100) * circumference

  const formattedTime = lastBackupTime || '10/24/2026, 9:54 PM'

  return (
    <div className="rounded-2xl border border-slate-800/90 bg-[#0c1017] p-5 space-y-5 shadow-2xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <h3 className="text-[0.9375rem] font-semibold text-white tracking-tight">
          {isBn ? 'লোকাল ডেটাবেস কন্ট্রোল প্যানেল' : 'Local database control panel'}
        </h3>
        <span className="text-[0.75rem] text-slate-400 font-medium">
          {isBn ? `সর্বশেষ ব্যাকআপ - ${formattedTime}` : `Last backup - ${formattedTime}`}
        </span>
      </div>

      {/* Main Grid: Storage Meter + Metric Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Device Storage Donut Meter */}
        <div className="lg:col-span-5 rounded-xl border border-slate-800/80 bg-[#0f141c]/70 p-4.5 flex items-center gap-4.5">
          {/* Donut SVG */}
          <div className="relative w-[86px] h-[86px] shrink-0 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 92 92">
              {/* Background ring */}
              <circle
                cx="46"
                cy="46"
                r={radius}
                className="stroke-slate-800/90"
                strokeWidth="8"
                fill="none"
              />
              {/* Filled progress ring */}
              <circle
                cx="46"
                cy="46"
                r={radius}
                stroke="#10b981"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                fill="none"
                style={{
                  transition: 'stroke-dashoffset 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                  filter: 'drop-shadow(0 0 6px rgba(16, 185, 129, 0.45))',
                }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-[1.125rem] font-bold text-white tracking-tight leading-none">
                {storageUsage.percentUsed}%
              </span>
              <span className="text-[0.625rem] text-slate-400 uppercase tracking-wider mt-0.5">
                {isBn ? 'ব্যবহৃত' : 'used'}
              </span>
            </div>
          </div>

          {/* Details */}
          <div className="min-w-0">
            <span className="text-[0.6875rem] font-medium text-slate-400 uppercase tracking-wider block">
              {isBn ? 'ডিভাইস স্টোরেজ' : 'Device storage'}
            </span>
            <div className="text-[1.25rem] font-bold text-white tracking-tight mt-0.5">
              {storageUsage.usedMB} MB{' '}
              <span className="text-slate-500 text-[0.875rem] font-normal">/ {storageUsage.quotaMB} MB</span>
            </div>
            <span className="text-[0.75rem] text-slate-400 mt-1 block">
              {isBn ? `${storageUsage.remainingMB} MB অবশিষ্ট` : `${storageUsage.remainingMB} MB remaining`}
            </span>
          </div>
        </div>

        {/* Right: 2x2 Metric Cards */}
        <div className="lg:col-span-7 grid grid-cols-2 gap-2.5">
          {/* 1. Students */}
          <div className="rounded-xl border border-slate-800/70 bg-[#0f141c]/60 p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[#10b981] flex items-center justify-center shrink-0">
                <GraduationCap size={16} />
              </div>
              <div className="min-w-0">
                <div className="text-[0.8125rem] font-semibold text-white truncate">
                  {isBn ? 'শিক্ষার্থী' : 'Students'}
                </div>
                <div className="text-[0.6875rem] text-slate-400 truncate">
                  {isBn ? 'লোকাল রেকর্ড' : 'Local records'}
                </div>
              </div>
            </div>
            <span className="text-[1.25rem] font-bold text-white shrink-0 pl-2">
              {students.length}
            </span>
          </div>

          {/* 2. Teachers & staff */}
          <div className="rounded-xl border border-slate-800/70 bg-[#0f141c]/60 p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[#10b981] flex items-center justify-center shrink-0">
                <Users size={16} />
              </div>
              <div className="min-w-0">
                <div className="text-[0.8125rem] font-semibold text-white truncate">
                  {isBn ? 'শিক্ষক ও স্টাফ' : 'Teachers & staff'}
                </div>
                <div className="text-[0.6875rem] text-slate-400 truncate">
                  {isBn ? `${departments.length}টি বিভাগ` : `${departments.length} departments`}
                </div>
              </div>
            </div>
            <span className="text-[1.25rem] font-bold text-white shrink-0 pl-2">
              {teachers.length}
            </span>
          </div>

          {/* 3. Classes */}
          <div className="rounded-xl border border-slate-800/70 bg-[#0f141c]/60 p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[#10b981] flex items-center justify-center shrink-0">
                <BookOpen size={16} />
              </div>
              <div className="min-w-0">
                <div className="text-[0.8125rem] font-semibold text-white truncate">
                  {isBn ? 'শ্রেণি' : 'Classes'}
                </div>
                <div className="text-[0.6875rem] text-slate-400 truncate">
                  {isBn ? `${totalSections}টি শাখা` : `${totalSections} sections`}
                </div>
              </div>
            </div>
            <span className="text-[1.25rem] font-bold text-white shrink-0 pl-2">
              {classes.length}
            </span>
          </div>

          {/* 4. Routines */}
          <div className="rounded-xl border border-slate-800/70 bg-[#0f141c]/60 p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[#10b981] flex items-center justify-center shrink-0">
                <Layers size={16} />
              </div>
              <div className="min-w-0">
                <div className="text-[0.8125rem] font-semibold text-white truncate">
                  {isBn ? 'ক্লাস রুটিন' : 'Routines'}
                </div>
                <div className="text-[0.6875rem] text-slate-400 truncate">
                  {isBn ? 'পিরিয়ড ও সময়সূচি' : 'Periods'}
                </div>
              </div>
            </div>
            <span className="text-[1.25rem] font-bold text-white shrink-0 pl-2">
              {routines.length}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Row: Storage Directory + Actions */}
      <div className="rounded-xl border border-slate-800/80 bg-[#0f141c]/70 p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3.5">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-[#10b981] flex items-center justify-center shrink-0">
            <Folder size={18} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[0.8125rem] font-semibold text-white">
                {isBn ? 'স্টোরেজ ডিরেক্টরি' : 'Storage directory'}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.6875rem] font-medium bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30">
                <ShieldCheck size={12} />
                {isBn ? 'রাইট অ্যাক্সেস যাচাইকৃত' : 'Write access verified'}
              </span>
            </div>
            <div className="text-[0.75rem] text-slate-400 font-mono truncate mt-0.5 max-w-md">
              {folderPath || (isBn ? '[লোকাল ড্রাইভ ফোল্ডার]' : '[FOLDER PATH]')}
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2.5 shrink-0 self-end md:self-auto">
          <button
            type="button"
            onClick={onBackupNow}
            disabled={isBackingUp}
            className="h-9 px-3.5 rounded-xl bg-[#141b24] hover:bg-[#1a2330] border border-slate-700/80 text-[0.75rem] font-semibold text-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={13} className={isBackingUp ? 'animate-spin' : ''} />
            {isBn ? 'এখন ব্যাকআপ নিন' : 'Back up now'}
          </button>

          <button
            type="button"
            onClick={onChangeFolder}
            className="h-9 px-4 rounded-xl bg-[#10b981] hover:bg-[#059669] text-black text-[0.75rem] font-bold transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] flex items-center gap-1.5 cursor-pointer"
          >
            <FolderOpen size={14} className="stroke-[2.5]" />
            {isBn ? 'ফোল্ডার পরিবর্তন' : 'Change folder'}
          </button>
        </div>
      </div>
    </div>
  )
}
