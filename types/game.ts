export type RoomStatus = 'waiting' | 'accusation' | 'defense' | 'jury' | 'verdict' | 'finished'

export type PlayerRole = 'prosecutor' | 'defendant' | 'jury' | 'judge'

export interface Room {
  id: string
  room_code: string
  created_at: string
  status: RoomStatus
  crime_scenario: string | null
  created_by: string
  prosecutor_id: string | null
  defendant_id: string | null
}

export interface Profile {
  id: string
  username: string
  avatar_url: string | null
  created_at: string
}

export interface RoomMember {
  id: string
  room_id: string
  profile_id: string
  role: PlayerRole
  joined_at: string
  profile: Profile
}

export interface Argument {
  id: string
  room_id: string
  player_id: string
  phase: 'accusation' | 'defense'
  content: string
  submitted_at: string
}

export interface Vote {
  id: string
  room_id: string
  jury_member_id: string
  vote: 'guilty' | 'not_guilty'
  voted_at: string
}

export interface JudgeVerdict {
  id: string
  room_id: string
  verdict: 'guilty' | 'not_guilty'
  punishment: string | null
  reasoning: string | null
  vote_distribution: {
    guilty: number
    not_guilty: number
  }
  delivered_at: string
}

export type GameState = {
  room: Room | null
  profiles: Profile[]
  roomMembers: RoomMember[]
  arguments: Argument[]
  votes: Vote[]
  judgeVerdict: JudgeVerdict | null
  myProfile: Profile | null
  myRole: PlayerRole | null
}