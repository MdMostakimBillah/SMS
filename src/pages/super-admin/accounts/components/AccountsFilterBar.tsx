import { Search, X, Building2, Filter, RotateCcw } from 'lucide-react'
import type { AccountsFilterBarProps } from '../types'

export function AccountsFilterBar({
  isBn,
  filters,
  onFilterChange,
  schools,
  availableClasses,
  availableSections,
  onResetFilters,
}: AccountsFilterBarProps) {
  const hasActiveFilters =
    filters.schoolId !== 'all' ||
    filters.role !== 'all' ||
    filters.className !== 'all' ||
    filters.section !== 'all' ||
    filters.status !== 'all' ||
    Boolean(filters.search.trim())

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-primary)] p-4 space-y-3.5 shadow-sm">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 justify-between">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[240px]">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => onFilterChange('search', e.target.value)}
            placeholder={
              isBn
                ? 'নাম, রোল, ইউজারনেম, ফোন বা স্টুডেন্ট আইডি দিয়ে খুঁজুন...'
                : 'Search by name, roll, username, phone, or student ID...'
            }
            className="w-full pl-10 pr-9 py-2 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-[0.8125rem] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--brand)] transition-colors"
          />
          {filters.search && (
            <button
              onClick={() => onFilterChange('search', '')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] bg-transparent border-none cursor-pointer"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Role Toggle Pills */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] shrink-0">
          <button
            onClick={() => onFilterChange('role', 'all')}
            className={`px-3 py-1.5 rounded-lg text-[0.75rem] font-semibold transition-all cursor-pointer border-none ${
              filters.role === 'all'
                ? 'bg-[var(--bg-primary)] text-[var(--text-primary)] shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] bg-transparent'
            }`}
          >
            {isBn ? 'সকল অ্যাকাউন্ট' : 'All Roles'}
          </button>
          <button
            onClick={() => onFilterChange('role', 'student')}
            className={`px-3 py-1.5 rounded-lg text-[0.75rem] font-semibold transition-all cursor-pointer border-none ${
              filters.role === 'student'
                ? 'bg-blue-500 text-white shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] bg-transparent'
            }`}
          >
            {isBn ? 'শিক্ষার্থী' : 'Students'}
          </button>
          <button
            onClick={() => onFilterChange('role', 'parent')}
            className={`px-3 py-1.5 rounded-lg text-[0.75rem] font-semibold transition-all cursor-pointer border-none ${
              filters.role === 'parent'
                ? 'bg-purple-500 text-white shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] bg-transparent'
            }`}
          >
            {isBn ? 'অভিভাবক' : 'Parents'}
          </button>
          <button
            onClick={() => onFilterChange('role', 'teacher')}
            className={`px-3 py-1.5 rounded-lg text-[0.75rem] font-semibold transition-all cursor-pointer border-none ${
              filters.role === 'teacher'
                ? 'bg-teal-500 text-white shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] bg-transparent'
            }`}
          >
            {isBn ? 'শিক্ষক' : 'Teachers'}
          </button>
        </div>
      </div>

      {/* Dropdown Filters Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2.5 pt-1 border-t border-[var(--border)]">
        {/* School Dropdown */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-[0.8125rem]">
          <Building2 size={14} className="text-[var(--text-muted)] shrink-0" />
          <select
            value={filters.schoolId}
            onChange={(e) => onFilterChange('schoolId', e.target.value)}
            className="w-full bg-transparent text-[var(--text-primary)] border-none outline-none text-[0.75rem] cursor-pointer"
          >
            <option value="all">{isBn ? 'সকল প্রতিষ্ঠান' : 'All Institutions'}</option>
            {schools.map((s) => (
              <option key={s.id} value={s.id}>
                {isBn && s.nameBn ? s.nameBn : s.name}
              </option>
            ))}
          </select>
        </div>

        {/* Class Dropdown */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-[0.8125rem]">
          <Filter size={14} className="text-[var(--text-muted)] shrink-0" />
          <select
            value={filters.className}
            onChange={(e) => onFilterChange('className', e.target.value)}
            className="w-full bg-transparent text-[var(--text-primary)] border-none outline-none text-[0.75rem] cursor-pointer"
          >
            <option value="all">{isBn ? 'সকল শ্রেণি' : 'All Classes'}</option>
            {availableClasses.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Section Dropdown */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-[0.8125rem]">
          <span className="text-[0.6875rem] font-bold text-[var(--text-muted)] shrink-0">SEC</span>
          <select
            value={filters.section}
            onChange={(e) => onFilterChange('section', e.target.value)}
            className="w-full bg-transparent text-[var(--text-primary)] border-none outline-none text-[0.75rem] cursor-pointer"
          >
            <option value="all">{isBn ? 'সকল শাখা' : 'All Sections'}</option>
            {availableSections.map((sec) => (
              <option key={sec} value={sec}>
                {sec}
              </option>
            ))}
          </select>
        </div>

        {/* Status Dropdown */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-[0.8125rem]">
          <span className="text-[0.6875rem] font-bold text-[var(--text-muted)] shrink-0">ST</span>
          <select
            value={filters.status}
            onChange={(e) => onFilterChange('status', e.target.value)}
            className="w-full bg-transparent text-[var(--text-primary)] border-none outline-none text-[0.75rem] cursor-pointer"
          >
            <option value="all">{isBn ? 'সকল স্ট্যাটাস' : 'All Status'}</option>
            <option value="active">{isBn ? 'সক্রিয় (Active)' : 'Active'}</option>
            <option value="locked">{isBn ? 'লকড (Locked)' : 'Locked'}</option>
            <option value="pending">{isBn ? 'পেন্ডিং (Pending)' : 'Pending'}</option>
          </select>
        </div>

        {/* Reset Filters Button */}
        {hasActiveFilters && (
          <button
            onClick={onResetFilters}
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-[0.75rem] font-medium text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer border border-transparent hover:border-red-500/20"
          >
            <RotateCcw size={12} />
            <span>{isBn ? 'ফিল্টার রিসেট' : 'Reset'}</span>
          </button>
        )}
      </div>
    </div>
  )
}
