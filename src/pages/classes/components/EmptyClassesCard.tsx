import React from 'react'
import { GraduationCap, Plus, Sparkles } from 'lucide-react'
import { usePermission } from '@/hooks/usePermission'

interface EmptyClassesCardProps {
  onAddClass: () => void
  onAddStandardClasses: () => void
  isBn: boolean
}

export const EmptyClassesCard = React.memo(function EmptyClassesCard({
  onAddClass,
  onAddStandardClasses,
  isBn,
}: EmptyClassesCardProps) {
  const { canCreate } = usePermission()

  return (
    <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-8 sm:p-12 text-center shadow-xs">
      <div className="mx-auto w-14 h-14 rounded-2xl bg-[var(--brand)]/10 text-[var(--brand)] flex items-center justify-center mb-4">
        <GraduationCap size={28} />
      </div>

      <h3 className="text-[1.125rem] font-bold text-[var(--text-primary)] mb-2">
        {isBn ? 'কোনো শ্রেণি পাওয়া যায়নি' : 'No Classes Found'}
      </h3>

      <p className="text-[0.8125rem] text-[var(--text-secondary)] max-w-md mx-auto mb-6 leading-relaxed">
        {isBn
          ? 'এই সেশনে এখনো কোনো শ্রেণি তৈরি করা হয়নি। নতুন শ্রেণি যোগ করুন অথবা এক ক্লিকে স্ট্যান্ডার্ড শ্রেণি ১ থেকে ১০ তৈরি করুন।'
          : 'No classes have been added to this academic session yet. Create a custom class or automatically generate standard Class 1 through Class 10.'}
      </p>

      {canCreate('classes.classes') && (
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={onAddClass}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--brand)] text-white text-[0.8125rem] font-medium shadow-xs hover:opacity-95 transition-all cursor-pointer border-none"
          >
            <Plus size={16} />
            <span>{isBn ? 'নতুন শ্রেণি যোগ করুন' : 'Add New Class'}</span>
          </button>

          <button
            type="button"
            onClick={onAddStandardClasses}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[var(--brand)] bg-[var(--brand)]/10 text-[var(--brand)] text-[0.8125rem] font-medium shadow-xs hover:bg-[var(--brand)] hover:text-white transition-all cursor-pointer"
            title={isBn ? 'শ্রেণি ১ থেকে ১০ স্বয়ংক্রিয়ভাবে তৈরি করুন' : 'Automatically create Class 1 to 10 with Section A'}
          >
            <Sparkles size={16} />
            <span>{isBn ? 'স্ট্যান্ডার্ড শ্রেণি ১-১০ যোগ করুন' : 'Add Standard Classes (1 - 10)'}</span>
          </button>
        </div>
      )}
    </div>
  )
})
