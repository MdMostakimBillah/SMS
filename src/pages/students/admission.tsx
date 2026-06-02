import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, UserPlus, Users, ListChecks } from 'lucide-react'
import { useAppStore } from '@/store/appStore'
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
  const { language } = useAppStore()
  const { isMobile } = useWindowSize()
  const [activeTab, setActiveTab] = useState('general')
  const isBn = language === 'bn'

  return (
    <div className="flex flex-col gap-[14px]">
      <div className="flex items-center gap-[10px] flex-wrap">
        <button onClick={() => navigate('/students')}
          className="flex items-center gap-[5px] px-3 py-[7px] rounded-[9px] bg-[var(--bg-primary)] border border-[var(--border)] cursor-pointer text-[13px] text-[var(--text-secondary)] font-[inherit]">
          <ArrowLeft size={14} />
          {isBn ? 'ফিরে যান' : 'Back'}
        </button>
        <div>
          <h1 className={`${isMobile ? 'text-[17px]' : 'text-[20px]'} font-semibold text-[var(--text-primary)]`}>
            {isBn ? 'ছাত্র ভর্তি' : 'Student Admission'}
          </h1>
          <p className="text-[12px] text-[var(--text-secondary)] mt-[2px]">
            {isBn ? 'নতুন ছাত্র ভর্তি ও পরিচালনা' : 'Admit and manage students'}
          </p>
        </div>
      </div>

      <div className={`flex gap-[6px] bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl p-[5px] ${isMobile ? 'flex-wrap' : 'flex-nowrap'}`}>
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-[7px] px-[14px] py-[9px] rounded-[9px] border-none cursor-pointer text-[13px] font-medium font-[inherit] transition-all duration-150 ${activeTab === tab.id ? 'bg-[var(--brand)] text-white shadow-[0_4px_12px_rgba(99,102,241,0.3)]' : 'bg-transparent text-[var(--text-secondary)] shadow-none'}`}>
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
