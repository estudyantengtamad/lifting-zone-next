// Web Audio API Synthesizer - Zero external dependencies, pure tactile audio for lifters
class SoundFX {
  private ctx: AudioContext | null = null

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (AudioCtx) this.ctx = new AudioCtx()
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume()
    }
    return this.ctx
  }

  // Realistic Iron Plate Clank: low thump + metallic overtone resonant ping
  playIronClank() {
    try {
      const ctx = this.getContext()
      if (!ctx) return
      const now = ctx.currentTime

      // 1. Heavy low thud
      const osc1 = ctx.createOscillator()
      const gain1 = ctx.createGain()
      osc1.type = 'triangle'
      osc1.frequency.setValueAtTime(120, now)
      osc1.frequency.exponentialRampToValueAtTime(32, now + 0.18)
      gain1.gain.setValueAtTime(0.4, now)
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.22)
      osc1.connect(gain1)
      gain1.connect(ctx.destination)
      osc1.start(now)
      osc1.stop(now + 0.23)

      // 2. Metallic clang / ring
      const osc2 = ctx.createOscillator()
      const gain2 = ctx.createGain()
      osc2.type = 'sine'
      osc2.frequency.setValueAtTime(840, now)
      osc2.frequency.exponentialRampToValueAtTime(420, now + 0.35)
      gain2.gain.setValueAtTime(0.25, now)
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.35)
      osc2.connect(gain2)
      gain2.connect(ctx.destination)
      osc2.start(now)
      osc2.stop(now + 0.36)

      // 3. High harmonic ping
      const osc3 = ctx.createOscillator()
      const gain3 = ctx.createGain()
      osc3.type = 'sine'
      osc3.frequency.setValueAtTime(1680, now)
      gain3.gain.setValueAtTime(0.12, now)
      gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.15)
      osc3.connect(gain3)
      gain3.connect(ctx.destination)
      osc3.start(now)
      osc3.stop(now + 0.16)
    } catch {
      // Audio not permitted or failed
    }
  }

  // Crisp digital UI click
  playClick() {
    try {
      const ctx = this.getContext()
      if (!ctx) return
      const now = ctx.currentTime
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(700, now)
      osc.frequency.exponentialRampToValueAtTime(350, now + 0.05)
      gain.gain.setValueAtTime(0.15, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now)
      osc.stop(now + 0.06)
    } catch {}
  }

  // Victory / Order Success chime: C - E - G - High C chord fanfare
  playSuccess() {
    try {
      const ctx = this.getContext()
      if (!ctx) return
      const now = ctx.currentTime
      const notes = [523.25, 659.25, 783.99, 1046.5] // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'triangle'
        osc.frequency.setValueAtTime(freq, now + idx * 0.08)
        gain.gain.setValueAtTime(0, now + idx * 0.08)
        gain.gain.linearRampToValueAtTime(0.2, now + idx * 0.08 + 0.02)
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.5)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(now + idx * 0.08)
        osc.stop(now + idx * 0.08 + 0.52)
      })
    } catch {}
  }

  // Chalk scratch noise
  playScratch() {
    try {
      const ctx = this.getContext()
      if (!ctx) return
      const now = ctx.currentTime
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(250 + Math.random() * 200, now)
      gain.gain.setValueAtTime(0.06, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now)
      osc.stop(now + 0.05)
    } catch {}
  }
}

export const sound = new SoundFX()
