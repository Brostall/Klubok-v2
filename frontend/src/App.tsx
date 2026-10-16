import { useState } from 'react'
import './klubok.css'
import { Logo, PauseIcon, PlayIcon, RepeatIcon, SendIcon, SkipIcon, YarnMark } from './Logo'
import { Turntable } from './Turntable'
import { useRoom } from './useRoom'

function formatTime(seconds: number) {
  const safe = Math.max(0, Math.floor(seconds))
  const m = Math.floor(safe / 60)
  const s = safe % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function App() {
  const room = useRoom()
  const [draft, setDraft] = useState('')

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
    looping,
    toggleLoop,
    selectTrack,
    copyLink,
    onUpload,
    chat,
    sendChat,
  } = room

  const guestLabel = guestPerson?.name || guestName.trim() || 'Друг'
  const duration = track?.duration || 1
  const hostLeads = role === 'host'
  const guestNeedsSound = role === 'guest' && !armed

  const send = () => {
    if (!sendChat(draft)) return
    setDraft('')
  }

  return (
    <div className="shell">
      <header className="header">
        <Logo />
        {screen === 'room' ? (
          <button className="btn btn--quiet header-exit" type="button" onClick={goHome}>
            Выйти
          </button>
        ) : null}
      </header>

      {screen === 'home' ? (
        <main className="home">
          <YarnMark className="home-yarn" />
          <h1>Добрый день</h1>
          <p>Создать комнату или зайдите по коду</p>
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
                disabled={!hostLeads}
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
            {hostLeads ? (
              <label className="field field--upload">
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
            ) : null}
            {joinError ? <p className="error">{joinError}</p> : null}
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
              <div className="transport">
                <div className="now">
                  <span>
                    {hostLeads
                      ? 'Вы ведёте'
                      : guestNeedsSound
                        ? 'Нажмите слушать, чтобы включить звук'
                        : 'Ведёт создатель комнаты'}
                  </span>
                </div>
                <div className="transport-actions">
                  <div className="transport-main">
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
                  <button
                    className="icon-btn transport-loop"
                    type="button"
                    aria-label="По кругу"
                    aria-pressed={looping}
                    disabled={!hostLeads}
                    onClick={toggleLoop}
                  >
                    <RepeatIcon />
                  </button>
                </div>
              </div>
            </section>
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
                <span className="avatar avatar--you">В</span>
                <span>
                  <strong>Вы</strong>
                  <small>
                    {role === 'host' ? 'ведёт' : 'слушает'} · {track?.title ?? '…'}
                  </small>
                </span>
              </div>
              <div className="person">
                <span className="avatar avatar--other">
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
                <label className="field field--name">
                  Как к вам обращаться
                  <input
                    value={guestName}
                    onChange={(event) => setGuestName(event.target.value)}
                    placeholder="Друг"
                  />
                </label>
              ) : (
                <div className="people-action">
                  <button className="btn btn--quiet" type="button" onClick={() => void copyLink()}>
                    {copyLabel}
                  </button>
                  <p className="hint">{shareOrigin}/#/room/{code}</p>
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
                    <span className={item.who === 'Вы' ? 'avatar avatar--you' : 'avatar avatar--other'}>
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
