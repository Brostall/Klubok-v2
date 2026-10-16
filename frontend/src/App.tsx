import { useState } from 'react'
import './klubok.css'
import { Logo, PauseIcon, PlayIcon, SendIcon, SkipIcon } from './Logo'
import { Turntable } from './Turntable'
import { useRoom } from './useRoom'

type Tab = 'rooms' | 'picks'

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

export default function App() {
  const room = useRoom()
  const [tab, setTab] = useState<Tab>('rooms')
  const [draft, setDraft] = useState('')
  const [chat, setChat] = useState(STARTER_CHAT)

  const {
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
    playing,
    position,
    track,
    tracks,
    guestPerson,
    hostPerson,
    createRoom,
    joinRoom,
    goHome,
    togglePlay,
    seek,
    skip,
    selectTrack,
    copyLink,
    onUpload,
  } = room

  const guestLabel = guestPerson?.name || guestName.trim() || 'Друг'
  const duration = track?.duration || 1
  const hostLeads = role === 'host'
  const guestNeedsSound = role === 'guest' && !armed

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
            <button className="btn btn--evening" type="button" onClick={() => void createRoom()}>
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
            {shareOrigin && !shareOrigin.includes('localhost') ? (
              <p className="hint">С телефона откройте {shareOrigin} — с портом, не просто IP.</p>
            ) : (
              <p className="hint">Телефон должен быть в той же Wi‑Fi, что и этот ноутбук.</p>
            )}
          </div>
        </main>
      ) : (
        <div className="room">
          <section className="panel tracks" aria-label="Подборка">
            {tracks.map((item) => (
              <button
                key={item.id}
                className="track"
                type="button"
                aria-pressed={item.id === track?.id}
                onClick={() => selectTrack(item)}
              >
                <span className="cover" style={{ background: item.color }} />
                <span>
                  <span className="track-name">{item.title}</span>
                  <span className="track-meta">{item.by}</span>
                </span>
                <span className="track-time">{formatTime(item.duration)}</span>
              </button>
            ))}
            <label className="field" style={{ padding: 8 }}>
              Свой файл
              <input
                type="file"
                accept="audio/*"
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  void onUpload(file)
                  event.target.value = ''
                }}
              />
            </label>
            {joinError ? (
              <p className="error" style={{ padding: '0 8px 8px' }}>
                {joinError}
              </p>
            ) : null}
          </section>

          <div className="center">
            <section className="stage">
              <Turntable playing={playing} />
              <h2>{track?.title ?? '…'}</h2>
              <p className="code">Комната {code}</p>
              <input
                className="seek"
                type="range"
                min={0}
                max={duration}
                step={1}
                value={Math.min(position, duration)}
                aria-label="Позиция трека"
                disabled={!hostLeads}
                onChange={(event) => seek(Number(event.target.value))}
              />
              <div className="times">
                <span>{formatTime(position)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </section>
            <footer className="transport">
              <div className="now">
                <strong>{track?.title ?? '…'}</strong>
                <span>
                  {hostLeads
                    ? 'Вы ведёте'
                    : guestNeedsSound
                      ? 'Нажмите слушать, чтобы включить звук'
                      : 'Ведёт создатель комнаты'}
                </span>
              </div>
              <div className="transport-actions">
                <button
                  className="icon-btn"
                  type="button"
                  aria-label="Предыдущий"
                  disabled={!hostLeads}
                  onClick={() => skip(-1)}
                >
                  <SkipIcon flip />
                </button>
                <button
                  className="play"
                  type="button"
                  aria-label={guestNeedsSound ? 'Включить звук' : playing ? 'Пауза' : 'Слушать'}
                  disabled={!hostLeads && armed}
                  onClick={() => void togglePlay()}
                >
                  {playing && !guestNeedsSound ? <PauseIcon /> : <PlayIcon />}
                </button>
                <button
                  className="icon-btn"
                  type="button"
                  aria-label="Следующий"
                  disabled={!hostLeads}
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
                  <small>
                    {role === 'host' ? 'ведёт' : 'слушает'} · {track?.title ?? '…'}
                  </small>
                </span>
              </div>
              <div className="person">
                <span className="avatar" style={{ background: '#785a46' }}>
                  {together
                    ? (role === 'host' ? guestLabel : hostPerson?.name || 'Создатель')
                        .slice(0, 1)
                        .toUpperCase()
                    : '·'}
                </span>
                <span>
                  <strong>
                    {together
                      ? role === 'host'
                        ? guestLabel
                        : hostPerson?.name || 'Создатель'
                      : 'Ждём второго'}
                  </strong>
                  <small>
                    {together
                      ? `${role === 'host' ? 'слушает' : 'ведёт'} · ${track?.title ?? '…'}`
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
                  <button className="btn btn--quiet" type="button" onClick={() => void copyLink()}>
                    {copyLabel}
                  </button>
                  <p className="hint" style={{ marginTop: 8 }}>
                    {shareOrigin}/#/room/{code}
                  </p>
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
      )}
    </div>
  )
}
