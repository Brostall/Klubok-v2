import { useCallback, useEffect, useRef, useState } from 'react'
import {
  createRoom as apiCreateRoom,
  createSocket,
  expectedPosition,
  hostKey,
  lanOrigin,
  parseRoomHash,
  readDuration,
  roomHash,
  uploadTrack,
} from './sync'
import type { Role, SyncState, Track } from './types'

const DRIFT = 0.12

type Socket = ReturnType<typeof createSocket>

async function writeClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    try {
      const area = document.createElement('textarea')
      area.value = text
      area.setAttribute('readonly', '')
      area.style.position = 'fixed'
      area.style.left = '-9999px'
      document.body.appendChild(area)
      area.select()
      const ok = document.execCommand('copy')
      area.remove()
      return ok
    } catch {
      return false
    }
  }
}

export function useRoom() {
  const [screen, setScreen] = useState<'home' | 'room'>('home')
  const [role, setRole] = useState<Role>('host')
  const [code, setCode] = useState('')
  const [joinValue, setJoinValue] = useState('')
  const [joinError, setJoinError] = useState('')
  const [copyLabel, setCopyLabel] = useState('Скопировать ссылку')
  const [shareOrigin, setShareOrigin] = useState(() => location.origin)
  const [selfId, setSelfId] = useState('')
  const [guestName, setGuestName] = useState('')
  const [armed, setArmed] = useState(false)
  const [uiNow, setUiNow] = useState(0)
  const [sync, setSync] = useState<SyncState | null>(null)
  const socketRef = useRef<Socket | null>(null)
  const stateRef = useRef<SyncState | null>(null)
  const roleRef = useRef<Role>('host')
  const armedRef = useRef(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const lifeRef = useRef(0)

  const getAudio = () => {
    if (!audioRef.current) {
      const el = new Audio()
      el.preload = 'auto'
      audioRef.current = el
    }
    return audioRef.current
  }

  const applyAudio = useCallback((state: SyncState, isHost: boolean) => {
    const el = getAudio()
    const track = state.tracks.find((item) => item.id === state.trackId) ?? state.tracks[0]
    if (!track) return
    const offset = socketRef.current?.offset() ?? 0
    const want = Math.max(0, Math.min(track.duration, expectedPosition(state, offset)))
    const afterReady = () => {
      el.loop = Boolean(state.looping)
      if (Math.abs(el.currentTime - want) > (state.playing ? DRIFT : 0.04)) {
        el.currentTime = want
      }
      if (isHost) return
      if (state.playing && armedRef.current) {
        void el.play().catch((error: unknown) => {
          if (error instanceof DOMException && error.name === 'NotAllowedError') {
            armedRef.current = false
            setArmed(false)
          }
        })
      } else if (!el.paused) {
        el.pause()
      }
    }
    if (el.getAttribute('data-src') !== track.url) {
      el.setAttribute('data-src', track.url)
      el.src = track.url
      const once = () => {
        el.removeEventListener('canplay', once)
        afterReady()
      }
      el.addEventListener('canplay', once)
      el.load()
      return
    }
    afterReady()
  }, [setArmed])

  const disconnect = useCallback(() => {
    lifeRef.current += 1
    socketRef.current?.close()
    socketRef.current = null
    stateRef.current = null
    setSync(null)
    const el = audioRef.current
    if (el) {
      el.pause()
      el.removeAttribute('src')
      el.removeAttribute('data-src')
      el.load()
    }
  }, [])

  const enter = useCallback(
    async (nextCode: string, hostSecret?: string) => {
      if (stateRef.current?.code === nextCode && socketRef.current?.alive) return
      disconnect()
      const life = lifeRef.current
      setJoinError('')
      const socket = createSocket({
        onHello: (info) => {
          if (life !== lifeRef.current) return
          roleRef.current = info.role
          setRole(info.role)
          setSelfId(info.id)
          setJoinError('')
          setScreen('room')
          if (info.role === 'host') {
            armedRef.current = true
            setArmed(true)
          }
        },
        onError: (error) => {
          if (life !== lifeRef.current) return
          setJoinError(error)
          setScreen('home')
          setArmed(false)
          armedRef.current = false
          const hashed = Boolean(parseRoomHash())
          disconnect()
          if (hashed) window.location.hash = '#/'
        },
        onSync: (state) => {
          if (life !== lifeRef.current) return
          stateRef.current = state
          setSync(state)
          setCode(state.code)
          setScreen('room')
          applyAudio(state, roleRef.current === 'host')
        },
      })
      socketRef.current = socket
      try {
        await socket.ready()
      } catch (error) {
        if (life !== lifeRef.current) return
        setJoinError(error instanceof Error ? error.message : 'Нет соединения с комнатой.')
        setScreen('home')
        if (parseRoomHash()) window.location.hash = '#/'
        return
      }
      if (life !== lifeRef.current || socketRef.current !== socket) return
      socket.send({
        type: 'join',
        code: nextCode,
        hostSecret,
        name: 'Друг',
      })
      setCode(nextCode)
    },
    [applyAudio, disconnect],
  )

  useEffect(() => {
    const openFromHash = () => {
      const hashCode = parseRoomHash()
      if (!hashCode) {
        disconnect()
        setScreen('home')
        return
      }
      const secret = sessionStorage.getItem(hostKey(hashCode)) || undefined
      void enter(hashCode, secret).catch((error: Error) => {
        setJoinError(error.message)
        setScreen('home')
      })
    }
    window.addEventListener('hashchange', openFromHash)
    openFromHash()
    return () => {
      window.removeEventListener('hashchange', openFromHash)
    }
  }, [disconnect, enter])

  useEffect(() => {
    armedRef.current = armed
  }, [armed])

  useEffect(() => {
    void lanOrigin().then(setShareOrigin)
  }, [])

  useEffect(() => {
    if (!sync) return
    let frame = 0
    const tick = () => {
      const el = audioRef.current
      const state = stateRef.current
      if (state) {
        const track = state.tracks.find((item) => item.id === state.trackId)
        const offset = socketRef.current?.offset() ?? 0
        const pos = el?.getAttribute('data-src')
          ? el.currentTime
          : expectedPosition(state, offset)
        setUiNow(track ? Math.min(track.duration, pos) : pos)
      }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [sync])

  useEffect(() => {
    if (role !== 'guest' || !sync) return
    const timer = window.setInterval(() => {
      const state = stateRef.current
      if (state) applyAudio(state, false)
      socketRef.current?.ping()
    }, 350)
    return () => window.clearInterval(timer)
  }, [role, sync, applyAudio])

  useEffect(() => {
    if (role !== 'host' || !sync?.playing) return
    const timer = window.setInterval(() => {
      const el = audioRef.current
      if (!el) return
      socketRef.current?.send({
        type: 'report',
        position: el.currentTime,
        playing: !el.paused && !el.ended,
      })
      socketRef.current?.ping()
    }, 400)
    return () => window.clearInterval(timer)
  }, [role, sync?.playing])

  useEffect(() => {
    const el = getAudio()
    const onEnded = () => {
      if (roleRef.current !== 'host') return
      if (stateRef.current?.looping) {
        el.currentTime = 0
        void el.play().catch(() => {})
        socketRef.current?.send({ type: 'play', position: 0 })
        return
      }
      socketRef.current?.send({ type: 'pause', position: el.currentTime })
    }
    el.addEventListener('ended', onEnded)
    return () => el.removeEventListener('ended', onEnded)
  }, [])

  useEffect(() => {
    if (role !== 'guest') return
    socketRef.current?.send({ type: 'name', name: guestName.trim() || 'Друг' })
  }, [guestName, role])

  const createRoom = async () => {
    setJoinError('')
    try {
      const created = await apiCreateRoom()
      sessionStorage.setItem(hostKey(created.code), created.hostSecret)
      roleRef.current = 'host'
      setRole('host')
      window.location.hash = roomHash(created.code)
    } catch (error) {
      setJoinError(error instanceof Error ? error.message : 'Не удалось создать комнату.')
    }
  }

  const joinRoom = () => {
    const value = joinValue.trim().toUpperCase()
    if (value.length < 3) {
      setJoinError('Введите код комнаты.')
      return
    }
    sessionStorage.removeItem(hostKey(value))
    window.location.hash = roomHash(value)
  }

  const goHome = () => {
    disconnect()
    armedRef.current = false
    setArmed(false)
    setScreen('home')
    setJoinError('')
    setCopyLabel('Скопировать ссылку')
    if (parseRoomHash()) window.location.hash = '#/'
  }

  const hostSend = (payload: Record<string, unknown>) => {
    if (roleRef.current !== 'host') return
    socketRef.current?.send(payload)
  }

  const togglePlay = async () => {
    const el = getAudio()
    if (role === 'guest') {
      const state = stateRef.current
      armedRef.current = true
      if (state) applyAudio(state, false)
      const roomPlaying = Boolean(state?.playing)
      try {
        const pending = el.play()
        if (!roomPlaying) el.pause()
        await pending
        setArmed(true)
      } catch (error) {
        const aborted = error instanceof DOMException && error.name === 'AbortError'
        if (aborted && !roomPlaying) {
          setArmed(true)
          return
        }
        armedRef.current = false
        setArmed(false)
      }
      return
    }
    const live = stateRef.current
    if (live?.playing) {
      el.pause()
      hostSend({ type: 'pause', position: el.currentTime })
      return
    }
    try {
      await el.play()
    } catch {
      return
    }
    hostSend({ type: 'play', position: el.currentTime })
  }

  const seek = (value: number) => {
    const el = getAudio()
    if (role !== 'host') return
    el.currentTime = value
    hostSend({ type: 'seek', position: value, playing: !el.paused })
  }

  const selectTrack = (track: Track) => {
    if (role !== 'host') return
    hostSend({ type: 'select', trackId: track.id })
  }

  const toggleLoop = () => {
    if (role !== 'host') return
    hostSend({ type: 'loop', looping: !sync?.looping })
  }

  const skip = (dir: -1 | 1) => {
    if (role !== 'host' || !sync) return
    const index = sync.tracks.findIndex((item) => item.id === sync.trackId)
    const next = sync.tracks[(index + dir + sync.tracks.length) % sync.tracks.length]
    if (next) selectTrack(next)
  }

  const copyLink = async () => {
    const origin = await lanOrigin()
    setShareOrigin(origin)
    const url = `${origin}/${roomHash(code)}`
    const ok = await writeClipboard(url)
    if (!ok) window.prompt('Ссылка на комнату', url)
    setCopyLabel(ok ? 'Скопировано' : 'Скопируйте ссылку')
    window.setTimeout(() => setCopyLabel('Скопировать ссылку'), 1600)
  }

  const sendChat = (text: string) => {
    const value = text.trim()
    if (!value) return false
    socketRef.current?.send({ type: 'chat', text: value })
    return true
  }

  const onUpload = async (file: File | undefined) => {
    if (!file || !code) return
    try {
      const duration = await readDuration(file)
      await uploadTrack(code, file, duration)
      setJoinError('')
    } catch (error) {
      setJoinError(error instanceof Error ? error.message : 'Не удалось загрузить файл.')
    }
  }

  const track = sync?.tracks.find((item) => item.id === sync.trackId) ?? sync?.tracks[0] ?? null
  const people = sync?.people ?? []
  const together = people.length >= 2
  const guestPerson = people.find((item) => item.role === 'guest')
  const hostPerson = people.find((item) => item.role === 'host')
  const chat = (sync?.chat ?? []).map((item) => ({
    ...item,
    who: item.senderId === selfId ? 'Вы' : item.name,
  }))

  return {
    screen,
    role,
    code,
    joinValue,
    setJoinValue,
    joinError,
    copyLabel,
    shareOrigin,
    guestName,
    setGuestName,
    armed,
    together,
    playing: Boolean(sync?.playing),
    position: uiNow,
    track,
    tracks: sync?.tracks ?? [],
    guestPerson,
    hostPerson,
    createRoom,
    joinRoom,
    goHome,
    togglePlay,
    seek,
    skip,
    looping: Boolean(sync?.looping),
    toggleLoop,
    selectTrack,
    copyLink,
    onUpload,
    chat,
    sendChat,
  }
}
