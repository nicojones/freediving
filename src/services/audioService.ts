import type { TimerEvent } from '../types/timer'

const AUDIO_BASE = '/audio'
const CUE_FILES = {
  hold: 'hold.m4a',
  prepare: 'prepare.m4a',
  '30s': '30s.m4a',
  breathe: 'breathe.m4a',
} as const

export type CueName = keyof typeof CUE_FILES


function loadCue(cue: CueName): Promise<HTMLAudioElement> {
  return new Promise((resolve, reject) => {
    const url = `${AUDIO_BASE}/${CUE_FILES[cue]}`
    const audio = new Audio(url)
    audio.crossOrigin = 'anonymous'

    const done = () => resolve(audio)
    audio.onloadeddata = done
    audio.oncanplaythrough = done
    audio.onerror = () =>
      reject(new Error(`Audio file ${CUE_FILES[cue]} failed to load. Ensure hold.m4a, prepare.m4a, 30s.m4a, breathe.m4a exist in public/audio/`))
  })
}

export interface AudioServiceAPI {
  preload(): Promise<void>
  play(cue: CueName): void
  wireToTimer(engine: { on(eventType: TimerEvent['type'], callback: (e: TimerEvent) => void): void }): void
}

export function createAudioService(): AudioServiceAPI {
  const preloaded = new Map<CueName, HTMLAudioElement>()

  async function preload(): Promise<void> {
    const cues: CueName[] = ['hold', 'prepare', '30s', 'breathe']
    const results = await Promise.allSettled(cues.map((cue) => loadCue(cue)))

    const firstRejection = results.find((r): r is PromiseRejectedResult => r.status === 'rejected')
    if (firstRejection) {
      throw firstRejection.reason instanceof Error
        ? firstRejection.reason
        : new Error('Audio file failed to load. Ensure hold.m4a, prepare.m4a, 30s.m4a, breathe.m4a exist in public/audio/')
    }

    for (let i = 0; i < cues.length; i++) {
      const r = results[i]
      if (r.status === 'fulfilled') {
        preloaded.set(cues[i], r.value)
      }
    }
  }

  function play(cue: CueName): void {
    const audio = preloaded.get(cue)
    if (audio) {
      audio.currentTime = 0
      audio.play().catch(() => {})
    } else {
      const url = `${AUDIO_BASE}/${CUE_FILES[cue]}`
      const a = new Audio(url)
      a.crossOrigin = 'anonymous'
      a.play().catch(() => {})
    }
  }

  function wireToTimer(
    engine: { on(eventType: TimerEvent['type'], callback: (e: TimerEvent) => void): void }
  ): void {
    engine.on('hold_in_3', () => play('hold'))
    engine.on('prepare_hold', () => play('prepare'))
    engine.on('countdown_30', () => play('30s'))
    engine.on('hold_end', () => play('breathe'))
  }

  return { preload, play, wireToTimer }
}
