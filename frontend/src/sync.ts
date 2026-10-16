import type { Role, SyncState } from './types'

type Handlers = {
  onSync: (state: SyncState) => void
  onHello: (info: { role: Role; id: string }) => void
  onError: (error: string) => void
}

function wsUrl() {
  const proto = location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${proto}//${location.host}/ws`
}

export function expectedPosition(state: Pick<SyncState, 'playing' | 'position' | 'at'>, offset: number) {
  if (!state.playing) return state.position
  return state.position + (Date.now() + offset - state.at) / 1000
}

export function createSocket(handlers: Handlers) {
  const ws = new WebSocket(wsUrl())
  let offset = 0
  let alive = true

  const send = (payload: Record<string, unknown>) => {
    if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(payload))
  }

  const ping = () => {
    send({ type: 'ping', t0: Date.now() })
  }

  ws.addEventListener('open', () => {
    ping()
  })

  ws.addEventListener('message', (event) => {
    let msg: {
      type?: string
      t0?: number
      tServer?: number
      role?: Role
      id?: string
      error?: string
    }
    try {
      msg = JSON.parse(String(event.data))
    } catch {
      return
    }
    if (msg.type === 'pong' && typeof msg.t0 === 'number' && typeof msg.tServer === 'number') {
      const t1 = Date.now()
      offset = msg.tServer - (msg.t0 + t1) / 2
      return
    }
    if (msg.type === 'hello' && msg.role && msg.id) {
      handlers.onHello({ role: msg.role, id: msg.id })
      return
    }
    if (msg.type === 'error') {
      handlers.onError(msg.error || 'Не получилось войти.')
      return
    }
    if (msg.type === 'sync') {
      handlers.onSync(msg as SyncState)
    }
  })

  ws.addEventListener('close', () => {
    alive = false
  })

  return {
    send,
    ping,
    offset: () => offset,
    close: () => {
      alive = false
      ws.close()
    },
    ready: () =>
      new Promise<void>((resolve, reject) => {
        if (ws.readyState === WebSocket.OPEN) {
          resolve()
          return
        }
        ws.addEventListener('open', () => resolve(), { once: true })
        ws.addEventListener('error', () => reject(new Error('Нет соединения с комнатой.')), {
          once: true,
        })
      }),
    get alive() {
      return alive
    },
  }
}

export async function createRoom() {
  const res = await fetch('/api/rooms', { method: 'POST' })
  if (!res.ok) throw new Error('Не удалось создать комнату.')
  return (await res.json()) as { code: string; hostSecret: string }
}

export async function uploadTrack(code: string, file: File, duration: number) {
  const body = new FormData()
  body.append('file', file)
  body.append('title', file.name.replace(/\.[^.]+$/, ''))
  body.append('duration', String(Math.round(duration) || 1))
  const res = await fetch(`/api/rooms/${encodeURIComponent(code)}/tracks`, {
    method: 'POST',
    body,
  })
  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as { error?: string } | null
    throw new Error(data?.error || 'Не удалось загрузить файл.')
  }
  return res.json()
}

export function hostKey(code: string) {
  return `klubok.host.${code}`
}

export function parseRoomHash() {
  const match = location.hash.match(/^#\/room\/([^/]+)/)
  if (!match) return ''
  return decodeURIComponent(match[1]).trim().toUpperCase()
}

export function roomHash(code: string) {
  return `#/room/${code}`
}

function isLoopback(host: string) {
  return host === 'localhost' || host === '127.0.0.1' || host === '[::1]' || host === '::1'
}

export async function lanOrigin() {
  if (!isLoopback(location.hostname)) return location.origin
  try {
    const res = await fetch('/api/lan')
    if (!res.ok) return location.origin
    const data = (await res.json()) as { addresses?: string[] }
    const ip = data.addresses?.[0]
    if (!ip) return location.origin
    const port = location.port || '5173'
    return `${location.protocol}//${ip}:${port}`
  } catch {
    return location.origin
  }
}

export function inviteUrl(code: string, origin = location.origin) {
  return `${origin}/${roomHash(code)}`
}

export function readDuration(file: File) {
  return new Promise<number>((resolve) => {
    const url = URL.createObjectURL(file)
    const audio = new Audio()
    audio.preload = 'metadata'
    audio.onloadedmetadata = () => {
      const value = Number.isFinite(audio.duration) ? audio.duration : 0
      URL.revokeObjectURL(url)
      resolve(value)
    }
    audio.onerror = () => {
      URL.revokeObjectURL(url)
      resolve(0)
    }
    audio.src = url
  })
}
