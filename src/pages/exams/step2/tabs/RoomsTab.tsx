import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import { Plus, Edit2, Trash2, X } from 'lucide-react'
import type { ExamRoom } from '@/store/examStore'
import { btnPrimary, inputCls } from '@/lib/styles'

interface Props {
  isBn: boolean
  rooms: ExamRoom[]
  roomCapacityMap: Map<string, { date: string; count: number }[]>
  addRoom: (r: any) => void
  updateRoom: (id: string, r: any) => void
  deleteRoom: (id: string) => void
}

export default React.memo(function RoomsTab({ isBn, rooms, roomCapacityMap, addRoom, updateRoom, deleteRoom }: Props) {
  const [showRoomForm, setShowRoomForm] = useState(false)
  const [editRoom, setEditRoom] = useState<ExamRoom | null>(null)
  const [roomForm, setRoomForm] = useState({ roomNo: '', roomName: '', capacity: '40', building: 'Main', floor: '1st' })

  const handleSaveRoom = () => {
    if (!roomForm.roomNo || !roomForm.roomName) return
    if (editRoom) {
      updateRoom(editRoom.id, { ...roomForm, capacity: Number(roomForm.capacity) || 40, isActive: true })
    } else {
      addRoom({ ...roomForm, capacity: Number(roomForm.capacity) || 40, isActive: true })
    }
    setShowRoomForm(false)
    setEditRoom(null)
    setRoomForm({ roomNo: '', roomName: '', capacity: '40', building: 'Main', floor: '1st' })
  }

  return (
    <>
      <div className="flex justify-between items-center mb-3">
        <span className="text-[0.75rem] text-[var(--text-secondary)]">
          {rooms.length} {isBn ? 'টি কক্ষ' : 'rooms'}
        </span>
        <button
          onClick={() => {
            setShowRoomForm(true)
            setEditRoom(null)
            setRoomForm({ roomNo: '', roomName: '', capacity: '40', building: 'Main', floor: '1st' })
          }}
          className={btnPrimary}
        >
          <Plus size={14} />
          {isBn ? 'নতুন কক্ষ' : 'New Room'}
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {rooms.map((room) => {
          const dailyEntries = roomCapacityMap.get(room.roomNo) || []
          return (
            <div key={room.id} className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-[0.875rem] p-[0.875rem] transition-all hover:shadow-sm">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="text-[0.8125rem] font-semibold text-[var(--text-primary)]">{room.roomNo}</div>
                  <div className="text-[0.6875rem] text-[var(--text-muted)]">
                    {room.roomName} · {room.building} · {room.floor}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => {
                      setEditRoom(room)
                      setRoomForm({ roomNo: room.roomNo, roomName: room.roomName, capacity: String(room.capacity), building: room.building, floor: room.floor })
                      setShowRoomForm(true)
                    }}
                    className="w-6 h-6 rounded border border-[var(--border)] bg-[var(--bg-secondary)] flex items-center justify-center cursor-pointer text-[var(--text-muted)] hover:text-[var(--brand)]"
                  >
                    <Edit2 size={11} />
                  </button>
                  <button
                    onClick={() => { if (confirm(isBn ? 'মুছে ফেলবেন?' : 'Delete?')) deleteRoom(room.id) }}
                    className="w-6 h-6 rounded border border-[var(--border)] bg-[var(--bg-secondary)] flex items-center justify-center cursor-pointer text-[var(--text-muted)] hover:text-[var(--red)]"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                {dailyEntries.length > 0 ? (
                  dailyEntries.map((entry) => {
                    const dayUtil = room.capacity > 0 ? Math.round((entry.count / room.capacity) * 100) : 0
                    const label = (() => {
                      try { const d = new Date(entry.date); return `${d.getDate()}/${d.getMonth() + 1}` } catch { return entry.date }
                    })()
                    return (
                      <div key={entry.date} className="flex items-center gap-2">
                        <span className="text-[0.5625rem] text-[var(--text-muted)] w-7 shrink-0">{label}</span>
                        <div className="flex-1 h-[0.25rem] bg-[var(--border)] rounded-[0.125rem]">
                          <div className="h-full rounded-[0.125rem] transition-all" style={{ width: dayUtil > 0 ? `${Math.max(dayUtil, 3)}%` : '0%', background: dayUtil > 90 ? 'var(--red)' : dayUtil > 70 ? 'var(--amber)' : 'var(--green)' }} />
                        </div>
                        <span className="text-[0.5625rem] text-[var(--text-muted)] w-14 text-right shrink-0">{entry.count}/{room.capacity}</span>
                      </div>
                    )
                  })
                ) : (
                  <span className="text-[0.5625rem] text-[var(--text-muted)]">{isBn ? 'কোনো পরীক্ষা নির্ধারিত নেই' : 'No exams scheduled'}</span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {showRoomForm && createPortal(
        <div className="modal-overlay">
          <div className="modal-box modal-content" style={{ maxWidth: '23.75rem' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[0.875rem] font-semibold text-[var(--text-primary)]">
                {editRoom ? (isBn ? 'কক্ষ এডিট' : 'Edit Room') : isBn ? 'নতুন কক্ষ' : 'New Room'}
              </h3>
              <button onClick={() => { setShowRoomForm(false); setEditRoom(null) }} className="w-7 h-7 rounded-md flex items-center justify-center cursor-pointer text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <X size={16} />
              </button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'কক্ষ নম্বর' : 'Room No'}</label>
                  <input value={roomForm.roomNo} onChange={(e) => setRoomForm((p) => ({ ...p, roomNo: e.target.value }))} className={`${inputCls} w-full`} placeholder="R-101" />
                </div>
                <div>
                  <label className="text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'কক্ষের নাম' : 'Room Name'}</label>
                  <input value={roomForm.roomName} onChange={(e) => setRoomForm((p) => ({ ...p, roomName: e.target.value }))} className={`${inputCls} w-full`} placeholder="Room 101" />
                </div>
              </div>
              <div>
                <label className="text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'ধারণক্ষমতা' : 'Capacity'}</label>
                <input type="number" value={roomForm.capacity} onChange={(e) => setRoomForm((p) => ({ ...p, capacity: e.target.value }))} className={`${inputCls} w-full`} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'বিল্ডিং' : 'Building'}</label>
                  <input value={roomForm.building} onChange={(e) => setRoomForm((p) => ({ ...p, building: e.target.value }))} className={`${inputCls} w-full`} />
                </div>
                <div>
                  <label className="text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'ফ্লোর' : 'Floor'}</label>
                  <input value={roomForm.floor} onChange={(e) => setRoomForm((p) => ({ ...p, floor: e.target.value }))} className={`${inputCls} w-full`} />
                </div>
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-4">
              <button onClick={() => { setShowRoomForm(false); setEditRoom(null) }} className="px-3.5 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-[0.75rem] cursor-pointer">
                {isBn ? 'বাতিল' : 'Cancel'}
              </button>
              <button onClick={handleSaveRoom} className={`${btnPrimary} text-[0.75rem]`}>{isBn ? 'সংরক্ষণ' : 'Save'}</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
})
