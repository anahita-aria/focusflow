// Web Audio alarm — a short pleasant triad chime. No asset files needed.
// Created lazily on first use (and resumed) to respect autoplay policies.
let ctx: AudioContext | null = null

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext
    if (!Ctor) return null
    ctx = new Ctor()
  }
  return ctx
}

// Call from a user gesture (e.g. Start button) to unlock audio.
export function primeAudio(): void {
  const audio = getCtx()
  if (audio && audio.state === 'suspended') void audio.resume()
}

export function playAlarm(): void {
  const audio = getCtx()
  if (!audio) return
  if (audio.state === 'suspended') void audio.resume()

  const now = audio.currentTime
  // Three ascending notes for a gentle "ding-ding-ding".
  const notes = [523.25, 659.25, 783.99] // C5, E5, G5
  notes.forEach((freq, i) => {
    const osc = audio.createOscillator()
    const gain = audio.createGain()
    osc.type = 'sine'
    osc.frequency.value = freq
    const start = now + i * 0.18
    const end = start + 0.35
    gain.gain.setValueAtTime(0, start)
    gain.gain.linearRampToValueAtTime(0.25, start + 0.03)
    gain.gain.exponentialRampToValueAtTime(0.0001, end)
    osc.connect(gain)
    gain.connect(audio.destination)
    osc.start(start)
    osc.stop(end + 0.02)
  })
}
