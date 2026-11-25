import React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ServerOff,
  Cloud,
  Server,
  Laptop,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { useNavPath } from '@/hooks/useNavPath'

interface Props {
  isInstitutionAdmin: boolean
}

export const ParentPortalLocalPcNotice = React.memo(function ParentPortalLocalPcNotice({
  isInstitutionAdmin,
}: Props) {
  const isBn = useBn()
  const navigate = useNavigate()
  const getNavPath = useNavPath()

  const handleGoToSettings = () => {
    navigate(getNavPath('/settings?tab=storage'))
  }

  return (
    <div className="w-full max-w-4xl mx-auto py-8 px-4 fade-in">
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8 shadow-sm">
        {/* Header Banner */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shrink-0">
            <ServerOff size={24} />
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold text-[var(--text-primary)]">
                {isBn
                  ? 'অভিভাবক পোর্টাল ব্যবহারের জন্য অনলাইন ডাটাবেজ প্রয়োজন'
                  : 'Parent Portal Requires Online Database Connection'}
              </h2>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[0.6875rem] font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                <Laptop size={11} />
                {isBn ? 'লোকাল পিসি স্টোরেজ সক্রিয়' : 'Local PC Storage Active'}
              </span>
            </div>

            <p className="text-xs text-[var(--text-secondary)] mt-2 leading-relaxed">
              {isBn
                ? 'অভিভাবক পোর্টাল একটি ইন্টারনেট-ভিত্তিক সেবা। অভিভাবকরা দূরবর্তী স্থান থেকে মোবাইল বা কম্পিউটারের মাধ্যমে শিক্ষার্থীর দৈনিক উপস্থিতি, পরীক্ষার ফলাফল ও অনলাইনে ফি পরিশোধ করে থাকেন। আপনার প্রতিষ্ঠানটি বর্তমানে অফলাইন "লোকাল কম্পিউটার স্টোরেজ" মোডে রয়েছে, যা কেবল এই কম্পিউটারে সীমাবদ্ধ। এই ফিচারটি ব্যবহারের জন্য প্রোভাইডার ক্লাউড সার্ভিস অথবা নিজস্ব পার্সোনাল ভিপিএস সার্ভার ডাটাবেজ প্রয়োজন।'
                : 'The Parent Portal is an internet-facing service allowing guardians to remotely view daily attendance, exam results, homework, and pay student bills online from their devices. Your institution is currently running in offline "Local Computer Storage" mode where data is stored exclusively on this machine. To enable the Parent Portal, connect your institution to Provider Cloud Service or a Personal VPS Server.'}
            </p>
          </div>
        </div>

        {/* Storage Architecture Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mt-6 pt-6 border-t border-[var(--border)]">
          {/* 1. Local PC Storage */}
          <div className="p-4 rounded-xl border border-rose-500/25 bg-rose-500/5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-1 mb-2">
                <div className="flex items-center gap-1.5 font-semibold text-xs text-rose-600 dark:text-rose-400">
                  <Laptop size={15} />
                  <span>{isBn ? 'লোকাল কম্পিউটার' : 'Local Computer'}</span>
                </div>
                <XCircle size={15} className="text-rose-500" />
              </div>
              <p className="text-[0.6875rem] text-[var(--text-secondary)] leading-relaxed">
                {isBn
                  ? 'অফলাইন লোকাল ফাইল। অভিভাবকরা ইন্টারনেট থেকে কোনো তথ্য দেখতে পারবেন না।'
                  : 'Offline local files on this PC. Remote internet access for parents is unavailable.'}
              </p>
            </div>
            <span className="text-[0.6875rem] font-semibold text-rose-600 dark:text-rose-400 mt-3 block">
              {isBn ? 'পোর্টাল অনুপলব্ধ' : 'Portal Unavailable'}
            </span>
          </div>

          {/* 2. Provider Cloud Service */}
          <div className="p-4 rounded-xl border border-emerald-500/25 bg-emerald-500/5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-1 mb-2">
                <div className="flex items-center gap-1.5 font-semibold text-xs text-emerald-600 dark:text-emerald-400">
                  <Cloud size={15} />
                  <span>{isBn ? 'প্রোভাইডার ক্লাউড' : 'Provider Cloud'}</span>
                </div>
                <CheckCircle2 size={15} className="text-emerald-500" />
              </div>
              <p className="text-[0.6875rem] text-[var(--text-secondary)] leading-relaxed">
                {isBn
                  ? 'সার্বক্ষণিক ক্লাউড ডাটাবেজ। অভিভাবকরা ২৪/৭ ঘরে বসে পোর্টাল ব্যবহার ও ফি দিতে পারেন।'
                  : 'Fully hosted cloud database. Parents access portal and pay fees 24/7 online.'}
              </p>
            </div>
            <span className="text-[0.6875rem] font-semibold text-emerald-600 dark:text-emerald-400 mt-3 block">
              {isBn ? 'সম্পূর্ণ সক্রিয়' : 'Fully Supported'}
            </span>
          </div>

          {/* 3. Personal VPS Server */}
          <div className="p-4 rounded-xl border border-indigo-500/25 bg-indigo-500/5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-1 mb-2">
                <div className="flex items-center gap-1.5 font-semibold text-xs text-indigo-600 dark:text-indigo-400">
                  <Server size={15} />
                  <span>{isBn ? 'পার্সোনাল ভিপিএস' : 'Personal VPS'}</span>
                </div>
                <CheckCircle2 size={15} className="text-indigo-500" />
              </div>
              <p className="text-[0.6875rem] text-[var(--text-secondary)] leading-relaxed">
                {isBn
                  ? 'প্রতিষ্ঠানের নিজস্ব ভিপিএস ডাটাবেজ। ডাটা প্রতিষ্ঠানের নিয়ন্ত্রণে থেকেই পোর্টাল চলে।'
                  : 'Self-hosted VPS server. Full control over data with secure online portal access.'}
              </p>
            </div>
            <span className="text-[0.6875rem] font-semibold text-indigo-600 dark:text-indigo-400 mt-3 block">
              {isBn ? 'সম্পূর্ণ সক্রিয়' : 'Fully Supported'}
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-6 pt-5 border-t border-[var(--border)] flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
            <ShieldAlert size={14} className="text-amber-500 shrink-0" />
            <span>
              {isBn
                ? 'অনলাইন ফি পেমেন্ট ও এসএমএস নোটিফিকেশনের জন্য ডাটাবেজ সংযোগ আবশ্যক।'
                : 'Database connection is required for online fee payment and live alerts.'}
            </span>
          </div>

          {isInstitutionAdmin && (
            <button
              type="button"
              onClick={handleGoToSettings}
              className="h-9 px-4 rounded-xl bg-[var(--brand)] text-white hover:opacity-90 text-xs font-semibold flex items-center gap-1.5 transition-opacity shadow-xs cursor-pointer border-none"
            >
              <span>{isBn ? 'ক্লাউড / ভিপিএস সার্ভার কনফিগার করুন' : 'Configure Cloud or VPS Server'}</span>
              <ArrowRight size={13} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
})
