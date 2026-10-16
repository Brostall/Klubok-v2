import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'tracks')
fs.mkdirSync(dir, { recursive: true })

const RATE = 22050

function midi(n) {
  return 440 * 2 ** ((n - 69) / 12)
}

function writeWav(file, samples) {
  const dataSize = samples.length * 2
  const buf = Buffer.alloc(44 + dataSize)
  buf.write('RIFF', 0)
  buf.writeUInt32LE(36 + dataSize, 4)
  buf.write('WAVE', 8)
  buf.write('fmt ', 12)
  buf.writeUInt32LE(16, 16)
  buf.writeUInt16LE(1, 20)
  buf.writeUInt16LE(1, 22)
  buf.writeUInt32LE(RATE, 24)
  buf.writeUInt32LE(RATE * 2, 28)
  buf.writeUInt16LE(2, 32)
  buf.writeUInt16LE(16, 34)
  buf.write('data', 36)
  buf.writeUInt32LE(dataSize, 40)
  for (let i = 0; i < samples.length; i += 1) {
    const v = Math.max(-1, Math.min(1, samples[i]))
    buf.writeInt16LE(Math.round(v * 32767), 44 + i * 2)
  }
  fs.writeFileSync(file, buf)
}

function render(notes, bpm) {
  const beat = 60 / bpm
  const samples = []
  for (const note of notes) {
    const dur = note.beats * beat
    const count = Math.floor(dur * RATE)
    for (let i = 0; i < count; i += 1) {
      const t = i / RATE
      const env = Math.min(1, t / 0.012, Math.max(0, (dur - t) / 0.08))
      if (!note.f) {
        samples.push(0)
        continue
      }
      const a =
        Math.sin(2 * Math.PI * note.f * t) * 0.32 +
        Math.sin(2 * Math.PI * note.f * 2 * t) * 0.08 +
        Math.sin(2 * Math.PI * note.f * 0.5 * t) * 0.1
      samples.push(a * env)
    }
  }
  return samples
}

const evening = [
  { f: midi(64), beats: 1 },
  { f: midi(67), beats: 1 },
  { f: midi(71), beats: 1.5 },
  { f: midi(69), beats: 0.5 },
  { f: midi(67), beats: 1 },
  { f: midi(64), beats: 2 },
  { f: midi(62), beats: 1 },
  { f: midi(64), beats: 3 },
  { f: midi(67), beats: 1 },
  { f: midi(69), beats: 1 },
  { f: midi(71), beats: 2 },
  { f: midi(72), beats: 2 },
  { f: midi(71), beats: 1 },
  { f: midi(67), beats: 3 },
]

const honey = [
  { f: midi(57), beats: 2 },
  { f: midi(60), beats: 2 },
  { f: midi(64), beats: 1 },
  { f: midi(62), beats: 1 },
  { f: midi(60), beats: 2 },
  { f: midi(55), beats: 2 },
  { f: midi(57), beats: 2 },
  { f: midi(52), beats: 2 },
  { f: midi(57), beats: 4 },
]

const biscuit = [
  { f: midi(72), beats: 0.5 },
  { f: midi(69), beats: 0.5 },
  { f: midi(67), beats: 0.5 },
  { f: midi(69), beats: 0.5 },
  { f: midi(72), beats: 1 },
  { f: midi(76), beats: 1 },
  { f: midi(74), beats: 1 },
  { f: midi(72), beats: 2 },
  { f: midi(67), beats: 1 },
  { f: midi(69), beats: 1 },
  { f: midi(72), beats: 3 },
]

const wall = [
  { f: midi(48), beats: 2 },
  { f: midi(55), beats: 2 },
  { f: midi(52), beats: 2 },
  { f: midi(48), beats: 2 },
  { f: midi(50), beats: 2 },
  { f: midi(47), beats: 2 },
  { f: midi(48), beats: 4 },
]

const files = [
  ['evening.wav', evening, 88],
  ['honey.wav', honey, 76],
  ['biscuit.wav', biscuit, 100],
  ['wall.wav', wall, 66],
]

for (const [name, notes, bpm] of files) {
  const samples = render(notes, bpm)
  writeWav(path.join(dir, name), samples)
  console.log(name, (samples.length / RATE).toFixed(2), 's')
}
