import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, UserPlus, Users, ListChecks } from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { useWindowSize } from '@/hooks/useWindowSize'
import { useTabSlider } from '@/hooks/useTabSlider'
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
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map())
  const sliderRef = useRef<HTMLDivElement>(null)

  useTabSlider({
    activeTab,
    tabRefs,
    sliderRef,
    getContainer: (slider) => slider.parentElement,
  })

  return (
    <div className="flex flex-col gap-[0.875rem]">
      <div className="flex items-center gap-[0.625rem] flex-wrap">
        <button
          onClick={() => navigate('/students')}
          className="glass flex items-center gap-[0.3125rem] px-3 py-[0.4375rem] rounded-[0.5625rem] cursor-pointer text-[0.8125rem] text-[var(--text-secondary)] font-[inherit]"
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
        className={`relative flex gap-[0.375rem] glass rounded-xl p-[0.3125rem] w-full ${isMobile ? 'flex-wrap' : 'flex-nowrap'}`}
      >
        {/* Sliding indicator */}
        <div
          ref={sliderRef}
          className="absolute top-[0.3125rem] bottom-[0.3125rem] rounded-[0.5625rem] [transition:width_300ms_ease-out,transform_300ms_ease-out,background-color_300ms_ease-out]"
          style={{
            background: 'var(--brand)',
            boxShadow: '0 2px 8px rgba(99, 102, 241, 0.3)',
            zIndex: 0,
          }}
        />

        {tabs.map((tab) => (
          <button
            key={tab.id}
            ref={(el) => {
              if (el) tabRefs.current.set(tab.id, el)
            }}
            onClick={() => setActiveTab(tab.id)}
            className={`relative z-10 flex-1 flex items-center justify-center gap-[0.4375rem] px-[0.875rem] py-[0.5625rem] rounded-[0.5625rem] border-none cursor-pointer text-[0.8125rem] font-medium font-[inherit] transition-colors duration-200 ${
              activeTab === tab.id ? 'text-white' : 'bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
            style={{ background: 'transparent' }}
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
