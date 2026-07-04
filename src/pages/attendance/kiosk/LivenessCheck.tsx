import { useState, useRef, useEffect, useCallback } from 'react'
import { Eye } from 'lucide-react'
import {
  type LivenessState,
  getChallengePrompt,
  evaluateLiveness,
  createLivenessState,
  startNewChallenge,
  isChallengeTimedOut,
  recordChallengeResult,
  getPassCount,
  REQUIRED_PASSES,
} from '@/lib/faceLiveness'

interface LivenessCheckProps {
  isBn: boolean
  getVideo: () => HTMLVideoElement | null
  detectWithExpressions: (video: HTMLVideoElement) => Promise<unknown>
  onPassed: () => void
  onFailed: () => void
}

export default function LivenessCheck({ isBn, getVideo, detectWithExpressions, onPassed, onFailed }: LivenessCheckProps) {
  const [passCount, setPassCount] = useState(0)
  const [challengeText, setChallengeText] = useState('')
  const [statusText, setStatusText] = useState('')
  const [completed, setCompleted] = useState(false)

  const stateRef = useRef<LivenessState>(createLivenessState())
  const blinkFrameCountRef = useRef(0)
  const detectIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const onPassedRef = useRef(onPassed)
  onPassedRef.current = onPassed

  const startChallenge = useCallback((currentState: LivenessState) => {
    const updated = startNewChallenge(currentState)
    stateRef.current = updated
    if (updated.currentChallenge) {
      setChallengeText(getChallengePrompt(updated.currentChallenge, isBn))
      setStatusText(getChallengePrompt(updated.currentChallenge, isBn))
    }
    setPassCount(getPassCount(updated))
    return updated
  }, [isBn])

  useEffect(() => {
    const initial = startChallenge(createLivenessState())
    stateRef.current = initial

    detectIntervalRef.current = setInterval(async () => {
      const video = getVideo()
      if (!video || video.readyState < 2 || video.videoWidth === 0) return

      const currentState = stateRef.current
      if (!currentState.currentChallenge) return

      if (isChallengeTimedOut(currentState)) {
        const updated = recordChallengeResult(currentState, false, 'Timed out')
        stateRef.current = updated
        setPassCount(getPassCount(updated))
        blinkFrameCountRef.current = 0
        if (updated.passed) {
          if (detectIntervalRef.current) clearInterval(detectIntervalRef.current)
          setCompleted(true)
          onPassedRef.current()
        } else if (getPassCount(updated) < REQUIRED_PASSES) {
          setTimeout(() => startChallenge(updated), 1000)
        }
        return
      }

      try {
        const result = await detectWithExpressions(video)
        if (!result) return

        const eval_ = evaluateLiveness(result as never, currentState.currentChallenge, blinkFrameCountRef.current)
        setStatusText(eval_.details)

        if (currentState.currentChallenge === 'blink' && eval_.details.includes('Keep blinking')) {
          blinkFrameCountRef.current++
        }

        if (eval_.passed) {
          const updated = recordChallengeResult(currentState, true, eval_.details)
          stateRef.current = updated
          setPassCount(getPassCount(updated))
          blinkFrameCountRef.current = 0
          if (updated.passed) {
            if (detectIntervalRef.current) clearInterval(detectIntervalRef.current)
            setCompleted(true)
            onPassedRef.current()
          } else {
            setTimeout(() => startChallenge(updated), 1500)
          }
        }
      } catch {
        // detection error, skip this frame
      }
    }, 350)

    return () => {
      if (detectIntervalRef.current) clearInterval(detectIntervalRef.current)
    }
  }, [getVideo, detectWithExpressions, startChallenge])

  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center pointer-events-none">
      <div className="relative z-10 flex flex-col items-center gap-4 p-6 max-w-sm">
        <div className="w-16 h-16 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center border border-white/10">
          <Eye size={28} className="text-white" />
        </div>

        <div className="text-center">
          <div className="text-white text-[1rem] font-bold mb-1 drop-shadow-lg">
            {isBn ? 'সত্যতা যাচাই' : 'Liveness Check'}
          </div>
          <div className="text-white/70 text-[0.75rem] drop-shadow">
            {isBn ? `${REQUIRED_PASSES}টি চ্যালেঞ্জ সম্পন্ন করুন` : `Complete ${REQUIRED_PASSES} challenges`}
          </div>
        </div>

        <div className="flex gap-2">
          {Array.from({ length: REQUIRED_PASSES }).map((_, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                i < passCount
                  ? 'bg-[var(--green)] shadow-[0_0_8px_rgba(34,197,94,0.6)]'
                  : 'bg-white/20'
              }`}
            />
          ))}
        </div>

        {!completed && challengeText && (
          <div className="bg-black/60 backdrop-blur-sm rounded-2xl px-6 py-4 text-center border border-white/10">
            <div className="text-[0.625rem] text-white/50 uppercase tracking-wider mb-2">
              {isBn ? 'চ্যালেঞ্জ' : 'Challenge'} {passCount + 1}/{REQUIRED_PASSES}
            </div>
            <div className="text-white text-[1.125rem] font-bold drop-shadow-lg">
              {challengeText}
            </div>
          </div>
        )}

        {completed && (
          <div className="bg-[var(--green)]/80 backdrop-blur-sm rounded-2xl px-6 py-4 text-center border border-[var(--green)]/30">
            <div className="text-white text-[1rem] font-bold">
              {isBn ? 'যাচাই সম্পন্ন!' : 'Verified!'}
            </div>
          </div>
        )}

        <div className="text-[0.75rem] text-white/70 drop-shadow bg-black/40 rounded-lg px-3 py-1 backdrop-blur-sm">
          {statusText}
        </div>

        <button
          onClick={() => {
            if (detectIntervalRef.current) clearInterval(detectIntervalRef.current)
            onFailed()
          }}
          className="pointer-events-auto px-4 py-2 rounded-lg bg-white/10 text-white/70 text-[0.75rem] border border-white/10 cursor-pointer hover:bg-white/20 transition-colors backdrop-blur-sm"
        >
          {isBn ? 'বাতিল করুন' : 'Cancel'}
        </button>
      </div>
    </div>
  )
}
