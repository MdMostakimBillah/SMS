import { useState } from 'react'
import { CreditCard, Zap, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react'
import type { RfidEntry } from '../types'

interface RfidSwipeTesterProps {
  isBn: boolean
  rfidEntries: RfidEntry[]
  onSimulatePunch?: (personId: string, method?: 'punch' | 'rfid' | 'fingerprint' | 'face' | 'mobile', deviceId?: string) => Promise<unknown>
}

export function RfidSwipeTester({ isBn, rfidEntries, onSimulatePunch }: RfidSwipeTesterProps) {
  const [cardInput, setCardInput] = useState('')
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const assignedCards = rfidEntries.filter((r) => r.assigned)

  const handleTestSwipe = async (cardToTest?: string) => {
    const cardNo = (cardToTest || cardInput).trim()
    if (!cardNo) return

    setIsProcessing(true)
    setFeedback(null)

    const matched = rfidEntries.find(
      (r) => r.rfidCard.trim().toLowerCase() === cardNo.toLowerCase()
    )

    if (!matched) {
      setFeedback({
        type: 'error',
        message: isBn
          ? `কার্ড "${cardNo}" ডাটাবেসে পাওয়া যায়নি! অনুগ্রহ করে সঠিক কার্ড নম্বর লিখুন।`
          : `Card "${cardNo}" not found in database! Please check the card ID.`,
      })
      setIsProcessing(false)
      return
    }

    if (!matched.assigned) {
      setFeedback({
        type: 'error',
        message: isBn
          ? `কার্ড "${cardNo}" কোনো ব্যক্তি বা শিক্ষার্থীর জন্য বরাদ্দ করা নেই!`
          : `Card "${cardNo}" is not assigned to any student or staff!`,
      })
      setIsProcessing(false)
      return
    }

    if (onSimulatePunch) {
      try {
        await onSimulatePunch(matched.staffId, 'rfid', 'RFID-SWIPE-TEST')
        setFeedback({
          type: 'success',
          message: isBn
            ? `${matched.staffName} (${matched.rfidCard}) — RFID পাঞ্চ সফল হয়েছে!`
            : `${matched.staffName} (${matched.rfidCard}) — RFID swipe punch recorded!`,
        })
        setCardInput('')
      } catch {
        setFeedback({
          type: 'error',
          message: isBn ? 'পাঞ্চ রেকর্ড করতে সমস্যা হয়েছে' : 'Failed to record punch',
        })
      }
    }
    setIsProcessing(false)
  }

  return (
    <div className="bg-[var(--bg-secondary)] border border-[var(--brand)]/30 rounded-xl p-3.5 mb-4 shadow-xs">
      <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[var(--brand-light)] flex items-center justify-center text-[var(--brand)]">
            <CreditCard size={15} />
          </div>
          <div>
            <h4 className="text-[0.8125rem] font-semibold text-[var(--text-primary)]">
              {isBn ? 'RFID কার্ড সোয়াইপ / স্ক্যানার টেস্ট' : 'RFID Card Swipe & Scanner Test'}
            </h4>
            <p className="text-[0.625rem] text-[var(--text-muted)]">
              {isBn
                ? 'পাঞ্চ ডিভাইস না থাকলে এখান থেকে USB রিডার অথবা কার্ড নম্বর টাইপ করে টেস্ট করুন'
                : 'Test punches using a USB RFID reader or by typing card numbers without a physical machine'}
            </p>
          </div>
        </div>

        {/* Quick Test Chips */}
        {assignedCards.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[0.625rem] text-[var(--text-muted)] flex items-center gap-1">
              <Sparkles size={10} className="text-[var(--brand)]" />
              {isBn ? 'দ্রুত টেস্ট:' : 'Quick Test:'}
            </span>
            {assignedCards.slice(0, 3).map((c) => (
              <button
                key={c.rfidCard}
                type="button"
                onClick={() => handleTestSwipe(c.rfidCard)}
                disabled={isProcessing}
                className="px-2 py-0.5 rounded text-[0.5625rem] font-mono font-medium bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--brand)] hover:text-[var(--brand)] cursor-pointer transition-all"
                title={c.staffName}
              >
                {c.rfidCard} ({c.staffName.split(' ')[0]})
              </button>
            ))}
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          handleTestSwipe()
        }}
        className="flex gap-2 items-center"
      >
        <div className="relative flex-1">
          <input
            value={cardInput}
            onChange={(e) => setCardInput(e.target.value)}
            placeholder={isBn ? 'কার্ড সোয়াইপ করুন অথবা কার্ড আইডি লিখুন (e.g. CARD-1045)...' : 'Swipe card or type card ID (e.g. CARD-1045)...'}
            className="w-full px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] text-[0.75rem] font-mono text-[var(--text-primary)] outline-none focus:border-[var(--brand)] transition-colors"
          />
        </div>
        <button
          type="submit"
          disabled={!cardInput.trim() || isProcessing}
          className={`px-3.5 py-1.5 rounded-lg text-white text-[0.6875rem] font-semibold cursor-pointer border-0 transition-all flex items-center gap-1.5 shrink-0 ${
            cardInput.trim() && !isProcessing
              ? 'bg-[var(--brand)] hover:opacity-90 shadow-xs'
              : 'bg-[var(--border)] text-[var(--text-muted)] cursor-not-allowed opacity-60'
          }`}
        >
          <Zap size={11} />
          {isProcessing ? (isBn ? 'পাঞ্চ হচ্ছে...' : 'Punching...') : isBn ? 'পাঞ্চ সোয়াইপ' : 'Test Swipe'}
        </button>
      </form>

      {feedback && (
        <div
          className={`mt-2.5 p-2 rounded-lg text-[0.6875rem] flex items-center gap-2 ${
            feedback.type === 'success'
              ? 'bg-[var(--green-light)] border border-[var(--green)] text-[var(--green)]'
              : 'bg-[var(--red-light)] border border-[var(--red)] text-[var(--red)]'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 size={13} className="shrink-0" />
          ) : (
            <AlertCircle size={13} className="shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}
    </div>
  )
}
