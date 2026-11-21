import React from 'react'
import { Award, Shield, MapPin, Heart, CreditCard } from 'lucide-react'
import type { PortalChild } from '../types'

interface ProfileTabProps {
  child: PortalChild
  onOpenIdCard: () => void
  isBn: boolean
}

export const ProfileTab = React.memo(function ProfileTab({
  child,
  onOpenIdCard,
  isBn,
}: ProfileTabProps) {
  return (
    <div className="space-y-6">
      {/* Top Profile Hero Card */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
          <img
            src={child.photo}
            alt={child.nameEn}
            className="w-24 h-24 rounded-2xl object-cover border-2 border-blue-500 shadow-sm"
          />

          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {isBn ? child.nameBn : child.nameEn}
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {child.nameEn} • {isBn ? 'রোল নং:' : 'Roll No:'} <span className="font-semibold text-gray-700 dark:text-gray-300">{child.roll}</span>
                </p>
              </div>

              <button
                type="button"
                onClick={onOpenIdCard}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors flex items-center justify-center gap-2"
              >
                <CreditCard className="w-4 h-4" />
                <span>{isBn ? 'ডিজিটাল আইডি কার্ড' : 'Digital ID Card'}</span>
              </button>
            </div>

            <div className="flex flex-wrap gap-2 mt-4 justify-center sm:justify-start">
              <span className="px-3 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-semibold">
                {child.class} ({isBn ? 'শাখা' : 'Sec'} {child.section})
              </span>
              <span className="px-3 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
                {isBn ? 'সেশন:' : 'Session:'} {child.academicYear}
              </span>
              <span className="px-3 py-1 rounded-lg bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-semibold">
                {isBn ? 'রক্তের গ্রুপ:' : 'Blood:'} {child.bloodGroup}
              </span>
              <span className="px-3 py-1 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-medium">
                {isBn ? 'লিঙ্গ:' : 'Gender:'} {child.gender}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Two-column Information Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Academic Details */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-100 dark:border-gray-700 pb-3">
            <Award className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">
              {isBn ? 'একাডেমিক তথ্য' : 'Academic Information'}
            </h3>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between py-1 border-b border-gray-50 dark:border-gray-750">
              <span className="text-gray-500">{isBn ? 'শ্রেণি ও বিভাগ' : 'Class & Section'}</span>
              <span className="font-semibold text-gray-800 dark:text-gray-200">{child.class} - {child.section}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-gray-50 dark:border-gray-750">
              <span className="text-gray-500">{isBn ? 'ক্লাস রোল নং' : 'Class Roll'}</span>
              <span className="font-semibold text-gray-800 dark:text-gray-200">{child.roll}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-gray-50 dark:border-gray-750">
              <span className="text-gray-500">{isBn ? 'শিক্ষাবর্ষ' : 'Academic Year'}</span>
              <span className="font-semibold text-gray-800 dark:text-gray-200">{child.academicYear}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-gray-50 dark:border-gray-750">
              <span className="text-gray-500">{isBn ? 'জন্ম তারিখ' : 'Date of Birth'}</span>
              <span className="font-semibold text-gray-800 dark:text-gray-200">{child.dob}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-gray-50 dark:border-gray-750">
              <span className="text-gray-500">{isBn ? 'শ্রেণি শিক্ষক' : 'Class Teacher'}</span>
              <span className="font-semibold text-blue-600 dark:text-blue-400">{child.classTeacherName}</span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-gray-500">{isBn ? 'শিক্ষকের ইমেইল' : 'Teacher Email'}</span>
              <span className="text-gray-700 dark:text-gray-300">{child.classTeacherEmail}</span>
            </div>
          </div>
        </div>

        {/* Guardian & Parents Info */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-100 dark:border-gray-700 pb-3">
            <Shield className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">
              {isBn ? 'পিতামাতা ও অভিভাবকের তথ্য' : 'Parent & Guardian Information'}
            </h3>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between py-1 border-b border-gray-50 dark:border-gray-750">
              <span className="text-gray-500">{isBn ? 'পিতার নাম' : "Father's Name"}</span>
              <span className="font-semibold text-gray-800 dark:text-gray-200">{child.fatherName}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-gray-50 dark:border-gray-750">
              <span className="text-gray-500">{isBn ? 'পিতার ফোন' : "Father's Phone"}</span>
              <span className="text-gray-800 dark:text-gray-200">{child.fatherPhone}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-gray-50 dark:border-gray-750">
              <span className="text-gray-500">{isBn ? 'মাতার নাম' : "Mother's Name"}</span>
              <span className="font-semibold text-gray-800 dark:text-gray-200">{child.motherName}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-gray-50 dark:border-gray-750">
              <span className="text-gray-500">{isBn ? 'মাতার ফোন' : "Mother's Phone"}</span>
              <span className="text-gray-800 dark:text-gray-200">{child.motherPhone}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-gray-50 dark:border-gray-750">
              <span className="text-gray-500">{isBn ? 'আইনগত অভিভাবক' : 'Legal Guardian'}</span>
              <span className="font-semibold text-gray-800 dark:text-gray-200">{child.guardianName} ({child.guardianRelation})</span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-gray-500">{isBn ? 'জরুরি যোগাযোগ' : 'Emergency Contact'}</span>
              <span className="font-semibold text-red-600 dark:text-red-400">{child.emergencyContact}</span>
            </div>
          </div>
        </div>

        {/* Address & Residential Info */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-100 dark:border-gray-700 pb-3">
            <MapPin className="w-4 h-4 text-purple-600" />
            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">
              {isBn ? 'ঠিকানা ও বাসস্থান' : 'Address Details'}
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <div className="text-gray-500 font-medium mb-1">{isBn ? 'বর্তমান ঠিকানা' : 'Present Address'}</div>
              <div className="text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-750 p-2.5 rounded-lg border border-gray-100 dark:border-gray-700">
                {child.presentAddress}
              </div>
            </div>
            <div>
              <div className="text-gray-500 font-medium mb-1">{isBn ? 'স্থায়ী ঠিকানা' : 'Permanent Address'}</div>
              <div className="text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-750 p-2.5 rounded-lg border border-gray-100 dark:border-gray-700">
                {child.presentAddress}
              </div>
            </div>
          </div>
        </div>

        {/* Medical & Health Notice */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-100 dark:border-gray-700 pb-3">
            <Heart className="w-4 h-4 text-red-500" />
            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">
              {isBn ? 'স্বাস্থ্য ও জরুরি তথ্য' : 'Health & Emergency Info'}
            </h3>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between py-1 border-b border-gray-50 dark:border-gray-750">
              <span className="text-gray-500">{isBn ? 'রক্তের গ্রুপ' : 'Blood Group'}</span>
              <span className="font-bold text-red-600 dark:text-red-400">{child.bloodGroup}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-gray-50 dark:border-gray-750">
              <span className="text-gray-500">{isBn ? 'অ্যালার্জি সংক্রান্ত তথ্য' : 'Known Allergies'}</span>
              <span className="text-gray-700 dark:text-gray-300">{isBn ? 'কোনো অ্যালার্জি নেই' : 'None recorded'}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-gray-50 dark:border-gray-750">
              <span className="text-gray-500">{isBn ? 'বিশেষ চিকিৎসা নির্দেশনা' : 'Medical Advisory'}</span>
              <span className="text-gray-700 dark:text-gray-300">{isBn ? 'স্বাভাবিক' : 'Normal / Fit'}</span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-gray-500">{isBn ? 'জরুরি হাসপাতাল সংযোগ' : 'Emergency Hospital'}</span>
              <span className="text-gray-700 dark:text-gray-300">Popular Diagnostic Hospital, Dhanmondi</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
})
