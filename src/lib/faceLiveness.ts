import type { FaceLandmarks68, WithFaceLandmarks, WithFaceDetection, WithFaceExpressions } from '@vladmandic/face-api'
import type { Point } from '@vladmandic/face-api'

export type LivenessChallenge = 'blink' | 'turn-left' | 'turn-right' | 'smile'

export interface LivenessResult {
  passed: boolean
  challenge: LivenessChallenge
  details: string
  timestamp: number
}

export interface LivenessState {
  currentChallenge: LivenessChallenge | null
  challengeStartTime: number
  completedChallenges: LivenessResult[]
  passed: boolean
}

const EAR_THRESHOLD = 0.25
const EAR_CLOSE_FRAMES = 2
const YAW_THRESHOLD = 8
const SMILE_THRESHOLD = 0.5
const CHALLENGE_TIMEOUT_MS = 8000
const REQUIRED_PASSES = 2

export function calculateEAR(eyePoints: Point[]): number {
  if (eyePoints.length !== 6) return 1
  const p1 = eyePoints[0]
  const p2 = eyePoints[1]
  const p3 = eyePoints[2]
  const p4 = eyePoints[3]
  const p5 = eyePoints[4]
  const p6 = eyePoints[5]

  const vertDist1 = Math.sqrt((p2.x - p6.x) ** 2 + (p2.y - p6.y) ** 2)
  const vertDist2 = Math.sqrt((p3.x - p5.x) ** 2 + (p3.y - p5.y) ** 2)
  const horizDist = Math.sqrt((p1.x - p4.x) ** 2 + (p1.y - p4.y) ** 2)

  return horizDist === 0 ? 1 : (vertDist1 + vertDist2) / (2 * horizDist)
}

export function detectBlink(landmarks: FaceLandmarks68): boolean {
  const leftEye = landmarks.getLeftEye()
  const rightEye = landmarks.getRightEye()
  const leftEAR = calculateEAR(leftEye)
  const rightEAR = calculateEAR(rightEye)
  const avgEAR = (leftEAR + rightEAR) / 2
  return avgEAR < EAR_THRESHOLD
}

export function detectSmile(result: WithFaceExpressions<WithFaceLandmarks<WithFaceDetection<{}>>>): boolean {
  const expressions = result.expressions
  return expressions.happy > SMILE_THRESHOLD
}

export function detectHeadTurn(yaw: number, direction: 'left' | 'right'): boolean {
  if (direction === 'left') return yaw < -YAW_THRESHOLD
  return yaw > YAW_THRESHOLD
}

export function detectHeadTurnFromLandmarks(landmarks: FaceLandmarks68, direction: 'left' | 'right'): boolean {
  const jaw = landmarks.getJawOutline()
  const nose = landmarks.getNose()
  if (jaw.length < 9 || nose.length < 1) return false
  const leftJaw = jaw[0]
  const rightJaw = jaw[8]
  const noseTip = nose[3]
  const faceWidth = Math.abs(rightJaw.x - leftJaw.x)
  if (faceWidth === 0) return false
  const noseOffset = (noseTip.x - (leftJaw.x + rightJaw.x) / 2) / faceWidth
  if (direction === 'left') return noseOffset < -0.1
  return noseOffset > 0.1
}

export function randomChallenge(): LivenessChallenge {
  const challenges: LivenessChallenge[] = ['blink', 'turn-left', 'turn-right', 'smile']
  return challenges[Math.floor(Math.random() * challenges.length)]
}

export function getChallengePrompt(challenge: LivenessChallenge, isBn: boolean): string {
  const prompts: Record<LivenessChallenge, { en: string; bn: string }> = {
    'blink': { en: 'Blink your eyes', bn: 'চোখ ঝাপটান' },
    'turn-left': { en: 'Turn your head left', bn: 'মাথা বামে ঘোরান' },
    'turn-right': { en: 'Turn your head right', bn: 'মাথা ডানে ঘোরান' },
    'smile': { en: 'Smile', bn: 'হাসুন' },
  }
  return isBn ? prompts[challenge].bn : prompts[challenge].en
}

export function evaluateLiveness(
  result: WithFaceExpressions<WithFaceLandmarks<WithFaceDetection<{}>>> | null,
  challenge: LivenessChallenge,
  blinkFrameCount: number
): { passed: boolean; details: string } {
  if (!result) return { passed: false, details: 'No face detected' }

  const landmarks = result.landmarks
  const angle = result.angle

  switch (challenge) {
    case 'blink': {
      const isBlinking = detectBlink(landmarks)
      if (isBlinking && blinkFrameCount >= EAR_CLOSE_FRAMES) {
        return { passed: true, details: 'Blink detected' }
      }
      return { passed: false, details: isBlinking ? 'Keep blinking...' : 'Blink your eyes' }
    }
    case 'turn-left': {
      const yaw = angle.yaw ?? 0
      const detected = yaw !== 0
        ? detectHeadTurn(yaw, 'left')
        : detectHeadTurnFromLandmarks(landmarks, 'left')
      if (detected) {
        return { passed: true, details: 'Head turn detected' }
      }
      return { passed: false, details: `Turn your head to the left (yaw: ${yaw.toFixed(1)})` }
    }
    case 'turn-right': {
      const yaw = angle.yaw ?? 0
      const detected = yaw !== 0
        ? detectHeadTurn(yaw, 'right')
        : detectHeadTurnFromLandmarks(landmarks, 'right')
      if (detected) {
        return { passed: true, details: 'Head turn detected' }
      }
      return { passed: false, details: `Turn your head to the right (yaw: ${yaw.toFixed(1)})` }
    }
    case 'smile': {
      if (detectSmile(result as WithFaceExpressions<WithFaceLandmarks<WithFaceDetection<{}>>>)) {
        return { passed: true, details: 'Smile detected' }
      }
      return { passed: false, details: 'Please smile' }
    }
  }
}

export function createLivenessState(): LivenessState {
  return {
    currentChallenge: null,
    challengeStartTime: 0,
    completedChallenges: [],
    passed: false,
  }
}

export function startNewChallenge(state: LivenessState): LivenessState {
  const challenge = randomChallenge()
  return {
    ...state,
    currentChallenge: challenge,
    challengeStartTime: Date.now(),
  }
}

export function isChallengeTimedOut(state: LivenessState): boolean {
  if (!state.currentChallenge) return false
  return Date.now() - state.challengeStartTime > CHALLENGE_TIMEOUT_MS
}

export function recordChallengeResult(
  state: LivenessState,
  passed: boolean,
  details: string
): LivenessState {
  const result: LivenessResult = {
    passed,
    challenge: state.currentChallenge!,
    details,
    timestamp: Date.now(),
  }
  const completed = [...state.completedChallenges, result]
  const passCount = completed.filter((r) => r.passed).length
  return {
    currentChallenge: null,
    challengeStartTime: 0,
    completedChallenges: completed,
    passed: passCount >= REQUIRED_PASSES,
  }
}

export function getPassCount(state: LivenessState): number {
  return state.completedChallenges.filter((r) => r.passed).length
}

export { EAR_THRESHOLD, EAR_CLOSE_FRAMES, YAW_THRESHOLD, SMILE_THRESHOLD, CHALLENGE_TIMEOUT_MS, REQUIRED_PASSES }
