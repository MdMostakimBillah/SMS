import { useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from '@iconify/react'
import * as XLSX from 'xlsx'
import { useAppStore } from '@/store/appStore'
import { useTeacherStore } from '@/store/teacherStore'
import { useAdmissionStore } from '@/store/admissionStore'
import type { AttendanceStatus, DayAttendance } from '@/store/teacherStore'

function today() { return new Date().toISOString().split('T')[0] }
function firstOfMonth() { const d = new Date(); d.setDate(1); return d.toISOString().split('T')[0] }
function toBnNum(n: number): string { const bn = ['০','১','২','৩','৪','৫','৬','৭','৮','৯']; return String(n).replace(/\d/g, d => bn[+d]) }
function getDaysBetween(from: string, to: string): string[] {
  const days: string[] = []; const a = new Date(from), b = new Date(to)
  for (let d = new Date(a); d <= b; d.setDate(d.getDate() + 1)) days.push(d.toISOString().split('T')[0])
  return days
}
function shortDate(ds: string) { return ds.slice(5) }
function dayName(ds: string) {
  const d = new Date(ds).toLocaleDateString('en', { weekday: 'short' })
  return d === 'Fri' ? 'সাপ্তাহিক ছুটি' : d
}

type Tab = 'today' | 'range' | 'device' | 'employee' | 'student'
type StatusFilter = 'all' | 'present' | 'absent' | 'on-leave'
const CLASSES = ['1','2','3','4','5','6','7','8','9','10']
const SECTIONS = ['A','B','C','D','E']

const sampleDeviceLogs = [
  { id: 1, teacherId: 'TCH-2026-001', name: 'Dr. Rafiqul Islam', date: today(), inTime: '07:28', outTime: '14:32', status: 'present' as const, device: 'ZKTeco-U160' },
  { id: 2, teacherId: 'TCH-2026-002', name: 'Prof. Salma Khatun', date: today(), inTime: '07:55', outTime: '15:05', status: 'present' as const, device: 'ZKTeco-U160' },
  { id: 3, teacherId: 'TCH-2026-003', name: 'Md. Habibur Rahman', date: today(), inTime: '07:42', outTime: '14:48', status: 'present' as const, device: 'ZKTeco-U160' },
  { id: 4, teacherId: 'TCH-2026-004', name: 'Farhana Rahman', date: today(), inTime: '08:01', outTime: '—', status: 'present' as const, device: 'ZKTeco-U160' },
  { id: 5, teacherId: 'TCH-2026-005', name: 'Tanvir Ahmed', date: today(), inTime: '—', outTime: '—', status: 'absent' as const, device: '—' },
]

function genSinglePDF(name: string, id: string, rows: {date:string;status:string;punches:{time:string;type:string}[]}[], isBn: boolean): string {
  const trs = rows.map((r, i) => {
    const c = r.status === 'present' ? '#10b981' : r.status === 'absent' ? '#ef4444' : '#f59e0b'
    const l = r.status === 'present' ? (isBn?'উপস্থিত':'Present') : r.status === 'absent' ? (isBn?'অনুপস্থিত':'Absent') : (isBn?'ছুটিতে':'Leave')
    const punchStr = r.punches.map(p => `${p.time}(${p.type==='in'?'I':'O'})`).join(', ') || '—'
    return `<tr class="${i%2===1?'alt':''}"><td>${i+1}</td><td>${r.date}</td><td>${punchStr}</td><td>${r.punches.length}</td><td><b style="color:${c}">${l}</b></td></tr>`
  }).join('')
  const present = rows.filter(r=>r.status==='present').length
  const absent = rows.filter(r=>r.status==='absent').length
  const leave = rows.filter(r=>r.status==='on-leave').length
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${name}</title>
<style>@page{size:A4 portrait;margin:10mm}*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;font-size:10px;color:#1a1a1a}.hdr{display:flex;align-items:center;gap:12px;padding-bottom:7px;border-bottom:2px solid #6366f1;margin-bottom:10px}.logo{width:32px;height:32px;background:#6366f1;border-radius:7px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:14px;font-weight:700}.ttl{text-align:center;font-size:13px;font-weight:700;margin-bottom:4px}.sub{text-align:center;font-size:10px;color:#666;margin-bottom:10px}table{width:100%;border-collapse:collapse}th{background:#6366f1;color:#fff;padding:5px;text-align:left;font-size:9px;font-weight:700;text-transform:uppercase;border:0.5px solid #5356d4}td{padding:4px 5px;border:0.5px solid #e5e7eb}tr.alt td{background:#f9fafb}.ftr{margin-top:12px;padding-top:7px;border-top:1px solid #ddd;display:flex;justify-content:space-between;font-size:8px;color:#888}@media print{body{print-color-adjust:exact;-webkit-print-color-adjust:exact}}</style></head><body>
<div class="hdr"><div class="logo">ET</div><div><div style="font-size:13px;font-weight:700;color:#6366f1">EduTech — Sunrise Academy</div><div style="font-size:8px;color:#888">Individual Attendance Report</div></div></div>
<div class="ttl">${name} (${id})</div>
<div class="sub">${isBn?'মোট':'Total'}: ${rows.length} ${isBn?'দিন':'days'} · ✅ ${present} · ❌ ${absent} · ⏳ ${leave}</div>
<table><thead><tr><th>#</th><th>${isBn?'তারিখ':'Date'}</th><th>${isBn?'পাঞ্চ':'Punches'}</th><th>${isBn?'বার':'Count'}</th><th>${isBn?'অবস্থা':'Status'}</th></tr></thead><tbody>${trs}</tbody></table>
<div class="ftr"><span>EduTech School Management System</span><div>${isBn?'মুদ্রণ:':'Printed:'} ${new Date().toLocaleDateString()}</div></div></body></html>`
}

export default function AttendancePage() {
  const navigate = useNavigate()
  const { language } = useAppStore()
  const { teachers, departments, attendance, markAttendance, markAllPresent } = useTeacherStore()
  const { students } = useAdmissionStore()
  const isBn = language === 'bn'

  const [activeTab, setActiveTab] = useState<Tab>('today')
  const [date, setDate] = useState(today())
  const [dateFrom, setDateFrom] = useState(firstOfMonth())
  const [dateTo, setDateTo] = useState(today())
  const [showMarkAll, setShowMarkAll] = useState(false)
  const [fClass, setFClass] = useState('')
  const [fSection, setFSection] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [viewPerson, setViewPerson] = useState<{id:string;name:string;type:'teacher'|'student'}|null>(null)

  const dayAtt = attendance[date] || {}
  const activeTeachers = useMemo(() => teachers.filter(t => t.status === 'active'), [teachers])
  const approvedStudents = useMemo(() => { let l = students.filter(s => s.status === 'approved'); if (fClass) l = l.filter(s => s.class === fClass); if (fSection) l = l.filter(s => s.section === fSection); return l }, [students, fClass, fSection])
  const rangeDays = useMemo(() => getDaysBetween(dateFrom, dateTo), [dateFrom, dateTo])

  const stats = useMemo(() => {
    let present = 0, absent = 0, onLeave = 0
    activeTeachers.forEach(t => { const s = dayAtt[t.id]?.status; if (s === 'present') present++; else if (s === 'absent') absent++; else if (s === 'on-leave') onLeave++ })
    return { present, absent, onLeave }
  }, [activeTeachers, dayAtt])

  const getDeptName = (id: string) => { const d = departments.find(x => x.id === id); return d ? (isBn ? d.nameBn : d.name) : '—' }
  const handleMarkAll = () => { markAllPresent(date); setShowMarkAll(false) }

  const getStatus = (dayData?: DayAttendance): AttendanceStatus => dayData?.status || 'absent'

  const getPersonMonthData = useCallback((personId: string) => {
    return rangeDays.map(ds => {
      const da = attendance[ds]?.[personId]
      return { date: ds, status: da?.status || 'absent', punches: da?.punches || [] }
    })
  }, [rangeDays, attendance])

  const downloadSinglePDF = useCallback((personId: string, personName: string) => {
    const data = getPersonMonthData(personId)
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(genSinglePDF(personName, personId, data, isBn))
    win.document.close()
    setTimeout(() => win.print(), 800)
  }, [getPersonMonthData, isBn])

  const tabs: { key: Tab; labelBn: string; labelEn: string; icon: string; color: string }[] = [
    { key: 'today', labelBn: 'আজকের উপস্থিতি', labelEn: "Today's", icon: 'lucide:calendar-check', color: 'var(--green)' },
    { key: 'range', labelBn: 'তারিখ পরিসীমা', labelEn: 'Date Range', icon: 'lucide:calendar-range', color: 'var(--brand)' },
    { key: 'device', labelBn: 'ডিভাইস', labelEn: 'Device', icon: 'lucide:fingerprint', color: '#7C3AED' },
    { key: 'employee', labelBn: 'কর্মচারী', labelEn: 'Employee', icon: 'lucide:briefcase', color: 'var(--amber)' },
    { key: 'student', labelBn: 'সব দেখুন', labelEn: 'View All', icon: 'lucide:eye', color: 'var(--teal)' },
  ]

  const statusFilters: { key: StatusFilter; labelBn: string; labelEn: string; color: string }[] = [
    { key: 'all', labelBn: 'সব', labelEn: 'All', color: 'var(--brand)' },
    { key: 'present', labelBn: 'উপস্থিত', labelEn: 'Present', color: 'var(--green)' },
    { key: 'absent', labelBn: 'অনুপস্থিত', labelEn: 'Absent', color: 'var(--red)' },
    { key: 'on-leave', labelBn: 'ছুটিতে', labelEn: 'Leave', color: 'var(--amber)' },
  ]

  const sel: React.CSSProperties = { padding:'7px 9px', borderRadius:'8px', border:'1px solid var(--border)', background:'var(--bg-secondary)', color:'var(--text-secondary)', fontSize:'12px', fontFamily:'inherit', cursor:'pointer', outline:'none' }

  const statusBadge = (s: AttendanceStatus) => {
    const m = { present:{bg:'var(--green-light)',c:'var(--green)',l:isBn?'P':'P'}, absent:{bg:'var(--red-light)',c:'var(--red)',l:isBn?'A':'A'}, 'on-leave':{bg:'var(--amber-light)',c:'var(--amber)',l:isBn?'L':'L'} }
    const x = m[s]
    return <span style={{ display:'inline-block', width:'20px', height:'20px', borderRadius:'4px', background:x.bg, color:x.c, fontSize:'9px', fontWeight:700, textAlign:'center', lineHeight:'20px' }}>{x.l}</span>
  }

  return (
    <div>
      {/* Mark All Confirm */}
      {showMarkAll && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:700, display:'flex', alignItems:'center', justifyContent:'center', padding:'16px' }}>
          <div style={{ background:'var(--bg-primary)', borderRadius:'14px', maxWidth:'380px', width:'100%', padding:'20px', border:'1px solid var(--border)' }}>
            <h3 style={{ fontSize:'15px', fontWeight:600, color:'var(--text-primary)', marginBottom:'12px' }}>{isBn?'সবাইকে উপস্থিত করুন?':'Mark All Present?'}</h3>
            <p style={{ fontSize:'13px', color:'var(--text-secondary)', marginBottom:'16px' }}>{isBn?`${activeTeachers.length} জন শিক্ষককে উপস্থিত হিসেবে চিহ্নিত করা হবে।`:`${activeTeachers.length} teachers will be marked present.`}</p>
            <div style={{ display:'flex', gap:'8px', justifyContent:'flex-end' }}>
              <button onClick={() => setShowMarkAll(false)} style={{ padding:'8px 14px', borderRadius:'8px', background:'var(--bg-secondary)', border:'1px solid var(--border)', color:'var(--text-secondary)', fontSize:'13px', cursor:'pointer', fontFamily:'inherit' }}>{isBn?'বাতিল':'Cancel'}</button>
              <button onClick={handleMarkAll} style={{ padding:'8px 14px', borderRadius:'8px', background:'var(--green)', border:'none', color:'#fff', fontSize:'13px', fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>{isBn?'নিশ্চিত করুন':'Confirm'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Single Person Detail Modal */}
      {viewPerson && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:600, display:'flex', alignItems:'center', justifyContent:'center', padding:'16px' }}>
          <div style={{ background:'var(--bg-primary)', borderRadius:'16px', maxWidth:'600px', width:'100%', maxHeight:'85vh', overflow:'hidden', display:'flex', flexDirection:'column', border:'1px solid var(--border)' }}>
            <div style={{ padding:'14px 18px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between', background:'var(--brand-light)' }}>
              <div>
                <div style={{ fontSize:'15px', fontWeight:600, color:'var(--text-primary)' }}>{viewPerson.name}</div>
                <div style={{ fontSize:'11px', color:'var(--brand)', fontFamily:'monospace' }}>{viewPerson.id} · {dateFrom} → {dateTo}</div>
              </div>
              <button onClick={() => setViewPerson(null)} style={{ width:'28px', height:'28px', borderRadius:'7px', background:'var(--bg-secondary)', border:'1px solid var(--border)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Icon icon="lucide:x" width={14} style={{ color:'var(--text-secondary)' }} />
              </button>
            </div>
            <div style={{ flex:1, overflowY:'auto', padding:'14px 18px' }}>
              {(() => {
                const data = getPersonMonthData(viewPerson.id)
                const present = data.filter(d => d.status === 'present').length
                const absent = data.filter(d => d.status === 'absent').length
                const leave = data.filter(d => d.status === 'on-leave').length
                return (
                  <>
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'8px', marginBottom:'14px' }}>
                      {[
                        { l: isBn?'মোট':'Total', v: data.length, c:'var(--brand)', bg:'var(--brand-light)' },
                        { l: isBn?'উপস্থিত':'Present', v: present, c:'var(--green)', bg:'var(--green-light)' },
                        { l: isBn?'অনুপস্থিত':'Absent', v: absent, c:'var(--red)', bg:'var(--red-light)' },
                        { l: isBn?'ছুটিতে':'Leave', v: leave, c:'var(--amber)', bg:'var(--amber-light)' },
                      ].map(s => (
                        <div key={s.l} style={{ padding:'10px', borderRadius:'10px', background:s.bg, textAlign:'center' }}>
                          <div style={{ fontSize:'20px', fontWeight:700, color:s.c }}>{s.v}</div>
                          <div style={{ fontSize:'10px', color:s.c }}>{s.l}</div>
                        </div>
                      ))}
                    </div>
                    <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'11px' }}>
                      <thead>
                        <tr style={{ background:'var(--bg-secondary)' }}>
                          <th style={{ padding:'6px 8px', textAlign:'left', fontSize:'10px', fontWeight:600, color:'var(--text-muted)', borderBottom:'1px solid var(--border)' }}>#</th>
                          <th style={{ padding:'6px 8px', textAlign:'left', fontSize:'10px', fontWeight:600, color:'var(--text-muted)', borderBottom:'1px solid var(--border)' }}>{isBn?'তারিখ':'Date'}</th>
                          <th style={{ padding:'6px 8px', textAlign:'left', fontSize:'10px', fontWeight:600, color:'var(--text-muted)', borderBottom:'1px solid var(--border)' }}>{isBn?'পাঞ্চ':'Punches'}</th>
                          <th style={{ padding:'6px 8px', textAlign:'center', fontSize:'10px', fontWeight:600, color:'var(--text-muted)', borderBottom:'1px solid var(--border)' }}>{isBn?'বার':'Count'}</th>
                          <th style={{ padding:'6px 8px', textAlign:'left', fontSize:'10px', fontWeight:600, color:'var(--text-muted)', borderBottom:'1px solid var(--border)' }}>{isBn?'অবস্থা':'Status'}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.map((d, i) => (
                          <tr key={d.date} style={{ borderBottom:'0.5px solid var(--border)' }}
                            onMouseEnter={e => e.currentTarget.style.background='var(--bg-secondary)'}
                            onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                            <td style={{ padding:'5px 8px', color:'var(--text-muted)' }}>{i+1}</td>
                            <td style={{ padding:'5px 8px' }}>
                              <div style={{ fontSize:'11px', fontWeight:500, color:'var(--text-primary)' }}>{d.date}</div>
                              <div style={{ fontSize:'9px', color:'var(--text-muted)' }}>{dayName(d.date)}</div>
                            </td>
                            <td style={{ padding:'5px 8px' }}>
                              {d.punches.length > 0 ? (
                                <div style={{ display:'flex', flexWrap:'wrap', gap:'3px' }}>
                                  {d.punches.map((p, pi) => (
                                    <span key={pi} style={{ fontSize:'9px', padding:'1px 5px', borderRadius:'4px', fontFamily:'monospace',
                                      background: p.type === 'in' ? 'var(--green-light)' : 'var(--red-light)',
                                      color: p.type === 'in' ? 'var(--green)' : 'var(--red)' }}>
                                      {p.time} {p.type === 'in' ? '→' : '←'}
                                    </span>
                                  ))}
                                </div>
                              ) : <span style={{ fontSize:'10px', color:'var(--text-muted)' }}>—</span>}
                            </td>
                            <td style={{ padding:'5px 8px', textAlign:'center' }}>
                              <span style={{ fontSize:'11px', fontWeight:600, color:'var(--brand)' }}>{d.punches.length}</span>
                            </td>
                            <td style={{ padding:'5px 8px' }}>
                              <span style={{ fontSize:'10px', fontWeight:600, padding:'2px 7px', borderRadius:'10px',
                                background: d.status === 'present' ? 'var(--green-light)' : d.status === 'absent' ? 'var(--red-light)' : 'var(--amber-light)',
                                color: d.status === 'present' ? 'var(--green)' : d.status === 'absent' ? 'var(--red)' : 'var(--amber)' }}>
                                {d.status === 'present' ? (isBn?'উপস্থিত':'Present') : d.status === 'absent' ? (isBn?'অনুপস্থিত':'Absent') : (isBn?'ছুটিতে':'Leave')}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </>
                )
              })()}
            </div>
            <div style={{ padding:'12px 18px', borderTop:'1px solid var(--border)', display:'flex', gap:'8px', justifyContent:'flex-end' }}>
              <button onClick={() => setViewPerson(null)} style={{ padding:'8px 14px', borderRadius:'8px', background:'var(--bg-secondary)', border:'1px solid var(--border)', color:'var(--text-secondary)', fontSize:'12px', cursor:'pointer', fontFamily:'inherit' }}>{isBn?'বন্ধ':'Close'}</button>
              <button onClick={() => downloadSinglePDF(viewPerson.id, viewPerson.name)} style={{ display:'flex', alignItems:'center', gap:'5px', padding:'8px 14px', borderRadius:'8px', background:'var(--red)', border:'none', color:'#fff', fontSize:'12px', fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                <Icon icon="lucide:file-text" width={13} />PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'16px', flexWrap:'wrap' }}>
        <button onClick={() => navigate('/teachers')} style={{ display:'flex', alignItems:'center', gap:'5px', padding:'7px 12px', borderRadius:'9px', background:'var(--bg-primary)', border:'1px solid var(--border)', cursor:'pointer', fontSize:'13px', color:'var(--text-secondary)', fontFamily:'inherit', flexShrink:0 }}>
          <Icon icon="lucide:arrow-left" width={14} />{isBn?'ফিরে যান':'Back'}
        </button>
        <div style={{ flex:1 }}>
          <h1 style={{ fontSize:'22px', fontWeight:600, color:'var(--text-primary)' }}>{isBn?'উপস্থিতি ব্যবস্থাপনা':'Attendance Management'}</h1>
          <p style={{ fontSize:'13px', color:'var(--text-secondary)', marginTop:'3px' }}>{isBn?'শিক্ষক, কর্মচারী এবং ছাত্রদের উপস্থিতি ট্র্যাক করুন':'Track teacher, employee and student attendance'}</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:'6px', marginBottom:'14px', flexWrap:'wrap' }}>
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            style={{ display:'flex', alignItems:'center', gap:'6px', padding:'8px 14px', borderRadius:'10px', border:`1.5px solid ${activeTab === tab.key ? tab.color : 'var(--border)'}`, background: activeTab === tab.key ? `${tab.color}15` : 'var(--bg-primary)', color: activeTab === tab.key ? tab.color : 'var(--text-secondary)', fontSize:'12px', fontWeight: activeTab === tab.key ? 600 : 400, cursor:'pointer', fontFamily:'inherit', transition:'all 0.15s' }}>
            <Icon icon={tab.icon} width={15} />{isBn ? tab.labelBn : tab.labelEn}
          </button>
        ))}
      </div>

      {/* Status Filter + Date Range */}
      <div style={{ background:'var(--bg-primary)', border:'1px solid var(--border)', borderRadius:'12px', padding:'10px 14px', marginBottom:'14px', display:'flex', alignItems:'center', gap:'8px', flexWrap:'wrap' }}>
        <span style={{ fontSize:'11px', fontWeight:500, color:'var(--text-muted)' }}>{isBn?'অবস্থা:':'Status:'}</span>
        {statusFilters.map(sf => (
          <button key={sf.key} onClick={() => setStatusFilter(sf.key)}
            style={{ padding:'4px 12px', borderRadius:'8px', fontSize:'11px', fontWeight: statusFilter === sf.key ? 600 : 400, cursor:'pointer', fontFamily:'inherit', border:`1px solid ${statusFilter === sf.key ? sf.color : 'var(--border)'}`, background: statusFilter === sf.key ? `${sf.color}18` : 'var(--bg-secondary)', color: statusFilter === sf.key ? sf.color : 'var(--text-secondary)' }}>
            {isBn ? sf.labelBn : sf.labelEn}
          </button>
        ))}
        <div style={{ flex:1 }} />
        <Icon icon="lucide:calendar-range" width={14} style={{ color:'var(--text-muted)' }} />
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ padding:'5px 8px', borderRadius:'7px', border:'1px solid var(--border)', background:'var(--bg-secondary)', color:'var(--text-primary)', fontSize:'11px', fontFamily:'inherit', outline:'none' }} />
        <span style={{ fontSize:'11px', color:'var(--text-muted)' }}>—</span>
        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ padding:'5px 8px', borderRadius:'7px', border:'1px solid var(--border)', background:'var(--bg-secondary)', color:'var(--text-primary)', fontSize:'11px', fontFamily:'inherit', outline:'none' }} />
      </div>

      {/* ==================== TAB: TODAY ==================== */}
      {activeTab === 'today' && (
        <>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'10px', marginBottom:'14px' }}>
            {[
              { labelBn:'উপস্থিত', labelEn:'Present', value:stats.present, icon:'lucide:check-circle', color:'var(--green)', bg:'var(--green-light)' },
              { labelBn:'অনুপস্থিত', labelEn:'Absent', value:stats.absent, icon:'lucide:x-circle', color:'var(--red)', bg:'var(--red-light)' },
              { labelBn:'ছুটিতে', labelEn:'Leave', value:stats.onLeave, icon:'lucide:clock', color:'var(--amber)', bg:'var(--amber-light)' },
            ].map(s => (
              <div key={s.labelEn} style={{ background:'var(--bg-primary)', border:'1px solid var(--border)', borderRadius:'12px', padding:'14px', display:'flex', alignItems:'center', gap:'12px' }}>
                <div style={{ width:'38px', height:'38px', borderRadius:'10px', background:s.bg, display:'flex', alignItems:'center', justifyContent:'center' }}><Icon icon={s.icon} width={18} style={{ color:s.c }} /></div>
                <div><div style={{ fontSize:'20px', fontWeight:700, color:'var(--text-primary)' }}>{toBnNum(s.value)}<span style={{ fontSize:'12px', fontWeight:400, color:'var(--text-muted)', marginLeft:'4px' }}>{s.value}</span></div><div style={{ fontSize:'11px', color:'var(--text-secondary)' }}>{isBn?s.labelBn:s.labelEn}</div></div>
              </div>
            ))}
          </div>

          <div style={{ background:'var(--bg-primary)', border:'1px solid var(--border)', borderRadius:'12px', padding:'12px 14px', marginBottom:'14px', display:'flex', alignItems:'center', gap:'10px', flexWrap:'wrap' }}>
            <Icon icon="lucide:calendar" width={14} style={{ color:'var(--text-muted)' }} />
            <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ padding:'6px 10px', borderRadius:'8px', border:'1px solid var(--border)', background:'var(--bg-secondary)', color:'var(--text-primary)', fontSize:'12px', fontFamily:'inherit', outline:'none' }} />
            <div style={{ flex:1 }} />
            <button onClick={() => setShowMarkAll(true)} style={{ display:'flex', alignItems:'center', gap:'5px', padding:'7px 14px', borderRadius:'8px', background:'var(--green-light)', border:'1px solid var(--green)', color:'var(--green)', fontSize:'12px', cursor:'pointer', fontFamily:'inherit', fontWeight:500 }}>
              <Icon icon="lucide:check-circle" width={13} />{isBn?'সবাইকে উপস্থিত করুন':'Mark All Present'}
            </button>
          </div>

          <div style={{ background:'var(--bg-primary)', border:'1px solid var(--border)', borderRadius:'14px', overflow:'hidden' }}>
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'12px' }}>
                <thead>
                  <tr style={{ background:'var(--bg-secondary)', borderBottom:'1px solid var(--border)' }}>
                    {[{l:'#',w:'36px'},{l:isBn?'নাম':'Name',w:'160px'},{l:isBn?'বিভাগ':'Dept',w:'100px'},{l:isBn?'পদবি':'Desig',w:'100px'},{l:isBn?'স্ট্যাটাস':'Status',w:'160px'},{l:'',w:'40px'}].map(h => (
                      <th key={h.l||'x'} style={{ padding:'8px 8px', textAlign:'left', fontSize:'10px', fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.4px', whiteSpace:'nowrap', minWidth:h.w }}>{h.l}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {activeTeachers.filter(t => statusFilter === 'all' || getStatus(dayAtt[t.id]) === statusFilter).map((t, i) => (
                    <tr key={t.id} style={{ borderBottom:'0.5px solid var(--border)' }} onMouseEnter={e => e.currentTarget.style.background='var(--bg-secondary)'} onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                      <td style={{ padding:'8px 8px', color:'var(--text-muted)', fontWeight:600, fontSize:'11px' }}>{i+1}</td>
                      <td style={{ padding:'8px 8px' }}>
                        <div style={{ fontSize:'12px', fontWeight:500, color:'var(--text-primary)' }}>{isBn?t.nameBn||t.nameEn:t.nameEn}</div>
                        <div style={{ fontSize:'10px', color:'var(--text-muted)' }}>{t.id}</div>
                      </td>
                      <td style={{ padding:'8px 8px', fontSize:'11px', color:'var(--text-secondary)' }}>{getDeptName(t.departmentId)}</td>
                      <td style={{ padding:'8px 8px', fontSize:'11px', color:'var(--text-secondary)' }}>{t.designation || '—'}</td>
                      <td style={{ padding:'8px 8px' }}>
                        <div style={{ display:'flex', gap:'3px' }}>
                          {(['present','absent','on-leave'] as AttendanceStatus[]).map(st => {
                            const active = getStatus(dayAtt[t.id]) === st
                            const colors = { present:{activeBg:'var(--green)'}, absent:{activeBg:'var(--red)'}, 'on-leave':{activeBg:'var(--amber)'} }
                            return <button key={st} onClick={() => markAttendance(date, t.id, st)} style={{ padding:'4px 8px', borderRadius:'6px', fontSize:'9px', fontWeight:500, cursor:'pointer', fontFamily:'inherit', border:'1px solid', borderColor: active ? colors[st].activeBg : 'var(--border)', background: active ? colors[st].activeBg : 'var(--bg-secondary)', color: active ? '#fff' : (st==='present'?'var(--green)':st==='absent'?'var(--red)':'var(--amber)'), transition:'all 0.15s' }}>{st==='present'?(isBn?'P':'P'):st==='absent'?(isBn?'A':'A'):(isBn?'L':'L')}</button>
                          })}
                        </div>
                      </td>
                      <td style={{ padding:'8px 8px' }}>
                        <button onClick={() => setViewPerson({id:t.id, name:isBn?t.nameBn||t.nameEn:t.nameEn, type:'teacher'})}
                          style={{ width:'26px', height:'26px', borderRadius:'6px', background:'var(--brand-light)', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--brand)' }}>
                          <Icon icon="lucide:file-text" width={12} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ==================== TAB: DATE RANGE ==================== */}
      {activeTab === 'range' && (
        <div style={{ background:'var(--bg-primary)', border:'1px solid var(--border)', borderRadius:'14px', overflow:'hidden' }}>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'11px' }}>
              <thead>
                <tr style={{ background:'var(--bg-secondary)', borderBottom:'1px solid var(--border)' }}>
                  <th style={{ padding:'8px 8px', textAlign:'left', fontSize:'10px', fontWeight:600, color:'var(--text-muted)', position:'sticky', left:0, background:'var(--bg-secondary)', zIndex:1, minWidth:'160px' }}>
                    {isBn?'নাম':'Name'}
                  </th>
                  {rangeDays.map(ds => (
                    <th key={ds} style={{ padding:'6px 4px', textAlign:'center', fontSize:'9px', fontWeight:600, color:'var(--text-muted)', minWidth:'36px' }}>
                      <div>{shortDate(ds)}</div>
                      <div style={{ fontSize:'8px', color:'var(--text-muted)', fontWeight:400 }}>{dayName(ds)}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {activeTeachers.filter(t => {
                  if (statusFilter === 'all') return true
                  return rangeDays.some(ds => getStatus(attendance[ds]?.[t.id]) === statusFilter)
                }).map((t, i) => (
                  <tr key={t.id} style={{ borderBottom:'0.5px solid var(--border)' }}
                    onMouseEnter={e => e.currentTarget.style.background='var(--bg-secondary)'}
                    onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                    <td style={{ padding:'6px 8px', position:'sticky', left:0, background:'inherit', zIndex:1 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:'6px', cursor:'pointer' }}
                        onClick={() => setViewPerson({id:t.id, name:isBn?t.nameBn||t.nameEn:t.nameEn, type:'teacher'})}>
                        <div style={{ fontSize:'11px', fontWeight:500, color:'var(--text-primary)' }}>{isBn?t.nameBn||t.nameEn:t.nameEn}</div>
                        <Icon icon="lucide:external-link" width={10} style={{ color:'var(--text-muted)' }} />
                      </div>
                      <div style={{ fontSize:'9px', color:'var(--text-muted)' }}>{t.id}</div>
                    </td>
                    {rangeDays.map(ds => {
                      const s = getStatus(attendance[ds]?.[t.id])
                      return (
                        <td key={ds} style={{ padding:'4px 2px', textAlign:'center' }}>
                          {statusBadge(s)}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ padding:'10px 14px', borderTop:'1px solid var(--border)', background:'var(--bg-secondary)', display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:'11px', color:'var(--text-muted)' }}>
            <span>📊 P=Present, A=Absent, L=Leave · {isBn?'নামে ক্লিক করুন বিস্তারিত দেখতে':'Click name for details'}</span>
            <span>{rangeDays.length} {isBn?'দিন':'days'} · {activeTeachers.length} {isBn?'শিক্ষক':'teachers'}</span>
          </div>
        </div>
      )}

      {/* ==================== TAB: DEVICE ==================== */}
      {activeTab === 'device' && (
        <>
          <div style={{ background:'var(--bg-primary)', border:'1px solid var(--border)', borderRadius:'12px', padding:'10px 14px', marginBottom:'14px', display:'flex', alignItems:'center', gap:'10px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'6px', padding:'5px 10px', borderRadius:'7px', background:'var(--green-light)', border:'1px solid var(--green)' }}>
              <div style={{ width:'7px', height:'7px', borderRadius:'50%', background:'var(--green)' }} />
              <span style={{ fontSize:'11px', fontWeight:500, color:'var(--green)' }}>{isBn?'সংযুক্ত':'Connected'}</span>
            </div>
            <span style={{ fontSize:'11px', color:'var(--text-muted)' }}>ZKTeco U160 — Main Gate</span>
          </div>
          <div style={{ background:'var(--bg-primary)', border:'1px solid var(--border)', borderRadius:'14px', overflow:'hidden' }}>
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'12px' }}>
                <thead>
                  <tr style={{ background:'var(--bg-secondary)', borderBottom:'1px solid var(--border)' }}>
                    {[{l:'#',w:'36px'},{l:isBn?'আইডি':'ID',w:'120px'},{l:isBn?'নাম':'Name',w:'160px'},{l:isBn?'তারিখ':'Date',w:'90px'},{l:isBn?'ইন':'In',w:'70px'},{l:isBn?'আউট':'Out',w:'70px'},{l:isBn?'বার':'Punches',w:'60px'},{l:isBn?'ডিভাইস':'Device',w:'100px'}].map(h => (
                      <th key={h.l} style={{ padding:'8px 8px', textAlign:'left', fontSize:'10px', fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.4px', whiteSpace:'nowrap', minWidth:h.w }}>{h.l}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sampleDeviceLogs.map((log, i) => (
                    <tr key={log.id} style={{ borderBottom:'0.5px solid var(--border)' }} onMouseEnter={e => e.currentTarget.style.background='var(--bg-secondary)'} onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                      <td style={{ padding:'8px 8px', color:'var(--text-muted)', fontWeight:600, fontSize:'11px' }}>{i+1}</td>
                      <td style={{ padding:'8px 8px' }}><span style={{ fontSize:'10px', fontFamily:'monospace', color:'var(--brand)', background:'var(--brand-light)', padding:'2px 5px', borderRadius:'4px' }}>{log.teacherId}</span></td>
                      <td style={{ padding:'8px 8px', fontSize:'12px', fontWeight:500, color:'var(--text-primary)' }}>{log.name}</td>
                      <td style={{ padding:'8px 8px', fontSize:'11px', color:'var(--text-secondary)' }}>{log.date}</td>
                      <td style={{ padding:'8px 8px', fontSize:'11px', color:'var(--green)', fontWeight:500 }}>{log.inTime}</td>
                      <td style={{ padding:'8px 8px', fontSize:'11px', color:'var(--red)', fontWeight:500 }}>{log.outTime}</td>
                      <td style={{ padding:'8px 8px', fontSize:'11px', fontWeight:600, color:'var(--brand)' }}>{log.inTime !== '—' ? 2 : 0}</td>
                      <td style={{ padding:'8px 8px', fontSize:'10px', color:'var(--text-muted)' }}>{log.device}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ==================== TAB: EMPLOYEE ==================== */}
      {activeTab === 'employee' && (
        <div style={{ background:'var(--bg-primary)', border:'1px solid var(--border)', borderRadius:'14px', padding:'60px 20px', textAlign:'center' }}>
          <Icon icon="lucide:briefcase" width={40} style={{ display:'block', margin:'0 auto 12px', opacity:0.2, color:'var(--amber)' }} />
          <h3 style={{ fontSize:'16px', fontWeight:600, color:'var(--text-primary)', marginBottom:'6px' }}>{isBn?'কর্মচারী উপস্থিতি':'Employee Attendance'}</h3>
          <p style={{ fontSize:'13px', color:'var(--text-secondary)', maxWidth:'400px', margin:'0 auto' }}>{isBn?'শীঘ্রই আসছে। ডিভাইস সংযোগ সেটিংসে যোগ করা হবে।':'Coming soon. Device connection will be added in settings.'}</p>
          <div style={{ marginTop:'16px', padding:'8px 16px', borderRadius:'8px', background:'var(--amber-light)', border:'1px solid var(--amber)', color:'var(--amber)', fontSize:'12px', display:'inline-block' }}>{isBn?'শীঘ্রই':'Soon'}</div>
        </div>
      )}

      {/* ==================== TAB: VIEW ALL ==================== */}
      {activeTab === 'student' && (
        <>
          <div style={{ background:'var(--bg-primary)', border:'1px solid var(--border)', borderRadius:'12px', padding:'10px 14px', marginBottom:'14px', display:'flex', alignItems:'center', gap:'8px', flexWrap:'wrap' }}>
            <Icon icon="lucide:filter" width={14} style={{ color:'var(--text-muted)' }} />
            <span style={{ fontSize:'11px', fontWeight:500, color:'var(--text-muted)' }}>{isBn?'শিক্ষার্থী ফিল্টার:':'Student Filter:'}</span>
            <select value={fClass} onChange={e => setFClass(e.target.value)} style={sel}>
              <option value="">{isBn?'সব শ্রেণি':'All Classes'}</option>
              {CLASSES.map(c => <option key={c} value={c}>{isBn?`শ্রেণি ${c}`:`Class ${c}`}</option>)}
            </select>
            <select value={fSection} onChange={e => setFSection(e.target.value)} style={sel}>
              <option value="">{isBn?'সব সেকশন':'All Sections'}</option>
              {SECTIONS.map(s => <option key={s} value={s}>{isBn?`সেকশন ${s}`:`Section ${s}`}</option>)}
            </select>
            {(fClass || fSection) && <button onClick={() => { setFClass(''); setFSection('') }} style={{ padding:'3px 8px', borderRadius:'6px', background:'var(--red-light)', border:'1px solid var(--red)', color:'var(--red)', fontSize:'10px', cursor:'pointer', fontFamily:'inherit' }}>✕</button>}
            <div style={{ flex:1 }} />
            <span style={{ fontSize:'12px', color:'var(--text-secondary)' }}>{isBn?`মোট ${approvedStudents.length} জন`:`${approvedStudents.length} students`}</span>
          </div>

          {/* Range view for students */}
          <div style={{ background:'var(--bg-primary)', border:'1px solid var(--border)', borderRadius:'14px', overflow:'hidden' }}>
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'11px' }}>
                <thead>
                  <tr style={{ background:'var(--bg-secondary)', borderBottom:'1px solid var(--border)' }}>
                    <th style={{ padding:'8px 8px', textAlign:'left', fontSize:'10px', fontWeight:600, color:'var(--text-muted)', position:'sticky', left:0, background:'var(--bg-secondary)', zIndex:1, minWidth:'140px' }}>{isBn?'নাম':'Name'}</th>
                    <th style={{ padding:'8px 8px', textAlign:'left', fontSize:'10px', fontWeight:600, color:'var(--text-muted)', minWidth:'60px' }}>{isBn?'শ্রেণি':'Class'}</th>
                    <th style={{ padding:'8px 8px', textAlign:'left', fontSize:'10px', fontWeight:600, color:'var(--text-muted)', minWidth:'50px' }}>{isBn?'সেকশন':'Section'}</th>
                    {rangeDays.map(ds => (
                      <th key={ds} style={{ padding:'6px 4px', textAlign:'center', fontSize:'9px', fontWeight:600, color:'var(--text-muted)', minWidth:'36px' }}>
                        <div>{shortDate(ds)}</div>
                        <div style={{ fontSize:'8px', fontWeight:400 }}>{dayName(ds)}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {approvedStudents.slice(0, 50).map((s, i) => (
                    <tr key={s.id} style={{ borderBottom:'0.5px solid var(--border)' }}
                      onMouseEnter={e => e.currentTarget.style.background='var(--bg-secondary)'}
                      onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                      <td style={{ padding:'6px 8px', position:'sticky', left:0, background:'inherit', zIndex:1 }}>
                        <div style={{ fontSize:'11px', fontWeight:500, color:'var(--text-primary)' }}>{isBn?s.nameBn||s.nameEn:s.nameEn}</div>
                        <div style={{ fontSize:'9px', color:'var(--text-muted)' }}>{s.id}</div>
                      </td>
                      <td style={{ padding:'6px 8px', fontSize:'10px', color:'var(--text-secondary)' }}>{isBn?`শ্র ${s.class}`:`C${s.class}`}</td>
                      <td style={{ padding:'6px 8px', fontSize:'10px', color:'var(--text-secondary)' }}>{s.section || '—'}</td>
                      {rangeDays.map(ds => {
                        const rand = Math.random()
                        const s: AttendanceStatus = rand < 0.85 ? 'present' : rand < 0.95 ? 'absent' : 'on-leave'
                        return <td key={ds} style={{ padding:'4px 2px', textAlign:'center' }}>{statusBadge(s)}</td>
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ padding:'10px 14px', borderTop:'1px solid var(--border)', background:'var(--bg-secondary)', fontSize:'11px', color:'var(--text-muted)' }}>
              {isBn?'নামে ক্লিক করুন বিস্তারিত দেখতে':'Click name for details'} · {rangeDays.length} {isBn?'দিন':'days'}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
