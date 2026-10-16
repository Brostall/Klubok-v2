import crypto from 'node:crypto'
import fs from 'node:fs'
import http from 'node:http'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import express from 'express'
import multer from 'multer'
import { WebSocketServer } from 'ws'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PORT = Number(process.env.PORT || 3001)
const ALPHABET = 'АБВГДЕЖКЛМНПРСТ'
const MAX_PEOPLE = 2
const MAX_UPLOAD = 12 * 1024 * 1024

const TRACKS_DIR = path.join(__dirname, 'tracks')
const UPLOAD_DIR = path.join(__dirname, 'uploads')
fs.mkdirSync(UPLOAD_DIR, { recursive: true })

function trackUrl(filename) {
  return `/tracks/${encodeURIComponent(filename)}`
}

const CATALOG = [
  {
    id: '1',
    title: 'Тёплый вечер',
    by: 'Подборка',
    duration: 180,
    color: '#d24136',
    file: 'worry (Slowed) - LONOWN (youtube).m4a',
  },
  {
    id: '2',
    title: 'Мед',
    by: 'Подборка',
    duration: 180,
    color: '#eb8a3e',
    file: 'Highway - FLXWEROFF (youtube).m4a',
  },
  {
    id: '3',
    title: 'Бискотти',
    by: 'Подборка',
    duration: 180,
    color: '#ebb582',
    file: 'Lambada (DVRST Rework) - Release (youtube).m4a',
  },
  {
    id: '4',
    title: 'Каменная стена',
    by: 'Подборка',
    duration: 180,
    color: '#785a46',
    file: 'Mental Warfare - Chikoi The Maid (youtube).m4a',
  },
]

function wavDuration(file) {
  try {
    const buf = fs.readFileSync(file)
    if (buf.toString('ascii', 0, 4) !== 'RIFF') return null
    const rate = buf.readUInt32LE(24)
    const byteRate = buf.readUInt32LE(28)
    const dataSize = buf.readUInt32LE(40)
    if (!rate || !byteRate) return null
    return Math.max(1, Math.round(dataSize / byteRate))
  } catch {
    return null
  }
}

function walkBoxes(buf, start, end, visit) {
  let offset = start
  while (offset + 8 <= end) {
    let size = buf.readUInt32BE(offset)
    const type = buf.toString('ascii', offset + 4, offset + 8)
    let header = 8
    if (size === 1 && offset + 16 <= end) {
      size = Number(buf.readBigUInt64BE(offset + 8))
      header = 16
    }
    if (!size || offset + size > end) break
    if (visit(type, offset, size, header) === true) return true
    offset += size
  }
  return false
}

function m4aDuration(file) {
  try {
    const buf = fs.readFileSync(file)
    let seconds = null
    walkBoxes(buf, 0, buf.length, (type, offset, size, header) => {
      if (type !== 'moov') return false
      walkBoxes(buf, offset + header, offset + size, (inner, innerOffset, innerSize, innerHeader) => {
        if (inner !== 'mvhd') return false
        const payload = innerOffset + innerHeader
        const version = buf[payload]
        if (version === 1) {
          const timescale = buf.readUInt32BE(payload + 20)
          const duration = Number(buf.readBigUInt64BE(payload + 24))
          if (timescale) seconds = duration / timescale
        } else {
          const timescale = buf.readUInt32BE(payload + 12)
          const duration = buf.readUInt32BE(payload + 16)
          if (timescale) seconds = duration / timescale
        }
        return true
      })
      return seconds != null
    })
    return seconds ? Math.max(1, Math.round(seconds)) : null
  } catch {
    return null
  }
}

for (const item of CATALOG) {
  item.url = trackUrl(item.file)
  const file = path.join(TRACKS_DIR, item.file)
  const duration = m4aDuration(file) || wavDuration(file)
  if (duration) item.duration = duration
  delete item.file
}

function makeCode() {
  let code = ''
  for (let i = 0; i < 4; i += 1) {
    code += ALPHABET[Math.floor(Math.random() * ALPHABET.length)]
  }
  return code
}

function now() {
  return Date.now()
}

function mediaPosition(room) {
  if (!room.playing) return room.position
  const elapsed = (now() - room.at) / 1000
  const track = room.tracks.find((item) => item.id === room.trackId) ?? room.tracks[0]
  return Math.min(track.duration, room.position + elapsed)
}

function snapshot(room) {
  return {
    type: 'sync',
    code: room.code,
    trackId: room.trackId,
    playing: room.playing,
    looping: Boolean(room.looping),
    position: mediaPosition(room),
    at: now(),
    tracks: room.tracks,
    people: [...room.clients.values()].map((client) => ({
      id: client.id,
      role: client.role,
      name: client.name,
    })),
    chat: room.chat ?? [],
  }
}

function send(ws, payload) {
  if (ws.readyState === 1) ws.send(JSON.stringify(payload))
}

function broadcast(room, payload) {
  const raw = JSON.stringify(payload)
  for (const client of room.clients.keys()) {
    if (client.readyState === 1) client.send(raw)
  }
}

const rooms = new Map()

function createRoom() {
  let code = makeCode()
  while (rooms.has(code)) code = makeCode()
  const room = {
    code,
    hostSecret: crypto.randomBytes(16).toString('hex'),
    trackId: CATALOG[0].id,
    playing: false,
    looping: false,
    position: 0,
    at: now(),
    tracks: CATALOG.map((item) => ({ ...item })),
    chat: [],
    clients: new Map(),
  }
  rooms.set(code, room)
  return room
}

function findRoom(code) {
  return rooms.get(code.trim().toUpperCase())
}

const app = express()
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', 'content-type')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }
  next()
})
app.use(express.json({ limit: '1mb' }))
app.use('/tracks', express.static(TRACKS_DIR))
app.use('/uploads', express.static(UPLOAD_DIR))

const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOAD_DIR,
    filename: (_req, file, done) => {
      const ext = path.extname(file.originalname || '').toLowerCase() || '.bin'
      done(null, `${Date.now()}-${crypto.randomBytes(4).toString('hex')}${ext}`)
    },
  }),
  limits: { fileSize: MAX_UPLOAD },
  fileFilter: (_req, file, done) => {
    const ok = /^audio\//.test(file.mimetype) || /\.(mp3|wav|ogg|m4a|aac|flac|webm)$/i.test(file.originalname)
    done(ok ? null : new Error('Нужен аудиофайл'), ok)
  },
})

function lanAddresses() {
  const found = []
  for (const list of Object.values(os.networkInterfaces())) {
    for (const item of list || []) {
      const v4 = item.family === 'IPv4' || item.family === 4
      if (!v4 || item.internal) continue
      found.push(item.address)
    }
  }
  const rank = (ip) => {
    if (ip.startsWith('192.168.56.') || ip.startsWith('192.168.59.')) return 5
    if (ip.startsWith('192.168.')) return 0
    if (ip.startsWith('10.')) return 1
    if (/^172\.(1[6-9]|2\d|3[01])\./.test(ip)) return 2
    return 4
  }
  return found.sort((a, b) => rank(a) - rank(b))
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

app.get('/api/lan', (_req, res) => {
  res.json({ addresses: lanAddresses() })
})

app.post('/api/rooms', (_req, res) => {
  const room = createRoom()
  res.json({ code: room.code, hostSecret: room.hostSecret, tracks: room.tracks })
})

app.get('/api/rooms/:code', (req, res) => {
  const room = findRoom(String(req.params.code || ''))
  if (!room) {
    res.status(404).json({ error: 'Комнаты нет.' })
    return
  }
  res.json({ code: room.code, tracks: room.tracks, people: snapshot(room).people })
})

app.post('/api/rooms/:code/tracks', (req, res) => {
  const room = findRoom(String(req.params.code || ''))
  if (!room) {
    res.status(404).json({ error: 'Комнаты нет.' })
    return
  }
  upload.single('file')(req, res, (err) => {
    if (err) {
      res.status(400).json({ error: 'Не удалось загрузить файл.' })
      return
    }
    if (!req.file) {
      res.status(400).json({ error: 'Выберите аудиофайл.' })
      return
    }
    const probed = m4aDuration(req.file.path) || wavDuration(req.file.path)
    const fromClient = Math.round(Number(req.body?.duration))
    const duration = probed || (fromClient > 0 ? fromClient : 180)
    const title = String(req.body?.title || req.file.originalname || 'Свой файл').slice(0, 80)
    const colors = ['#d24136', '#eb8a3e', '#ebb582', '#785a46']
    const track = {
      id: `u-${crypto.randomBytes(4).toString('hex')}`,
      title,
      by: 'Загрузка',
      duration,
      color: colors[room.tracks.length % colors.length],
      url: `/uploads/${req.file.filename}`,
    }
    room.tracks.push(track)
    room.trackId = track.id
    room.playing = false
    room.position = 0
    room.at = now()
    broadcast(room, snapshot(room))
    res.json({ track })
  })
})

const DIST = path.join(__dirname, '../frontend/dist')
if (fs.existsSync(DIST)) {
  app.use(express.static(DIST))
  app.get(/^(?!\/api\/|\/tracks\/|\/uploads\/).*/, (_req, res) => {
    res.sendFile(path.join(DIST, 'index.html'))
  })
}

const server = http.createServer(app)
const wss = new WebSocketServer({ server, path: '/ws' })

wss.on('connection', (ws) => {
  let joined = null

  ws.on('message', (raw) => {
    let msg
    try {
      msg = JSON.parse(String(raw))
    } catch {
      return
    }

    if (msg.type === 'ping') {
      send(ws, { type: 'pong', t0: msg.t0, tServer: now() })
      return
    }

    if (msg.type === 'join') {
      const room = findRoom(String(msg.code || ''))
      if (!room) {
        send(ws, { type: 'error', error: 'Комнаты нет.' })
        return
      }
      const isHost = msg.hostSecret && msg.hostSecret === room.hostSecret
      if (isHost) {
        for (const [sock, person] of room.clients) {
          if (person.role === 'host') {
            room.clients.delete(sock)
            sock.close()
          }
        }
      }
      const guests = [...room.clients.values()].filter((item) => item.role === 'guest').length
      if (!isHost && guests >= MAX_PEOPLE - 1) {
        send(ws, { type: 'error', error: 'В комнате уже двое.' })
        return
      }
      if (joined) {
        joined.room.clients.delete(ws)
      }
      const client = {
        id: crypto.randomBytes(4).toString('hex'),
        role: isHost ? 'host' : 'guest',
        name: isHost ? 'Создатель' : String(msg.name || '').trim() || 'Друг',
      }
      room.clients.set(ws, client)
      joined = { room, client }
      send(ws, { type: 'hello', role: client.role, id: client.id })
      broadcast(room, snapshot(room))
      return
    }

    if (!joined) return
    const { room, client } = joined

    if (msg.type === 'name' && client.role === 'guest') {
      client.name = String(msg.name || '').trim() || 'Друг'
      broadcast(room, snapshot(room))
      return
    }

    if (msg.type === 'chat') {
      const text = String(msg.text || '').trim().slice(0, 300)
      if (!text) return
      const stamp = new Date()
      room.chat.push({
        id: crypto.randomBytes(4).toString('hex'),
        senderId: client.id,
        name: client.name,
        text,
        time: `${stamp.getHours()}:${stamp.getMinutes().toString().padStart(2, '0')}`,
      })
      if (room.chat.length > 80) room.chat = room.chat.slice(-80)
      broadcast(room, snapshot(room))
      return
    }

    if (client.role !== 'host') return

    if (msg.type === 'play') {
      room.position = Number(msg.position) || 0
      room.playing = true
      room.at = now()
      broadcast(room, snapshot(room))
      return
    }

    if (msg.type === 'pause') {
      room.position = Number(msg.position) || 0
      room.playing = false
      room.at = now()
      broadcast(room, snapshot(room))
      return
    }

    if (msg.type === 'seek') {
      room.position = Number(msg.position) || 0
      room.at = now()
      if (typeof msg.playing === 'boolean') room.playing = msg.playing
      broadcast(room, snapshot(room))
      return
    }

    if (msg.type === 'loop') {
      room.looping = Boolean(msg.looping)
      broadcast(room, snapshot(room))
      return
    }

    if (msg.type === 'select') {
      const track = room.tracks.find((item) => item.id === msg.trackId)
      if (!track) return
      room.trackId = track.id
      room.position = 0
      room.playing = false
      room.at = now()
      broadcast(room, snapshot(room))
      return
    }

    if (msg.type === 'report') {
      room.position = Number(msg.position) || 0
      room.playing = Boolean(msg.playing)
      room.at = now()
      const state = snapshot(room)
      for (const [sock, person] of room.clients) {
        if (person.role === 'guest') send(sock, state)
      }
    }
  })

  ws.on('close', () => {
    if (!joined) return
    joined.room.clients.delete(ws)
    broadcast(joined.room, snapshot(joined.room))
  })
})

server.listen(PORT, '0.0.0.0', () => {
  console.log(`klubok backend http://0.0.0.0:${PORT}`)
  for (const ip of lanAddresses()) {
    console.log(`  http://${ip}:${PORT}`)
  }
})
