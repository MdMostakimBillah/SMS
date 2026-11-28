import React from 'react'
import { FileText, CheckCircle, XCircle } from 'lucide-react'
import { formatPhoneDisplay } from '@/lib/smsGateway'
import type { SMSDispatchLog } from '@/store/smsStore'

interface Props {
  isBn: boolean
  dispatchLogs: SMSDispatchLog[]
}

export const DispatchLogsTab = React.memo(function DispatchLogsTab({ isBn, dispatchLogs }: Props) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-[0.9375rem] font-bold text-[var(--text-primary)]">
          {isBn ? 'প্রতিষ্ঠানসমূহের লাইভ এসএমএস ডেলিভারি লগ' : 'Real-time SMS Dispatch Audit Trail'}
        </h2>
        <p className="text-[0.75rem] text-[var(--text-muted)]">
          {isBn
            ? 'ফি আদায়, পরীক্ষার রেজাল্ট, উপস্থিতি, ভর্তি ও ব্রডকাস্ট বার্তার পূর্ণাঙ্গ রেকর্ড'
            : 'Database log of fee receipts, exam marksheets, attendance alerts, admissions, and broadcasts'}
        </p>
      </div>

      {dispatchLogs.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center text-[var(--text-muted)] border border-[var(--border)]">
          <FileText size={36} className="mx-auto mb-2 opacity-30" />
          <p className="text-[0.875rem] font-medium">
            {isBn ? 'এখনো কোনো এসএমএস পাঠানো হয়নি' : 'No SMS dispatches logged yet'}
          </p>
        </div>
      ) : (
        <div className="glass rounded-2xl overflow-hidden border border-[var(--border)] shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[0.8125rem]">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--bg-secondary)]/50 text-[var(--text-muted)] text-[0.6875rem] font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">{isBn ? 'তারিখ ও সময়' : 'Timestamp'}</th>
                  <th className="py-3 px-4">{isBn ? 'প্রতিষ্ঠান' : 'Institution'}</th>
                  <th className="py-3 px-4">{isBn ? 'প্রাপক মোবাইল' : 'Recipient Phone'}</th>
                  <th className="py-3 px-4">{isBn ? 'টাইপ' : 'Type'}</th>
                  <th className="py-3 px-4">{isBn ? 'বার্তার বিবরণ' : 'Message Body'}</th>
                  <th className="py-3 px-4 text-center">{isBn ? 'সেগমেন্ট' : 'Units'}</th>
                  <th className="py-3 px-4 text-center">{isBn ? 'স্ট্যাটাস' : 'Status'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {dispatchLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[var(--bg-secondary)]/30 transition-colors">
                    <td className="py-3 px-4 text-[0.6875rem] text-[var(--text-muted)] whitespace-nowrap">
                      {new Date(log.sentAt).toLocaleString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3 px-4 font-medium text-[var(--text-primary)]">{log.institutionName}</td>
                    <td className="py-3 px-4 font-mono text-[0.75rem] text-cyan-500 whitespace-nowrap">
                      {formatPhoneDisplay(log.phone)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[0.625rem] font-semibold uppercase tracking-wider bg-[var(--bg-secondary)] text-[var(--text-secondary)]">
                        {log.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 max-w-xs truncate text-[0.75rem] text-[var(--text-muted)]" title={log.message}>
                      {log.message}
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-[0.75rem] text-[var(--text-secondary)]">
                      {log.costUnits}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      {log.status === 'delivered' || log.status === 'sent' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.625rem] font-medium bg-emerald-500/10 text-emerald-500">
                          <CheckCircle size={10} />
                          {isBn ? 'পৌঁছেছে' : 'Delivered'}
                        </span>
                      ) : (
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.625rem] font-medium bg-red-500/10 text-red-500"
                          title={log.error || undefined}
                        >
                          <XCircle size={10} />
                          {isBn ? 'ব্যর্থ' : 'Failed'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
})
