export type Role = 'host' | 'guest'

export type Track = {
  id: string
  title: string
  by: string
  duration: number
  color: string
  url: string
}

export type Person = {
  id: string
  role: Role
  name: string
}

export type SyncState = {
  type: 'sync'
  code: string
  trackId: string
  playing: boolean
  position: number
  at: number
  tracks: Track[]
  people: Person[]
}
