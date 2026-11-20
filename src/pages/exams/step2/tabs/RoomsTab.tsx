import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import { Plus, Edit2, Trash2, X, Copy, ChevronsDown, Building, Sparkles } from 'lucide-react'
import type { ExamRoom } from '@/store/examStore'
import { btnPrimary, inputCls } from '@/lib/styles'
import { usePermission } from '@/hooks/usePermission'

interface Props {
  isBn: boolean
  rooms: ExamRoom[]
  roomCapacityMap: Map<string, { date: string; count: number }[]>
  addRoom: (r: any) => void
  bulkAddRooms?: (rooms: any[]) => void
  updateRoom: (id: string, r: any) => void
  deleteRoom: (id: string) => void
}

interface RoomRow {
  id: string
  roomNo: string
  roomName: string
  capacity: string
  building: string
  floor: string
}

function nextRoomNumber(current: string): string {
  if (!current.trim()) return ''
  const match = current.match(/^(.*?)(\d+)$/)
  if (!match) return current
  const prefix = match[1]
  const numStr = match[2]
  const nextNum = String(Number(numStr) + 1).padStart(numStr.length, '0')
  return `${prefix}${nextNum}`
}

export default React.memo(function RoomsTab({
  isBn,
  rooms,
  roomCapacityMap,
  addRoom,
  bulkAddRooms,
  updateRoom,
  deleteRoom,
}: Props) {
  const { canCreate, canUpdate, canDelete } = usePermission()
  const [showRoomForm, setShowRoomForm] = useState(false)
  const [editRoom, setEditRoom] = useState<ExamRoom | null>(null)

  // Single-row table batch state
  const [roomRows, setRoomRows] = useState<RoomRow[]>([
    { id: 'row-1', roomNo: '', roomName: '', capacity: '40', building: 'Main', floor: '1st' },
  ])
  const [formError, setFormError] = useState('')

  const handleOpenNewModal = () => {
    setEditRoom(null)
    setRoomRows([
      { id: `row-${Date.now()}-1`, roomNo: '', roomName: '', capacity: '40', building: 'Main', floor: '1st' },
    ])
    setFormError('')
    setShowRoomForm(true)
  }

  const handleOpenEditModal = (room: ExamRoom) => {
    setEditRoom(room)
    setRoomRows([
      {
        id: `edit-${room.id}`,
        roomNo: room.roomNo,
        roomName: room.roomName,
        capacity: String(room.capacity),
        building: room.building,
        floor: room.floor,
      },
    ])
    setFormError('')
    setShowRoomForm(true)
  }

  const handleAddRow = () => {
    setRoomRows((prev) => {
      const last = prev[prev.length - 1]
      const nextNo = last ? nextRoomNumber(last.roomNo) : ''
      const nextName = last && last.roomName ? nextRoomNumber(last.roomName) : ''
      return [
        ...prev,
        {
          id: `row-${Date.now()}-${prev.length + 1}`,
          roomNo: nextNo,
          roomName: nextName || nextNo,
          capacity: last?.capacity || '40',
          building: last?.building || 'Main',
          floor: last?.floor || '1st',
        },
      ]
    })
    setFormError('')
  }

  const handleDuplicateRow = (index: number) => {
    const target = roomRows[index]
    if (!target) return
    const nextNo = nextRoomNumber(target.roomNo)
    const nextName = target.roomName ? nextRoomNumber(target.roomName) : ''

    const newRow: RoomRow = {
      id: `row-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      roomNo: nextNo || target.roomNo,
      roomName: nextName || target.roomName,
      capacity: target.capacity,
      building: target.building,
      floor: target.floor,
    }

    setRoomRows((prev) => {
      const next = [...prev]
      next.splice(index + 1, 0, newRow)
      return next
    })
  }

  const handleRemoveRow = (index: number) => {
    if (roomRows.length <= 1) return
    setRoomRows((prev) => prev.filter((_, i) => i !== index))
  }

  const handleUpdateRow = (index: number, field: keyof RoomRow, value: string) => {
    setRoomRows((prev) => {
      const next = [...prev]
      const updated = { ...next[index], [field]: value }
      // Auto-suggest room name if roomNo typed and roomName is empty
      if (field === 'roomNo' && (!updated.roomName || updated.roomName === next[index].roomNo)) {
        updated.roomName = value
      }
      next[index] = updated
      return next
    })
    setFormError('')
  }

  // Apply column value from first row (or specified row) to all other rows
  const applyColumnToAll = (field: 'capacity' | 'building' | 'floor', fromIndex = 0) => {
    const sourceValue = roomRows[fromIndex]?.[field]
    if (sourceValue === undefined) return
    setRoomRows((prev) =>
      prev.map((row) => ({
        ...row,
        [field]: sourceValue,
      }))
    )
  }

  // Quick fill common settings (Capacity, Building, Floor) from 1st row to all rows
  const applyAllSettingsDown = () => {
    const first = roomRows[0]
    if (!first) return
    setRoomRows((prev) =>
      prev.map((r, i) =>
        i === 0
          ? r
          : {
              ...r,
              capacity: first.capacity,
              building: first.building,
              floor: first.floor,
            }
      )
    )
  }

  const handleSaveRooms = () => {
    if (editRoom) {
      const single = roomRows[0]
      if (!single?.roomNo.trim()) {
        setFormError(isBn ? 'কক্ষ নম্বর প্রদান করুন' : 'Please provide Room No')
        return
      }
      updateRoom(editRoom.id, {
        roomNo: single.roomNo.trim(),
        roomName: single.roomName.trim() || single.roomNo.trim(),
        capacity: Number(single.capacity) || 40,
        building: single.building.trim() || 'Main',
        floor: single.floor.trim() || '1st',
        isActive: true,
      })
      setShowRoomForm(false)
      setEditRoom(null)
      return
    }

    // Add multiple rooms
    const validRows = roomRows.filter((r) => r.roomNo.trim().length > 0)
    if (validRows.length === 0) {
      setFormError(isBn ? 'অনুগ্রহ করে অন্তত একটি কক্ষের নম্বর প্রদান করুন' : 'Please enter at least one Room No')
      return
    }

    const roomsToAdd = validRows.map((r) => ({
      roomNo: r.roomNo.trim(),
      roomName: r.roomName.trim() || r.roomNo.trim(),
      capacity: Number(r.capacity) || 40,
      building: r.building.trim() || 'Main',
      floor: r.floor.trim() || '1st',
      isActive: true,
    }))

    if (bulkAddRooms) {
      bulkAddRooms(roomsToAdd)
    } else {
      roomsToAdd.forEach((r) => addRoom(r))
    }

    setShowRoomForm(false)
    setRoomRows([{ id: 'row-1', roomNo: '', roomName: '', capacity: '40', building: 'Main', floor: '1st' }])
  }

  return (
    <>
      <div className="flex justify-between items-center mb-3">
        <span className="text-[0.75rem] text-[var(--text-secondary)]">
          {rooms.length} {isBn ? 'টি কক্ষ' : 'rooms'}
        </span>
        {canCreate('exams.create.create') && (
          <button onClick={handleOpenNewModal} className={btnPrimary}>
            <Plus size={14} />
            {isBn ? 'নতুন কক্ষ' : 'New Room'}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {rooms.map((room) => {
          const dailyEntries = roomCapacityMap.get(room.roomNo) || []
          return (
            <div
              key={room.id}
              className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-[0.875rem] p-[0.875rem] transition-all hover:shadow-sm"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="text-[0.8125rem] font-semibold text-[var(--text-primary)]">{room.roomNo}</div>
                  <div className="text-[0.6875rem] text-[var(--text-muted)]">
                    {room.roomName} · {room.building} · {room.floor}
                  </div>
                </div>
                <div className="flex gap-1">
                  {canUpdate('exams.edit.edit') && (
                    <button
                      onClick={() => handleOpenEditModal(room)}
                      className="w-6 h-6 rounded border border-[var(--border)] bg-[var(--bg-secondary)] flex items-center justify-center cursor-pointer text-[var(--text-muted)] hover:text-[var(--brand)]"
                      title={isBn ? 'সম্পাদনা' : 'Edit'}
                    >
                      <Edit2 size={11} />
                    </button>
                  )}
                  {canDelete('exams.delete.delete') && (
                    <button
                      onClick={() => {
                        if (confirm(isBn ? 'মুছে ফেলবেন?' : 'Delete?')) deleteRoom(room.id)
                      }}
                      className="w-6 h-6 rounded border border-[var(--border)] bg-[var(--bg-secondary)] flex items-center justify-center cursor-pointer text-[var(--text-muted)] hover:text-[var(--red)]"
                      title={isBn ? 'মুছুন' : 'Delete'}
                    >
                      <Trash2 size={11} />
                    </button>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-1">
                {dailyEntries.length > 0 ? (
                  dailyEntries.map((entry) => {
                    const dayUtil = room.capacity > 0 ? Math.round((entry.count / room.capacity) * 100) : 0
                    const label = (() => {
                      try {
                        const d = new Date(entry.date)
                        return `${d.getDate()}/${d.getMonth() + 1}`
                      } catch {
                        return entry.date
                      }
                    })()
                    return (
                      <div key={entry.date} className="flex items-center gap-2">
                        <span className="text-[0.5625rem] text-[var(--text-muted)] w-7 shrink-0">{label}</span>
                        <div className="flex-1 h-[0.25rem] bg-[var(--border)] rounded-[0.125rem]">
                          <div
                            className="h-full rounded-[0.125rem] transition-all"
                            style={{
                              width: dayUtil > 0 ? `${Math.max(dayUtil, 3)}%` : '0%',
                              background:
                                dayUtil > 90 ? 'var(--red)' : dayUtil > 70 ? 'var(--amber)' : 'var(--green)',
                            }}
                          />
                        </div>
                        <span className="text-[0.5625rem] text-[var(--text-muted)] w-14 text-right shrink-0">
                          {entry.count}/{room.capacity}
                        </span>
                      </div>
                    )
                  })
                ) : (
                  <span className="text-[0.5625rem] text-[var(--text-muted)]">
                    {isBn ? 'কোনো পরীক্ষা নির্ধারিত নেই' : 'No exams scheduled'}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Single-row Horizontal Add/Edit Room Modal */}
      {showRoomForm &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/55 backdrop-blur-xs p-3"
            onClick={() => {
              setShowRoomForm(false)
              setEditRoom(null)
            }}
          >
            <div
              className="bg-[var(--bg-primary)] rounded-2xl w-[58rem] max-w-[96vw] max-h-[90vh] flex flex-col shadow-2xl border border-[var(--border)] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] bg-[var(--bg-secondary)]/50">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[var(--brand)]/10 text-[var(--brand)]">
                    <Building size={16} />
                  </div>
                  <div>
                    <h3 className="text-[0.9375rem] font-bold text-[var(--text-primary)] m-0">
                      {editRoom
                        ? isBn
                          ? 'পরীক্ষা কক্ষ সম্পাদনা'
                          : 'Edit Examination Room'
                        : isBn
                        ? 'নতুন পরীক্ষা কক্ষ যোগ করুন'
                        : 'Add Examination Rooms'}
                    </h3>
                    <p className="text-[0.6875rem] text-[var(--text-muted)] m-0">
                      {isBn
                        ? 'প্রতিটি কক্ষের তথ্য এক সারিতে প্রদান করুন। প্লাস বাটনে ক্লিক করে নতুন সারি যোগ করা যাবে।'
                        : 'Enter room details in a single row. Use plus button to add rows and apply repeating column values.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {!editRoom && (
                    <button
                      type="button"
                      onClick={handleAddRow}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--brand)] text-white text-[0.75rem] font-semibold hover:opacity-90 shadow-xs cursor-pointer transition-all"
                      title={isBn ? 'নতুন কক্ষের সারি যোগ করুন' : 'Add New Room Row'}
                    >
                      <Plus size={14} />
                      <span>{isBn ? 'কক্ষ যোগ' : 'Add Room'}</span>
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setShowRoomForm(false)
                      setEditRoom(null)
                    }}
                    className="w-8 h-8 rounded-lg bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--border)] flex items-center justify-center cursor-pointer transition-colors"
                  >
                    <X size={15} />
                  </button>
                </div>
              </div>

              {/* Toolbar & Apply Helpers */}
              {!editRoom && roomRows.length > 1 && (
                <div className="px-6 py-2.5 bg-[var(--brand)]/5 border-b border-[var(--border)] flex items-center justify-between gap-3 flex-wrap text-[0.75rem]">
                  <div className="flex items-center gap-2 text-[var(--text-secondary)] text-[0.6875rem]">
                    <Sparkles size={14} className="text-[var(--brand)] shrink-0" />
                    <span className="font-medium">
                      {isBn
                        ? 'দ্রুত তথ্য কপি ও প্রয়োগ করুন:'
                        : 'Quick Copy & Apply Column Values:'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => applyColumnToAll('capacity', 0)}
                      title={isBn ? '১ম সারির ধারণক্ষমতা সব সারিতে কপি করুন' : 'Copy 1st row capacity to all'}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--bg-primary)] border border-[var(--border)] hover:border-[var(--brand)] text-[var(--text-secondary)] hover:text-[var(--brand)] text-[0.6875rem] font-medium transition-colors cursor-pointer"
                    >
                      <Copy size={11} />
                      {isBn ? 'ধারণক্ষমতা কপি ⬇' : 'Copy Capacity ⬇'}
                    </button>
                    <button
                      type="button"
                      onClick={() => applyColumnToAll('building', 0)}
                      title={isBn ? '১ম সারির বিল্ডিং সব সারিতে কপি করুন' : 'Copy 1st row building to all'}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--bg-primary)] border border-[var(--border)] hover:border-[var(--brand)] text-[var(--text-secondary)] hover:text-[var(--brand)] text-[0.6875rem] font-medium transition-colors cursor-pointer"
                    >
                      <Copy size={11} />
                      {isBn ? 'বিল্ডিং কপি ⬇' : 'Copy Building ⬇'}
                    </button>
                    <button
                      type="button"
                      onClick={() => applyColumnToAll('floor', 0)}
                      title={isBn ? '১ম সারির ফ্লোর সব সারিতে কপি করুন' : 'Copy 1st row floor to all'}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--bg-primary)] border border-[var(--border)] hover:border-[var(--brand)] text-[var(--text-secondary)] hover:text-[var(--brand)] text-[0.6875rem] font-medium transition-colors cursor-pointer"
                    >
                      <Copy size={11} />
                      {isBn ? 'ফ্লোর কপি ⬇' : 'Copy Floor ⬇'}
                    </button>
                    <button
                      type="button"
                      onClick={applyAllSettingsDown}
                      title={isBn ? '১ম সারির ধারণক্ষমতা, বিল্ডিং ও ফ্লোর সব সারিতে কপি করুন' : 'Copy all 1st row settings to all'}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[var(--brand)]/10 border border-[var(--brand)]/30 text-[var(--brand)] hover:bg-[var(--brand)] hover:text-white text-[0.6875rem] font-semibold transition-all cursor-pointer shadow-xs"
                    >
                      <ChevronsDown size={13} />
                      {isBn ? '১ম সারির সব তথ্য প্রয়োগ ⬇' : 'Apply All Settings ⬇'}
                    </button>
                  </div>
                </div>
              )}

              {/* Table Body with Single Row Input Fields */}
              <div className="flex-1 overflow-y-auto px-6 py-4">
                {formError && (
                  <div className="mb-3 p-2.5 rounded-xl bg-[var(--red)]/10 border border-[var(--red)]/20 text-[var(--red)] text-[0.75rem] font-medium">
                    {formError}
                  </div>
                )}

                <div className="overflow-x-auto border border-[var(--border)] rounded-xl bg-[var(--bg-primary)]">
                  <table className="w-full text-left border-collapse text-[0.75rem]">
                    <thead>
                      <tr className="border-b border-[var(--border)] bg-[var(--bg-secondary)]/70 text-[var(--text-muted)] text-[0.6875rem] font-semibold uppercase tracking-wider">
                        <th className="py-2.5 px-3 w-10 text-center">#</th>
                        <th className="py-2.5 px-3 min-w-[9.5rem]">
                          <span className="text-[var(--text-primary)]">{isBn ? 'কক্ষ নম্বর' : 'Room No'}</span>
                          <span className="text-[var(--red)] ml-0.5">*</span>
                        </th>
                        <th className="py-2.5 px-3 min-w-[10rem]">
                          <span>{isBn ? 'কক্ষের নাম' : 'Room Name'}</span>
                        </th>
                        <th className="py-2.5 px-3 min-w-[8.5rem]">
                          <div className="flex items-center justify-between gap-1.5">
                            <span>{isBn ? 'ধারণক্ষমতা' : 'Capacity'}</span>
                            {!editRoom && roomRows.length > 1 && (
                              <button
                                type="button"
                                onClick={() => applyColumnToAll('capacity', 0)}
                                title={isBn ? '১ম সারির ধারণক্ষমতা সব সারিতে প্রয়োগ করুন' : 'Apply 1st row capacity to all'}
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[0.625rem] font-semibold bg-[var(--brand)]/10 text-[var(--brand)] hover:bg-[var(--brand)] hover:text-white transition-colors cursor-pointer border border-[var(--brand)]/20"
                              >
                                <Copy size={10} />
                                <span>{isBn ? 'কপি ⬇' : 'Copy ⬇'}</span>
                              </button>
                            )}
                          </div>
                        </th>
                        <th className="py-2.5 px-3 min-w-[9rem]">
                          <div className="flex items-center justify-between gap-1.5">
                            <span>{isBn ? 'বিল্ডিং' : 'Building'}</span>
                            {!editRoom && roomRows.length > 1 && (
                              <button
                                type="button"
                                onClick={() => applyColumnToAll('building', 0)}
                                title={isBn ? '১ম সারির বিল্ডিং সব সারিতে প্রয়োগ করুন' : 'Apply 1st row building to all'}
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[0.625rem] font-semibold bg-[var(--brand)]/10 text-[var(--brand)] hover:bg-[var(--brand)] hover:text-white transition-colors cursor-pointer border border-[var(--brand)]/20"
                              >
                                <Copy size={10} />
                                <span>{isBn ? 'কপি ⬇' : 'Copy ⬇'}</span>
                              </button>
                            )}
                          </div>
                        </th>
                        <th className="py-2.5 px-3 min-w-[8.5rem]">
                          <div className="flex items-center justify-between gap-1.5">
                            <span>{isBn ? 'ফ্লোর' : 'Floor'}</span>
                            {!editRoom && roomRows.length > 1 && (
                              <button
                                type="button"
                                onClick={() => applyColumnToAll('floor', 0)}
                                title={isBn ? '১ম সারির ফ্লোর সব সারিতে প্রয়োগ করুন' : 'Apply 1st row floor to all'}
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[0.625rem] font-semibold bg-[var(--brand)]/10 text-[var(--brand)] hover:bg-[var(--brand)] hover:text-white transition-colors cursor-pointer border border-[var(--brand)]/20"
                              >
                                <Copy size={10} />
                                <span>{isBn ? 'কপি ⬇' : 'Copy ⬇'}</span>
                              </button>
                            )}
                          </div>
                        </th>
                        {!editRoom && <th className="py-2.5 px-3 w-20 text-center">{isBn ? 'অ্যাকশন' : 'Action'}</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      {roomRows.map((row, idx) => (
                        <tr key={row.id} className="hover:bg-[var(--bg-secondary)]/30 transition-colors">
                          <td className="py-2 px-3 text-center text-[var(--text-muted)] font-mono text-[0.6875rem]">
                            {idx + 1}
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={row.roomNo}
                              onChange={(e) => handleUpdateRow(idx, 'roomNo', e.target.value)}
                              placeholder="e.g. R-101"
                              className={`${inputCls} w-full font-semibold`}
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={row.roomName}
                              onChange={(e) => handleUpdateRow(idx, 'roomName', e.target.value)}
                              placeholder="e.g. Room 101"
                              className={`${inputCls} w-full`}
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="number"
                              min="1"
                              max="1000"
                              value={row.capacity}
                              onChange={(e) => handleUpdateRow(idx, 'capacity', e.target.value)}
                              placeholder="40"
                              className={`${inputCls} w-full text-center font-mono`}
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={row.building}
                              onChange={(e) => handleUpdateRow(idx, 'building', e.target.value)}
                              placeholder="e.g. Main"
                              className={`${inputCls} w-full`}
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={row.floor}
                              onChange={(e) => handleUpdateRow(idx, 'floor', e.target.value)}
                              placeholder="e.g. 1st"
                              className={`${inputCls} w-full`}
                            />
                          </td>
                          {!editRoom && (
                            <td className="py-2 px-3 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleDuplicateRow(idx)}
                                  title={isBn ? 'সারি অনুলিপি করুন' : 'Duplicate Row'}
                                  className="p-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:text-[var(--brand)] hover:border-[var(--brand)] transition-colors cursor-pointer"
                                >
                                  <Copy size={12} />
                                </button>
                                <button
                                  type="button"
                                  disabled={roomRows.length <= 1}
                                  onClick={() => handleRemoveRow(idx)}
                                  title={isBn ? 'সারি মুছুন' : 'Remove Row'}
                                  className={`p-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] transition-colors ${
                                    roomRows.length <= 1
                                      ? 'opacity-30 cursor-not-allowed text-[var(--text-muted)]'
                                      : 'text-[var(--text-muted)] hover:text-[var(--red)] hover:border-[var(--red)] cursor-pointer'
                                  }`}
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Add Row Button under table */}
                {!editRoom && (
                  <div className="mt-3 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={handleAddRow}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-dashed border-[var(--brand)] text-[var(--brand)] bg-[var(--brand)]/5 hover:bg-[var(--brand)]/10 text-[0.75rem] font-medium cursor-pointer transition-colors"
                    >
                      <Plus size={14} />
                      {isBn ? '+ আরেকটি কক্ষের সারি যোগ করুন' : '+ Add Another Room Row'}
                    </button>

                    <span className="text-[0.6875rem] text-[var(--text-muted)]">
                      {isBn ? `মোট ${roomRows.length}টি সারি` : `Total: ${roomRows.length} row(s)`}
                    </span>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-2.5 px-6 py-3.5 border-t border-[var(--border)] bg-[var(--bg-secondary)]/50">
                <button
                  type="button"
                  onClick={() => {
                    setShowRoomForm(false)
                    setEditRoom(null)
                  }}
                  className="px-4 py-2 rounded-xl text-[0.75rem] font-medium text-[var(--text-secondary)] hover:bg-[var(--border)] transition-colors cursor-pointer border-none bg-transparent"
                >
                  {isBn ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={handleSaveRooms}
                  className={`${btnPrimary} text-[0.75rem] px-5 py-2 rounded-xl font-semibold shadow-xs`}
                >
                  {editRoom
                    ? isBn
                      ? 'আপডেট করুন'
                      : 'Update Room'
                    : isBn
                    ? `সংরক্ষণ করুন (${roomRows.filter((r) => r.roomNo.trim()).length || roomRows.length})`
                    : `Save Rooms (${roomRows.filter((r) => r.roomNo.trim()).length || roomRows.length})`}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  )
})
