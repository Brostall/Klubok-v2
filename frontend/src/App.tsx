import { useEffect, useRef, useState } from 'react'
import './klubok.css'
import { Logo, PauseIcon, PlayIcon, SendIcon, SkipIcon } from './Logo'
import { Turntable } from './Turntable'

type Screen = 'home' | 'room'
type Role = 'host' | 'guest'
type Tab = 'rooms' | 'picks'

type Track = {
  id: string
  title: string
  by: string
  duration: number
  color: string
}

const CATALOG: Track[] = [
  { id: '1', title: 'Тёплый вечер', by: 'Подборка', duration: 192, color: '#d24136' },
  { id: '2', title: 'Мед', by: 'Подборка', duration: 214, color: '#eb8a3e' },
  { id: '3', title: 'Бискотти', by: 'Подборка', duration: 178, color: '#ebb582' },
  { id: '4', title: 'Каменная стена', by: 'Подборка', duration: 241, color: '#785a46' },
]

const STARTER_CHAT = [
  { id: 'c1', who: 'Вы', text: 'Какой вайб', time: '3:08' },
  { id: 'c2', who: 'Друг', text: 'Пошли спать', time: '3:09' },
  { id: 'c3', who: 'Вы', text: 'Давай следующую', time: '3:10' },
]

function formatTime(seconds: number) {
  const safe = Math.max(0, Math.floor(seconds))
  const m = Math.floor(safe / 60)
  const s = safe % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function makeCode() {
  const alphabet = 'АБВГДЕЖКЛМНПРСТ'
  let code = ''
  for (let i = 0; i < 4; i += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)]
  }
  return code
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('home')
  const [role, setRole] = useState<Role>('host')
  const [tab, setTab] = useState<Tab>('rooms')
  const [code, setCode] = useState('')
  const [joinValue, setJoinValue] = useState('')
  const [joinError, setJoinError] = useState('')
  const [trackId, setTrackId] = useState(CATALOG[0].id)
  const [playing, setPlaying] = useState(false)
  const [position, setPosition] = useState(0)
  const [clock, setClock] = useState(0)
  const [together, setTogether] = useState(false)
  const [guestName, setGuestName] = useState('')
  const [draft, setDraft] = useState('')
  const [chat, setChat] = useState(STARTER_CHAT)
  const positionRef = useRef(0)

  const track = CATALOG.find((item) => item.id === trackId) ?? CATALOG[0]
  const guestLabel = guestName.trim() || 'Друг'

  const goHome = () => {
    setScreen('home')
    setPlaying(false)
    setTogether(false)
    window.location.hash = '#/'
  }

  const createRoom = () => {
    const next = makeCode()
    setCode(next)
    setRole('host')
    setTogether(false)
    setPlaying(false)
    setPosition(0)
    setTab('rooms')
    setScreen('room')
    window.location.hash = `#/room/${next}`
  }

  const joinRoom = () => {
    const value = joinValue.trim().toUpperCase()
    if (value.length < 3) {
      setJoinError('Введите код комнаты.')
      return
    }
    setJoinError('')
    setCode(value)
    setRole('guest')
    setTogether(true)
    setPlaying(false)
    setTab('rooms')
    setScreen('room')
    window.location.hash = `#/room/${value}`
  }

  useEffect(() => {
    positionRef.current = position
  }, [position])

  useEffect(() => {
    if (!playing) return
    const started = performance.now()
    const origin = positionRef.current
    let frame = 0
    const tick = (now: number) => {
      const next = origin + (now - started) / 1000
      if (next >= track.duration) {
        setPosition(track.duration)
        setPlaying(false)
        return
      }
      setPosition(next)
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [playing, track.duration, clock, trackId])

  const seek = (value: number) => {
    if (role !== 'host') return
    setPosition(value)
    positionRef.current = value
    setClock((n) => n + 1)
  }

  const skip = (dir: -1 | 1) => {
    if (role !== 'host') return
    const index = CATALOG.findIndex((item) => item.id === trackId)
    const next = CATALOG[(index + dir + CATALOG.length) % CATALOG.length]
    setTrackId(next.id)
    setPosition(0)
    setClock((n) => n + 1)
  }

  const send = () => {
    const text = draft.trim()
    if (!text) return
    const now = new Date()
    setChat((list) => [
      ...list,
      {
        id: `c${list.length + 1}`,
        who: role === 'host' ? 'Вы' : guestLabel,
        text,
        time: `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`,
      },
    ])
    setDraft('')
  }

  return (
    <div className="shell">
      <header className="header">
        <Logo />
        {screen === 'room' ? (
          <>
            <nav className="nav" aria-label="Разделы">
              <button
                type="button"
                aria-current={tab === 'rooms' ? 'page' : undefined}
                onClick={() => setTab('rooms')}
              >
                Комнаты
              </button>
              <button
                type="button"
                aria-current={tab === 'picks' ? 'page' : undefined}
                onClick={() => setTab('picks')}
              >
                Подборка
              </button>
            </nav>
            <button className="btn btn--quiet header-exit" type="button" onClick={goHome}>
              Выйти
            </button>
          </>
        ) : null}
      </header>

      {screen === 'home' ? (
        <main className="home">
          <h1>Добрый день</h1>
          <p>Создайте комнату или зайдите по коду.</p>
          <div className="home-actions">
            <button className="btn btn--evening" type="button" onClick={createRoom}>
              Создать комнату
            </button>
            <label className="field">
              Код комнаты
              <input
                value={joinValue}
                onChange={(event) => setJoinValue(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') joinRoom()
                }}
              />
            </label>
            <button className="btn btn--stone" type="button" onClick={joinRoom}>
              Присоединиться
            </button>
            {joinError ? <p className="error">{joinError}</p> : null}
          </div>
        </main>
      ) : (
        <>
          <div className="room">
              <section className="panel tracks" aria-label="Подборка">
                {CATALOG.map((item) => (
                  <button
                    key={item.id}
                    className="track"
                    type="button"
                    aria-pressed={item.id === track.id}
                    onClick={() => {
                      if (role !== 'host') return
                      setTrackId(item.id)
                      setPosition(0)
                      setPlaying(false)
                    }}
                  >
                    <span className="cover" style={{ background: item.color }} />
                    <span>
                      <span className="track-name">{item.title}</span>
                      <span className="track-meta">{item.by}</span>
                    </span>
                    <span className="track-time">{formatTime(item.duration)}</span>
                  </button>
                ))}
              </section>

            <div className="center">
              <section className="stage">
                <Turntable playing={playing} />
                <h2>{track.title}</h2>
                <p className="code">Комната {code}</p>
                <input
                  className="seek"
                  type="range"
                  min={0}
                  max={track.duration}
                  step={1}
                  value={Math.min(position, track.duration)}
                  aria-label="Позиция трека"
                  disabled={role !== 'host'}
                  onChange={(event) => seek(Number(event.target.value))}
                />
                <div className="times">
                  <span>{formatTime(position)}</span>
                  <span>{formatTime(track.duration)}</span>
                </div>
              </section>
              <footer className="transport">
                <div className="now">
                  <strong>{track.title}</strong>
                  <span>{role === 'host' ? 'Вы ведёте' : 'Ведёт создатель комнаты'}</span>
                </div>
                <div className="transport-actions">
                  <button
                    className="icon-btn"
                    type="button"
                    aria-label="Предыдущий"
                    disabled={role !== 'host'}
                    onClick={() => skip(-1)}
                  >
                    <SkipIcon flip />
                  </button>
                  <button
                    className="play"
                    type="button"
                    aria-label={playing ? 'Пауза' : 'Слушать'}
                    disabled={role !== 'host'}
                    onClick={() => setPlaying((value) => !value)}
                  >
                    {playing ? <PauseIcon /> : <PlayIcon />}
                  </button>
                  <button
                    className="icon-btn"
                    type="button"
                    aria-label="Следующий"
                    disabled={role !== 'host'}
                    onClick={() => skip(1)}
                  >
                    <SkipIcon />
                  </button>
                </div>
              </footer>
            </div>

            <aside className="side">
              <div className="panel people-panel">
                <div className="side-head">
                  <h2>Участники</h2>
                  <span className="online">
                    <i />
                    {together ? '2 онлайн' : '1 онлайн'}
                  </span>
                </div>
                <div className="person">
                  <span className="avatar" style={{ background: '#d24136' }}>
                    В
                  </span>
                  <span>
                    <strong>Вы</strong>
                    <small>{role === 'host' ? 'ведёт' : 'слушает'} · {track.title}</small>
                  </span>
                </div>
                <div className="person">
                  <span className="avatar" style={{ background: '#785a46' }}>
                    {together ? guestLabel.slice(0, 1).toUpperCase() : '·'}
                  </span>
                  <span>
                    <strong>{together ? (role === 'host' ? guestLabel : 'Создатель') : 'Ждём второго'}</strong>
                    <small>
                      {together
                        ? `${role === 'host' ? 'слушает' : 'ведёт'} · ${track.title}`
                        : 'ссылка ещё не открыта'}
                    </small>
                  </span>
                </div>
                {role === 'guest' ? (
                  <label className="field" style={{ padding: '8px 16px 12px' }}>
                    Как к вам обращаться
                    <input
                      value={guestName}
                      onChange={(event) => setGuestName(event.target.value)}
                      placeholder="Гость"
                    />
                  </label>
                ) : (
                  <div className="people-action">
                    <button
                      className="btn btn--quiet"
                      type="button"
                      onClick={() => setTogether((value) => !value)}
                    >
                      {together ? 'Друг вышел' : 'Друг зашёл'}
                    </button>
                  </div>
                )}
              </div>
              <div className="panel chat">
                <div className="chat-head">
                  <h2>Общий чат</h2>
                </div>
                <div className="messages">
                  {chat.map((item) => (
                    <div className="bubble" key={item.id}>
                      <span
                        className="avatar"
                        style={{
                          width: 28,
                          height: 28,
                          fontSize: '0.7rem',
                          background: item.who === 'Вы' ? '#d24136' : '#785a46',
                        }}
                      >
                        {item.who.slice(0, 1)}
                      </span>
                      <p>
                        <strong>{item.who}</strong>
                        <br />
                        {item.text}
                      </p>
                      <time>{item.time}</time>
                    </div>
                  ))}
                </div>
                <form
                  className="compose"
                  onSubmit={(event) => {
                    event.preventDefault()
                    send()
                  }}
                >
                  <input
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    placeholder="Написать сообщение"
                    aria-label="Сообщение"
                  />
                  <button className="send" type="submit" aria-label="Отправить">
                    <SendIcon />
                  </button>
                </form>
              </div>
            </aside>
          </div>
        </>
      )}
    </div>
  )
}
