import { useState } from 'react'
import {
  GraduationCap, Users, UserCheck, Eye, EyeOff, Copy, Check,
  Edit2, KeyRound, Lock, Unlock, CheckCircle2, AlertCircle
} from 'lucide-react'
import type { AccountTableRowProps } from '../types'

export function AccountTableRow({
  isBn,
  account,
  isSelected,
  onToggleSelect,
  onEditUsername,
  onResetPassword,
  onToggleStatus,
}: AccountTableRowProps) {
  const [showPass, setShowPass] = useState(false)
  const [copiedUser, setCopiedUser] = useState(false)
  const [copiedPass, setCopiedPass] = useState(false)

  const isTeacher = account.role === 'teacher'
  const isStudent = account.role === 'student'
  const isLocked = account.status === 'locked'

  const copyToClipboard = (text: string, type: 'user' | 'pass') => {
    navigator.clipboard.writeText(text)
    if (type === 'user') {
      setCopiedUser(true)
      setTimeout(() => setCopiedUser(false), 1500)
    } else {
      setCopiedPass(true)
      setTimeout(() => setCopiedPass(false), 1500)
    }
  }

  return (
    <tr
      className={`border-b border-[var(--border)] transition-colors hover:bg-[var(--bg-secondary)]/50 ${
        isSelected ? 'bg-[var(--brand)]/5' : ''
      }`}
    >
      {/* Selection Checkbox */}
      <td className="p-3.5 text-center">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelect(account.id)}
          className="rounded border-[var(--border)] text-[var(--brand)] cursor-pointer"
        />
      </td>

      {/* Account Info & Role */}
      <td className="p-3.5">
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-bold text-[0.75rem] ${
              isTeacher
                ? 'bg-teal-500/15 text-teal-500'
                : isStudent
                ? 'bg-blue-500/15 text-blue-500'
                : 'bg-purple-500/15 text-purple-500'
            }`}
          >
            {isTeacher ? <UserCheck size={18} /> : isStudent ? <GraduationCap size={18} /> : <Users size={18} />}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[0.8125rem] font-semibold text-[var(--text-primary)] truncate">
                {isTeacher || isStudent
                  ? isBn && account.studentNameBn
                    ? account.studentNameBn
                    : account.studentNameEn
                  : account.guardianName || (isBn ? 'অভিভাবক' : 'Guardian')}
              </span>
              <span
                className={`px-1.5 py-0.2 rounded text-[0.625rem] font-semibold uppercase ${
                  isTeacher
                    ? 'bg-teal-500/10 text-teal-500'
                    : isStudent
                    ? 'bg-blue-500/10 text-blue-500'
                    : 'bg-purple-500/10 text-purple-500'
                }`}
              >
                {isTeacher
                  ? isBn
                    ? 'শিক্ষক'
                    : 'Teacher'
                  : isStudent
                  ? isBn
                    ? 'ছাত্র'
                    : 'Student'
                  : isBn
                  ? 'অভিভাবক'
                  : 'Parent'}
              </span>
            </div>
            {isTeacher && (
              <div className="text-[0.6875rem] text-[var(--text-muted)] truncate">
                {account.designation || 'Teacher'}
                {account.department ? ` • ${account.department}` : ''}
              </div>
            )}
            {!isStudent && !isTeacher && (
              <div className="text-[0.6875rem] text-[var(--text-muted)] truncate">
                {isBn ? 'শিক্ষার্থী: ' : 'Student: '}
                {isBn && account.studentNameBn ? account.studentNameBn : account.studentNameEn}
              </div>
            )}
            <div className="text-[0.6875rem] text-[var(--text-muted)] mt-0.5">
              {isTeacher ? 'Staff ID: ' : 'ID: '}
              <span className="font-mono">{account.staffId || account.studentId}</span>
            </div>
          </div>
        </div>
      </td>

      {/* Institution, Class & Roll / Department */}
      <td className="p-3.5">
        <div className="text-[0.8125rem] font-medium text-[var(--text-primary)] truncate max-w-[160px]">
          {account.schoolName || 'Institution'}
        </div>
        <div className="text-[0.6875rem] text-[var(--text-muted)] mt-0.5">
          {isTeacher ? (
            account.department ? `${account.department}` : account.phone || account.email
          ) : (
            <>
              {account.class ? `${account.class}` : ''}
              {account.section ? ` - ${account.section}` : ''}
              {account.roll ? ` • ${isBn ? 'রোল' : 'Roll'}: ${account.roll}` : ''}
            </>
          )}
        </div>
      </td>

      {/* Username with Copy & Edit */}
      <td className="p-3.5">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)]">
          <span className="font-mono text-[0.8125rem] font-semibold text-[var(--text-primary)]">
            {account.username}
          </span>
          <button
            onClick={() => copyToClipboard(account.username, 'user')}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] bg-transparent border-none cursor-pointer p-0.5"
            title={isBn ? 'কপি করুন' : 'Copy Username'}
          >
            {copiedUser ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
          </button>
          <button
            onClick={() => onEditUsername(account)}
            className="text-[var(--text-muted)] hover:text-[var(--brand)] bg-transparent border-none cursor-pointer p-0.5"
            title={isBn ? 'ইউজারনেম পরিবর্তন' : 'Edit Username'}
          >
            <Edit2 size={12} />
          </button>
        </div>
      </td>

      {/* Password with Eye Toggle, Copy & Reset */}
      <td className="p-3.5">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)]">
          <span className="font-mono text-[0.8125rem] font-medium text-[var(--text-primary)] min-w-[70px]">
            {showPass ? account.password : '••••••••'}
          </span>
          <button
            onClick={() => setShowPass(!showPass)}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] bg-transparent border-none cursor-pointer p-0.5"
            title={showPass ? (isBn ? 'লুকান' : 'Hide') : (isBn ? 'দেখান' : 'Show')}
          >
            {showPass ? <EyeOff size={12} /> : <Eye size={12} />}
          </button>
          <button
            onClick={() => copyToClipboard(account.password, 'pass')}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] bg-transparent border-none cursor-pointer p-0.5"
            title={isBn ? 'পাসওয়ার্ড কপি' : 'Copy Password'}
          >
            {copiedPass ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
          </button>
          <button
            onClick={() => onResetPassword(account)}
            className="text-[var(--text-muted)] hover:text-[var(--brand)] bg-transparent border-none cursor-pointer p-0.5"
            title={isBn ? 'পাসওয়ার্ড রিসেট করুন' : 'Reset Password'}
          >
            <KeyRound size={12} />
          </button>
        </div>
      </td>

      {/* Status Badge */}
      <td className="p-3.5">
        <div className="flex items-center gap-1.5">
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.6875rem] font-semibold ${
              isLocked
                ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                : account.status === 'pending'
                ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
            }`}
          >
            {isLocked ? <AlertCircle size={10} /> : <CheckCircle2 size={10} />}
            {isLocked
              ? isBn
                ? 'লকড'
                : 'Locked'
              : account.status === 'pending'
              ? isBn
                ? 'পেন্ডিং'
                : 'Pending'
              : isBn
              ? 'সক্রিয়'
              : 'Active'}
          </span>
        </div>
      </td>

      {/* Quick Actions */}
      <td className="p-3.5 text-right">
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => onToggleStatus(account.id)}
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
              isLocked
                ? 'border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10 bg-transparent'
                : 'border-red-500/30 text-red-500 hover:bg-red-500/10 bg-transparent'
            }`}
            title={isLocked ? (isBn ? 'আনলক করুন' : 'Unlock Account') : (isBn ? 'লক করুন' : 'Lock Account')}
          >
            {isLocked ? <Unlock size={14} /> : <Lock size={14} />}
          </button>
        </div>
      </td>
    </tr>
  )
}
