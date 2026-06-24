import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Settings,
  Users,
  CalendarDays,
  Download,
} from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { useWindowSize } from '@/hooks/useWindowSize'
import { useTabSlider } from '@/hooks/useTabSlider'
import { useNavChain, useNavChainClearOnMount } from '@/hooks/useNavChain'
import { useClassStore } from '@/store/classStore'
import { useTeacherStore } from '@/store/teacherStore'
import { useAdmissionStore } from '@/store/admissionStore'
import ClassesTab from './ClassesTab'
import InstitutionTab from './tabs/InstitutionTab'
import RoutineTab from './tabs/RoutineTab'

export default function ClassesPage() {
  const navigate = useNavigate()
  const { isMobile, isTablet } = useWindowSize()
  const {
    institution,
    classes,
    routines,
    updateInstitution,
    addClass,
    updateClass,
    deleteClass,
    addSection,
    updateSection,
    deleteSection,
    updateRoutine,
    setRoutineSlot,
    clearRoutineSlot,
    switchSession,
    importFromSession,
  } = useClassStore()
  const { teachers, subjects } = useTeacherStore()
  const { students } = useAdmissionStore()
  const isBn = useBn()

  const [activeTab, setActiveTab] = useState<'institution' | 'classes' | 'routine'>('institution')
  const [editingInst, setEditingInst] = useState(false)
  const [instForm, setInstForm] = useState(() => ({
    ...institution,
    breaks: institution.breaks?.length > 0 ? institution.breaks : [{ id: 'BRK-1', label: 'Tiffin', start: '11:00', end: '11:30' }],
  }))
  const [saved, setSaved] = useState(false)
  const [expandedMode, setExpandedMode] = useState<'light' | 'dark' | null>(null)
  const [newSessionInput, setNewSessionInput] = useState('')
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map())
  const sliderRef = useRef<HTMLDivElement>(null)

  useTabSlider({
    activeTab,
    tabRefs,
    sliderRef,
    getContainer: (slider) => slider.parentElement,
    useScrollLeft: false,
  })

  const handleSaveInstitution = () => {
    updateInstitution(instForm)
    setEditingInst(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const { popFromChain, getChain } = useNavChain()
  useNavChainClearOnMount()

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-[0.625rem] mb-4 flex-wrap">
        <button
          onClick={() => {
            const prev = popFromChain()
            if (prev) {
              navigate(prev.path)
            } else {
              navigate('/')
            }
          }}
          className="flex items-center gap-[0.3125rem] py-[0.4375rem] px-3 rounded-[0.5625rem] bg-[var(--bg-primary)] border border-[var(--border)] cursor-pointer text-[0.8125rem] text-[var(--text-secondary)] font-[inherit] shrink-0"
        >
          <ArrowLeft size={14} />
          {isBn ? 'ফিরে যান' : 'Back'}
        </button>
        <div className="flex-1">
          {(() => {
            const chain = getChain()
            if (chain.length === 0) return null
            return (
              <div className="flex items-center gap-1 text-[0.6875rem] text-[var(--text-muted)] mb-1 flex-wrap">
                {chain.map((item: { path: string; label: string }, idx: number) => (
                  <span key={idx} className="flex items-center gap-1">
                    {idx > 0 && <span className="text-[var(--text-muted)]">›</span>}
                    <button
                      onClick={() => {
                        navigate(item.path)
                      }}
                      className="py-[0.1875rem] px-[0.5rem] rounded bg-[var(--bg-secondary)] border border-[var(--border)] hover:bg-[var(--brand-light)] hover:border-[var(--brand)] hover:text-[var(--brand)] cursor-pointer text-[inherit] font-[inherit] transition-colors"
                    >
                      {item.label}
                    </button>
                  </span>
                ))}
                <span className="text-[var(--text-muted)]">›</span>
                <span className="py-[0.1875rem] px-[0.5rem] rounded bg-[var(--brand)] text-white font-medium">
                  {isBn ? 'শ্রেণি' : 'Classes'}
                </span>
              </div>
            )
          })()}
          <h1 className={`${isMobile ? 'text-[1.125rem]' : 'text-[1.375rem]'} font-semibold text-[var(--text-primary)]`}>
            {isBn ? 'শ্রেণি ব্যবস্থাপনা' : 'Classes Management'}
          </h1>
          <p className="text-[0.75rem] text-[var(--text-secondary)] mt-[0.125rem]">
            {isBn ? 'প্রতিষ্ঠান সেটিংস এবং শ্রেণি পরিচালনা' : 'Institution settings & class management'}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className={`relative flex gap-[0.375rem] glass rounded-xl p-[0.3125rem] mb-[0.875rem] w-full ${isMobile || isTablet ? 'overflow-x-auto flex-nowrap' : 'flex-wrap'}`}>
        <div
          ref={sliderRef}
          className="absolute top-[0.3125rem] bottom-[0.3125rem] rounded-[0.5625rem] transition-all duration-300 ease-out"
          style={{
            background: activeTab === 'institution' ? 'var(--brand)' : activeTab === 'classes' ? 'var(--teal)' : 'var(--purple)',
            boxShadow: activeTab === 'institution' ? '0 2px 8px rgba(99,102,241,0.3)' : activeTab === 'classes' ? '0 2px 8px rgba(20,184,166,0.3)' : '0 2px 8px rgba(168,85,247,0.3)',
            zIndex: 0,
          }}
        />
        {[
          { id: 'institution' as const, icon: Settings, label: isBn ? 'প্রতিষ্ঠান' : 'Institution' },
          { id: 'classes' as const, icon: Users, label: isBn ? 'শ্রেণি' : 'Classes' },
          { id: 'routine' as const, icon: CalendarDays, label: isBn ? 'রুটিন' : 'Routine' },
        ].map((tab) => (
          <button
            key={tab.id}
            ref={(el) => { if (el) tabRefs.current.set(tab.id, el) }}
            onClick={() => setActiveTab(tab.id)}
            className={`relative z-10 flex items-center justify-center gap-[0.375rem] py-2 px-4 rounded-[0.5625rem] border-none cursor-pointer text-[0.8125rem] font-medium font-[inherit] transition-colors duration-200 whitespace-nowrap ${isMobile || isTablet ? 'shrink-0' : 'flex-1'} ${
              activeTab === tab.id ? 'text-white' : 'bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
            style={{ background: 'transparent' }}
          >
            <tab.icon size={15} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Institution Tab */}
      {activeTab === 'institution' && (
        <InstitutionTab
          institution={institution}
          instForm={instForm}
          setInstForm={setInstForm}
          editingInst={editingInst}
          setEditingInst={setEditingInst}
          saved={saved}
          expandedMode={expandedMode}
          setExpandedMode={setExpandedMode}
          newSessionInput={newSessionInput}
          setNewSessionInput={setNewSessionInput}
          handleSaveInstitution={handleSaveInstitution}
          isBn={isBn}
          isMobile={isMobile}
        />
      )}

      {/* Classes Tab */}
      {activeTab === 'classes' && (
        <ClassesTab
          institution={institution}
          classes={classes}
          teachers={teachers}
          subjects={subjects}
          students={students}
          addClass={addClass}
          updateClass={updateClass}
          deleteClass={deleteClass}
          addSection={addSection}
          updateSection={updateSection}
          deleteSection={deleteSection}
          switchSession={switchSession}
          importFromSession={importFromSession}
          isBn={isBn}
          isMobile={isMobile}
        />
      )}

      {/* Routine Tab */}
      {activeTab === 'routine' && (
        <>
          <div className="flex items-center gap-2 mb-3 py-2 px-3 rounded-lg bg-[var(--purple-light)] border border-[var(--purple)]">
            <CalendarDays size={14} className="text-[var(--purple)]" />
            <span className="text-[0.75rem] font-semibold text-[var(--purple)]">{institution.currentSession}</span>
            <span className="text-[0.6875rem] text-[var(--text-muted)]">{isBn ? 'রুটিন সেশন' : 'Routine Session'}</span>
          </div>

          {routines.length === 0 && institution.sessions.filter((s) => s !== institution.currentSession).length > 0 && (
            <div className="flex items-center gap-3 mb-3 py-3 px-4 rounded-xl bg-[var(--purple-light)] border border-[var(--purple)] border-dashed">
              <div className="w-9 h-9 rounded-lg bg-[var(--purple)] flex items-center justify-center shrink-0">
                <Download size={16} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[0.8125rem] font-semibold text-[var(--purple)]">
                  {isBn ? 'আগের সেশন থেকে রুটিন আমদানি করুন' : 'Import Routines from Previous Session'}
                </div>
                <div className="text-[0.6875rem] text-[var(--text-muted)]">
                  {isBn
                    ? 'এই সেশনে কোনো রুটিন নেই। আগের সেশন থেকে রুটিন আমদানি করুন।'
                    : 'No routines in this session. Import routines from a previous session.'}
                </div>
              </div>
              <div className="flex gap-1.5 shrink-0">
                {institution.sessions
                  .filter((s) => s !== institution.currentSession)
                  .map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        if (window.confirm(isBn ? `"${s}" থেকে সব শ্রেণি ও রুটিন আমদানি করবেন?` : `Import all classes and routines from "${s}"?`)) {
                          importFromSession(s)
                        }
                      }}
                      className="flex items-center gap-[0.25rem] py-[0.375rem] px-3 rounded-lg bg-[var(--purple)] border-none text-white text-[0.6875rem] font-medium cursor-pointer font-[inherit] hover:opacity-90 transition-all"
                    >
                      <Download size={11} />
                      {isBn ? `${s} থেকে আমদানি` : `Import from ${s}`}
                    </button>
                  ))}
              </div>
            </div>
          )}

          <RoutineTab
            classes={classes}
            routines={routines}
            teachers={teachers}
            subjects={subjects}
            institution={institution}
            updateRoutine={updateRoutine}
            setRoutineSlot={setRoutineSlot}
            clearRoutineSlot={clearRoutineSlot}
            isBn={isBn}
            isMobile={isMobile}
          />
        </>
      )}

    </div>
  )
}
