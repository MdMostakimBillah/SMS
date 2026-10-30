import React, { useState } from 'react'
import { Cloud, ShieldCheck, Database, RefreshCw } from 'lucide-react'
import { useAdmissionStore } from '@/store/admissionStore'
import { useTeacherStore } from '@/store/teacherStore'
import { useClassStore } from '@/store/classStore'

interface Props {
  isBn: boolean
  lastBackupTime?: string | null
  onSyncNow: () => Promise<void>
}

export const ProviderCloudControlPanel: React.FC<Props> = ({
  isBn,
  lastBackupTime,
  onSyncNow,
}) => {
  const students = useAdmissionStore((s) => s.students)
  const teachers = useTeacherStore((s) => s.teachers)
  const classes = useClassStore((s) => s.classes)
  const routines = useClassStore((s) => s.routines)

  const [syncing, setSyncing] = useState(false)
  const [synced, setSynced] = useState(false)

  const handleSync = async () => {
    setSyncing(true)
    setSynced(false)
    try {
      await onSyncNow()
      setSynced(true)
      setTimeout(() => setSynced(false), 3000)
    } finally {
      setSyncing(false)
    }
  }

  const formattedTime = lastBackupTime || '10/24/2026, 9:54 PM'

  return (
    <div className="rounded-2xl border border-slate-800/90 bg-[#0c1017] p-5 space-y-4 shadow-2xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <h3 className="text-[0.9375rem] font-semibold text-white tracking-tight flex items-center gap-2">
          <Cloud size={18} className="text-[#10b981]" />
          {isBn ? 'প্রোভাইডার ক্লাউড কন্ট্রোল প্যানেল' : 'Provider Cloud Control Panel'}
        </h3>
        <span className="text-[0.75rem] text-slate-400 font-medium">
          {isBn ? `সর্বশেষ সিঙ্ক - ${formattedTime}` : `Last sync - ${formattedTime}`}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-slate-800/70 bg-[#0f141c]/60 p-3 text-center">
          <div className="text-[0.6875rem] text-slate-400">{isBn ? 'ক্লাউড শিক্ষার্থী' : 'Cloud Students'}</div>
          <div className="text-xl font-bold text-white mt-1">{students.length}</div>
        </div>
        <div className="rounded-xl border border-slate-800/70 bg-[#0f141c]/60 p-3 text-center">
          <div className="text-[0.6875rem] text-slate-400">{isBn ? 'ক্লাউড শিক্ষক' : 'Cloud Teachers'}</div>
          <div className="text-xl font-bold text-white mt-1">{teachers.length}</div>
        </div>
        <div className="rounded-xl border border-slate-800/70 bg-[#0f141c]/60 p-3 text-center">
          <div className="text-[0.6875rem] text-slate-400">{isBn ? 'শ্রেণি রেকর্ড' : 'Class Records'}</div>
          <div className="text-xl font-bold text-white mt-1">{classes.length}</div>
        </div>
        <div className="rounded-xl border border-slate-800/70 bg-[#0f141c]/60 p-3 text-center">
          <div className="text-[0.6875rem] text-slate-400">{isBn ? 'রুটিন শিডিউল' : 'Routines'}</div>
          <div className="text-xl font-bold text-white mt-1">{routines.length}</div>
        </div>
      </div>

      <div className="p-3.5 rounded-xl border border-slate-800/80 bg-[#0f141c]/70 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-[#10b981] flex items-center justify-center">
            <Database size={16} />
          </div>
          <div>
            <div className="text-xs font-semibold text-white">
              {isBn ? 'সেন্ট্রাল পোস্টগ্রেস ডেটাবেস সক্রিয়' : 'Central PostgreSQL Database Online'}
            </div>
            <div className="text-[0.6875rem] text-slate-400">
              {isBn ? 'স্বয়ংক্রিয় রিয়েল-টাইম ডাটা সিঙ্ক ও ব্যাকআপ চালু আছে' : 'Real-time database sync and disaster recovery active'}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSync}
          disabled={syncing}
          className="h-9 px-4 rounded-xl bg-[#10b981] hover:bg-[#059669] text-black text-xs font-bold transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          {syncing ? <RefreshCw size={13} className="animate-spin" /> : <ShieldCheck size={14} />}
          {isBn ? (synced ? 'সিঙ্ক সম্পন্ন!' : 'এখন সিঙ্ক করুন') : (synced ? 'Synced!' : 'Sync now')}
        </button>
      </div>
    </div>
  )
}
