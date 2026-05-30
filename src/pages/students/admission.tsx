import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from '@iconify/react'
import { useAppStore } from '@/store/appStore'
import { useWindowSize } from '@/hooks/useWindowSize'
import GeneralAdmission from './admission/GeneralAdmission'
import BulkAdmission from './admission/BulkAdmission'
import AdmissionManage from './admission/AdmissionManage'

const tabs = [
  { id: 'general', bn: 'সাধারণ ভর্তি',  en: 'General Admission',  icon: 'lucide:user-plus' },
  { id: 'bulk',    bn: 'বাল্ক ভর্তি',   en: 'Bulk Admission',     icon: 'lucide:users' },
  { id: 'manage',  bn: 'ভর্তি ম্যানেজ', en: 'Manage Admissions',  icon: 'lucide:list-checks' },
]

export default function StudentAdmission() {
  const navigate = useNavigate()
  const { language } = useAppStore()
  const { isMobile } = useWindowSize()
  const [activeTab, setActiveTab] = useState('general')
  const isBn = language === 'bn'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Back + Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        <button onClick={() => navigate('/students')}
          style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 12px', borderRadius: '9px', background: 'var(--bg-primary)', border: '1px solid var(--border)', cursor: 'pointer', fontSize: '13px', color: 'var(--text-secondary)', fontFamily: 'inherit' }}>
          <Icon icon="lucide:arrow-left" width={14} />
          {isBn ? 'ফিরে যান' : 'Back'}
        </button>
        <div>
          <h1 style={{ fontSize: isMobile ? '17px' : '20px', fontWeight: 600, color: 'var(--text-primary)' }}>
            {isBn ? 'ছাত্র ভর্তি' : 'Student Admission'}
          </h1>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            {isBn ? 'নতুন ছাত্র ভর্তি ও পরিচালনা' : 'Admit and manage students'}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '6px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '12px', padding: '5px', flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px', padding: '9px 14px', borderRadius: '9px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 500, fontFamily: 'inherit', transition: 'all 0.15s', background: activeTab === tab.id ? 'var(--brand)' : 'transparent', color: activeTab === tab.id ? '#fff' : 'var(--text-secondary)', boxShadow: activeTab === tab.id ? '0 4px 12px rgba(99,102,241,0.3)' : 'none' }}>
            <Icon icon={tab.icon} width={15} />
            {isBn ? tab.bn : tab.en}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'general' && <GeneralAdmission />}
      {activeTab === 'bulk'    && <BulkAdmission />}
      {activeTab === 'manage'  && <AdmissionManage />}
    </div>
  )
}
