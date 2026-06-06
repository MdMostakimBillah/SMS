import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, UserPlus, Users, ListChecks } from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { useWindowSize } from '@/hooks/useWindowSize'
import GeneralAdmission from './admission/GeneralAdmission'
import BulkAdmission from './admission/BulkAdmission'
import AdmissionManage from './admission/AdmissionManage'

const tabs = [
  { id: 'general', bn: 'সাধারণ ভর্তি', en: 'General Admission', icon: <UserPlus size={15} /> },
  { id: 'bulk', bn: 'বাল্ক ভর্তি', en: 'Bulk Admission', icon: <Users size={15} /> },
  { id: 'manage', bn: 'ভর্তি ম্যানেজ', en: 'Manage Admissions', icon: <ListChecks size={15} /> },
]

export default function StudentAdmission() {
  const navigate = useNavigate()
  const { isMobile } = useWindowSize()
  const [activeTab, setActiveTab] = useState('general')
  const isBn = useBn()

  return (
    <div className="flex flex-col gap-[0.875rem]">
      <div className="flex items-center gap-[0.625rem] flex-wrap">
        <button
          onClick={() => navigate('/students')}
          className="flex items-center gap-[0.3125rem] px-3 py-[0.4375rem] rounded-[0.5625rem] bg-[var(--bg-primary)] border border-[var(--border)] cursor-pointer text-[0.8125rem] text-[var(--text-secondary)] font-[inherit]"
        >
          <ArrowLeft size={14} />
          {isBn ? 'ফিরে যান' : 'Back'}
        </button>
        <div>
          <h1 className={`${isMobile ? 'text-[1.0625rem]' : 'text-[1.25rem]'} font-semibold text-[var(--text-primary)]`}>
            {isBn ? 'ছাত্র ভর্তি' : 'Student Admission'}
          </h1>
          <p className="text-[0.75rem] text-[var(--text-secondary)] mt-[0.125rem]">
            {isBn ? 'নতুন ছাত্র ভর্তি ও পরিচালনা' : 'Admit and manage students'}
          </p>
        </div>
      </div>

      <div
        className={`flex gap-[0.375rem] bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl p-[0.3125rem] ${isMobile ? 'flex-wrap' : 'flex-nowrap'}`}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-[0.4375rem] px-[0.875rem] py-[0.5625rem] rounded-[0.5625rem] border-none cursor-pointer text-[0.8125rem] font-medium font-[inherit] transition-all duration-150 ${activeTab === tab.id ? 'bg-[var(--brand)] text-white shadow-[0_4px_12px_rgba(99,102,241,0.3)]' : 'bg-transparent text-[var(--text-secondary)] shadow-none'}`}
          >
            {tab.icon}
            {isBn ? tab.bn : tab.en}
          </button>
        ))}
      </div>

      {activeTab === 'general' && <GeneralAdmission />}
      {activeTab === 'bulk' && <BulkAdmission />}
      {activeTab === 'manage' && <AdmissionManage />}
    </div>
  )
}
