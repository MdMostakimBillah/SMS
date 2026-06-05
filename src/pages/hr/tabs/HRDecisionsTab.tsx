import { Zap, CheckCircle2, XCircle, ThumbsUp, AlertCircle, Award, Gift, TrendingUp, Percent } from 'lucide-react'
import CircularChart from '@/components/ui/CircularChart'
import { sectionCls, sectionTitleCls } from '@/pages/hr/utils'

interface HRDecisionsTabProps {
  isBn: boolean
  isMobile: boolean
  teachers: any[]
  recommendations: any[]
  teacherCompositeScores: any[]
  showGenerateRecs: boolean
  handleGenerateRecommendations: () => void
  handleApproveRecommendation: (rec: any) => void
  updateRecommendation: (id: string, status: string) => void
  getAvatarGradient: (id: string) => string
  getInitials: (name: string) => string
  getTeacherDept: (id: string) => string
}

export default function HRDecisionsTab({
  isBn,
  isMobile,
  teachers,
  recommendations,
  teacherCompositeScores,
  showGenerateRecs,
  handleGenerateRecommendations,
  handleApproveRecommendation,
  updateRecommendation,
  getAvatarGradient,
  getInitials,
  getTeacherDept,
}: HRDecisionsTabProps) {
  return (
    <>
      <div className={sectionCls(isMobile)}>
        <div className="flex items-center gap-[0.625rem] justify-between flex-wrap">
          <div>
            <div className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
              <Zap size={16} className="text-[var(--brand)]" />
              {isBn ? 'বুদ্ধিমান সুপারিশ' : 'AI Recommendations'}
            </div>
            <div className="text-xs text-[var(--text-muted)] mt-[0.125rem]">
              {isBn ? 'উপস্থিতি, হোমওয়ার্ক, রিপোর্ট ও ফলাফলের ভিত্তিতে' : 'Based on attendance, homework, reports & performance'}
            </div>
          </div>
          <button
            onClick={handleGenerateRecommendations}
            className="flex items-center gap-[0.3125rem] py-2 px-4 rounded-lg bg-[var(--brand)] border-none text-white text-xs font-medium cursor-pointer font-[inherit]"
          >
            <Zap size={14} />
            {isBn ? 'সুপারিশ তৈরি করুন' : 'Generate'}
          </button>
        </div>
        {showGenerateRecs && (
          <div className="mt-[0.625rem] py-2 px-3 rounded-lg bg-[var(--green-light)] text-[var(--green)] text-xs font-medium">
            <CheckCircle2 size={14} className="inline mr-[0.375rem]" />
            {isBn ? 'সুপারিশ তৈরি করা হয়েছে!' : 'Recommendations generated!'}
          </div>
        )}
      </div>

      <div className={sectionCls(isMobile)}>
        <div className={sectionTitleCls}>
          <Percent size={15} className="text-[var(--teal)]" />
          {isBn ? 'সামগ্রিক স্কোর' : 'Performance Scores'}
        </div>
        <div className="flex flex-col gap-1.5">
          {teacherCompositeScores.slice(0, 10).map((t, i) => (
            <div key={t.id} className="py-[0.625rem] px-3 rounded-lg bg-[var(--bg-secondary)] transition-all">
              <div className="flex items-center gap-[0.625rem]">
                <span className={`text-[0.8125rem] font-bold w-[1.5rem] ${i < 3 ? 'text-[var(--amber)]' : 'text-[var(--text-muted)]'}`}>
                  #{i + 1}
                </span>
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-[0.5625rem] font-semibold text-white shrink-0"
                  style={{ background: getAvatarGradient(t.id) }}
                >
                  {getInitials(t.nameEn)}
                </div>
                <div className="flex-1 min-w-[0]">
                  <div className="text-[0.8125rem] font-medium text-[var(--text-primary)]">{t.nameEn}</div>
                  <div className="text-[0.6875rem] text-[var(--text-muted)]">
                    {getTeacherDept(t.id)} · {t.designation}
                  </div>
                </div>
                <CircularChart
                  value={t.totalScore}
                  size={42}
                  stroke={5}
                  color={t.totalScore >= 80 ? 'var(--green)' : t.totalScore >= 60 ? 'var(--amber)' : 'var(--red)'}
                />
              </div>
              <div className="grid grid-cols-4 gap-1.5 mt-2">
                {[
                  { label: isBn ? 'উপস্থিতি' : 'Att', val: `${t.attRate}%`, color: 'var(--purple)' },
                  { label: isBn ? 'হোমওয়ার্ক' : 'HW', val: `${t.hwRate}%`, color: 'var(--green)' },
                  { label: isBn ? 'রিপোর্ট' : 'Reports', val: `${t.repRate}%`, color: 'var(--teal)' },
                  { label: isBn ? 'ফলাফল' : 'Scores', val: `${t.avgScore}`, color: 'var(--brand)' },
                ].map((d) => (
                  <div key={d.label} className="text-center p-1 rounded-md bg-[var(--bg-primary)]">
                    <div className="text-[0.625rem] text-[var(--text-muted)]">{d.label}</div>
                    <div className="text-[0.8125rem] font-semibold" style={{ color: d.color }}>
                      {d.val}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={sectionCls(isMobile)}>
        <div className={sectionTitleCls}>
          <ThumbsUp size={15} className="text-[var(--green)]" />
          {isBn ? 'বিবেচনাধীন' : 'Pending'}
        </div>
        {recommendations.filter((r) => r.status === 'pending').length === 0 ? (
          <div className="p-5 text-center text-[var(--text-muted)] text-[0.8125rem]">
            {isBn ? 'কোনো সুপারিশ নেই। "সুপারিশ তৈরি করুন" বাটনে ক্লিক করুন।' : 'No pending recommendations. Click "Generate".'}
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            {recommendations
              .filter((r) => r.status === 'pending')
              .map((rec) => {
                const teacher = teachers.find((t) => t.id === rec.teacherId)
                const colors: Record<string, string> = { promotion: 'var(--purple)', bonus: 'var(--amber)', increment: 'var(--green)' }
                const bg: Record<string, string> = {
                  promotion: 'var(--purple-light)',
                  bonus: 'var(--amber-light)',
                  increment: 'var(--green-light)',
                }
                const icons: Record<string, any> = { promotion: Award, bonus: Gift, increment: TrendingUp }
                const IconComp = icons[rec.type]
                const labels: Record<string, string> = {
                  promotion: isBn ? 'পদোন্নতি' : 'Promotion',
                  bonus: isBn ? 'বোনাস' : 'Bonus',
                  increment: isBn ? 'বৃদ্ধি' : 'Increment',
                }
                return (
                  <div key={rec.id} className="p-3 rounded-[0.625rem] bg-[var(--bg-secondary)]">
                    <div className="flex items-center gap-[0.625rem] flex-wrap">
                      <div
                        className="w-[2.125rem] h-[2.125rem] rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: bg[rec.type] }}
                      >
                        <IconComp size={15} style={{ color: colors[rec.type] }} />
                      </div>
                      <div className="flex-1 min-w-[0]">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[0.8125rem] font-semibold text-[var(--text-primary)]">
                            {teacher?.nameEn || rec.teacherId}
                          </span>
                          <span
                            className="text-[0.6875rem] py-[0.125rem] px-2 rounded-full font-medium"
                            style={{ background: bg[rec.type], color: colors[rec.type] }}
                          >
                            {labels[rec.type]}
                          </span>
                          <span className="text-[0.6875rem] text-[var(--text-muted)]">
                            {isBn ? 'স্কোর' : 'Score'}: <strong className="text-[var(--brand)]">{rec.score}</strong>
                          </span>
                        </div>
                        <div className="text-xs text-[var(--text-secondary)] mt-[0.125rem]">{rec.reason}</div>
                      </div>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => handleApproveRecommendation(rec)}
                          className="py-[0.375rem] px-3 rounded-lg bg-[var(--green)] border-none text-white text-xs font-medium cursor-pointer font-[inherit] flex items-center gap-1"
                        >
                          <CheckCircle2 size={13} />
                          {isBn ? 'অনুমোদন' : 'Approve'}
                        </button>
                        <button
                          onClick={() => updateRecommendation(rec.id, 'rejected')}
                          className="py-[0.375rem] px-3 rounded-lg bg-transparent border border-[var(--border)] text-[var(--text-secondary)] text-xs cursor-pointer font-[inherit] flex items-center gap-1"
                        >
                          <XCircle size={13} />
                          {isBn ? 'বাতিল' : 'Reject'}
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
          </div>
        )}
      </div>

      {recommendations.filter((r) => r.status !== 'pending').length > 0 && (
        <div className={sectionCls(isMobile)}>
          <div className={sectionTitleCls}>
            <AlertCircle size={15} className="text-[var(--text-muted)]" />
            {isBn ? 'ইতিহাস' : 'History'}
          </div>
          <div className="flex flex-col gap-1">
            {recommendations
              .filter((r) => r.status !== 'pending')
              .map((rec) => {
                const teacher = teachers.find((t) => t.id === rec.teacherId)
                const colors: Record<string, string> = { promotion: 'var(--purple)', bonus: 'var(--amber)', increment: 'var(--green)' }
                const bg: Record<string, string> = {
                  promotion: 'var(--purple-light)',
                  bonus: 'var(--amber-light)',
                  increment: 'var(--green-light)',
                }
                const labels: Record<string, string> = {
                  promotion: isBn ? 'পদোন্নতি' : 'Promotion',
                  bonus: isBn ? 'বোনাস' : 'Bonus',
                  increment: isBn ? 'বৃদ্ধি' : 'Increment',
                }
                return (
                  <div key={rec.id} className="py-2 px-3 rounded-lg bg-[var(--bg-secondary)] flex items-center gap-[0.625rem]">
                    <div
                      className="w-7 h-7 rounded-[0.4375rem] flex items-center justify-center shrink-0"
                      style={{ background: bg[rec.type] }}
                    >
                      {rec.type === 'promotion' ? (
                        <Award size={13} style={{ color: colors[rec.type] }} />
                      ) : rec.type === 'bonus' ? (
                        <Gift size={13} style={{ color: colors[rec.type] }} />
                      ) : (
                        <TrendingUp size={13} style={{ color: colors[rec.type] }} />
                      )}
                    </div>
                    <div className="flex-1">
                      <span className="text-[0.8125rem] font-medium text-[var(--text-primary)]">{teacher?.nameEn || rec.teacherId}</span>
                      <span
                        className="text-[0.6875rem] py-px px-2 rounded-xl font-medium ml-2"
                        style={{ background: bg[rec.type], color: colors[rec.type] }}
                      >
                        {labels[rec.type]}
                      </span>
                    </div>
                    <span
                      className={`text-[0.6875rem] py-[0.1875rem] px-2 rounded-full font-medium ${rec.status === 'approved' ? 'bg-[var(--green-light)]' : 'bg-[var(--red-light)]'} ${rec.status === 'approved' ? 'text-[var(--green)]' : 'text-[var(--red)]'}`}
                    >
                      {rec.status === 'approved' ? (isBn ? 'অনুমোদিত' : 'Approved') : isBn ? 'বাতিল' : 'Rejected'}
                    </span>
                  </div>
                )
              })}
          </div>
        </div>
      )}
    </>
  )
}
