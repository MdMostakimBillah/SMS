import React from 'react'
import { Phone, Mail, Send } from 'lucide-react'
import type { PortalChild } from '../../types'

interface TeacherEntry {
  name: string
  roleEn: string
  roleBn: string
  phone: string
  email: string
  isClassTeacher: boolean
}

interface TeachersSectionProps {
  child: PortalChild
  teachers: TeacherEntry[]
  onSelectTeacherForMessage: (teacherName: string) => void
  isBn: boolean
}

export const TeachersSection = React.memo(function TeachersSection({
  child,
  teachers,
  onSelectTeacherForMessage,
  isBn,
}: TeachersSectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">
          {isBn ? 'শ্রেণি ও বিষয়ভিত্তিক শিক্ষকবৃন্দ' : 'Class & Subject Teachers'}
        </h3>
        <span className="text-xs text-gray-500">
          {child.class} - {isBn ? 'শাখা' : 'Section'} {child.section}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {teachers.map((teacher, idx) => (
          <div
            key={idx}
            className={`p-4 rounded-xl border bg-white dark:bg-gray-800 transition-all ${
              teacher.isClassTeacher
                ? 'border-blue-300 dark:border-blue-700 ring-1 ring-blue-100 dark:ring-blue-900/30'
                : 'border-gray-200 dark:border-gray-700'
            }`}
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-sm">
                  {teacher.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                      {teacher.name}
                    </h4>
                    {teacher.isClassTeacher && (
                      <span className="px-2 py-0.5 text-[0.625rem] font-bold rounded-full bg-blue-600 text-white">
                        {isBn ? 'শ্রেণি শিক্ষক' : 'Class Teacher'}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {isBn ? teacher.roleBn : teacher.roleEn}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-1.5 text-xs text-gray-600 dark:text-gray-300 pt-2 border-t border-gray-100 dark:border-gray-700/60">
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-gray-400" />
                <a href={`tel:${teacher.phone}`} className="hover:text-blue-600 hover:underline">
                  {teacher.phone}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-gray-400" />
                <a href={`mailto:${teacher.email}`} className="hover:text-blue-600 hover:underline">
                  {teacher.email}
                </a>
              </div>
            </div>

            <div className="mt-3 pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => onSelectTeacherForMessage(teacher.name)}
                className="flex-1 py-1.5 px-3 text-xs font-semibold rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-100 transition-colors flex items-center justify-center gap-1.5"
              >
                <Send className="w-3 h-3" />
                <span>{isBn ? 'বার্তা পাঠান' : 'Send Message'}</span>
              </button>
              <a
                href={`tel:${teacher.phone}`}
                className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title={isBn ? 'কল করুন' : 'Call'}
              >
                <Phone className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
})
