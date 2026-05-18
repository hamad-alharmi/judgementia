import { supabase } from '@/lib/supabase'

export async function createRoom(
  createdBy: string,
  crimeScenario: string
) {
  const { data, error } = await supabase
    .from('rooms')
    .insert([
      {
        room_code: Math.random().toString(36).substring(2, 8).toUpperCase(),
        created_by: createdBy,
        crime_scenario: crimeScenario,
        status: 'waiting'
      }
    ])
    .select()
    .single()

  if (error) throw error
  return data
}

export async function joinRoom(roomCode: string, playerId: string) {
  const { data: room, error: roomError } = await supabase
    .from('rooms')
    .select('id, status')
    .eq('room_code', roomCode)
    .single()

  if (roomError) throw roomError
  if (!room) throw new Error('Room not found')

  // Add player to room_members with initial role (will be assigned later)
  const { data, error } = await supabase
    .from('room_members')
    .insert([
      {
        room_id: room.id,
        profile_id: playerId,
        role: 'jury' // Default role, will be updated based on room needs
      }
    ])
    .select()
    .single()

  if (error) throw error
  return { room, member: data }
}

export async function startAccusationPhase(roomId: string) {
  const { data, error } = await supabase
    .from('rooms')
    .update({ status: 'accusation' })
    .eq('id', roomId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function startDefensePhase(roomId: string) {
  const { data, error } = await supabase
    .from('rooms')
    .update({ status: 'defense' })
    .eq('id', roomId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function startJuryPhase(roomId: string) {
  const { data, error } = await supabase
    .from('rooms')
    .update({ status: 'jury' })
    .eq('id', roomId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function submitArgument(
  roomId: string,
  playerId: string,
  phase: 'accusation' | 'defense',
  content: string
) {
  const { data, error } = await supabase
    .from('arguments')
    .insert([
      {
        room_id: roomId,
        player_id: playerId,
        phase,
        content
      }
    ])
    .select()
    .single()

  if (error) throw error
  return data
}

export async function submitVote(
  roomId: string,
  juryMemberId: string,
  vote: 'guilty' | 'not_guilty'
) {
  const { data, error } = await supabase
    .from('votes')
    .upsert(
      {
        room_id: roomId,
        jury_member_id: juryMemberId,
        vote
      },
      { onConflict: ['room_id', 'jury_member_id'] }
    )
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getRoomState(roomId: string) {
  const [roomResult, membersResult, argumentsResult, votesResult, verdictResult] =
    await Promise.all([
      supabase.from('rooms').select('*').eq('id', roomId).single(),
      supabase.from('room_members').select('*, profiles(*)').eq('room_id', roomId),
      supabase.from('arguments').select('*').eq('room_id', roomId),
      supabase.from('votes').select('*').eq('room_id', roomId),
      supabase.from('judge_verdicts').select('*').eq('room_id', roomId).single()
    ])

  if (roomResult.error) throw roomResult.error

  // Extract profiles from room_members
  const profiles = membersResult.data?.map((member: any) => member.profiles) || []

  return {
    room: roomResult.data,
    profiles: profiles,
    arguments: argumentsResult.data || [],
    votes: votesResult.data || [],
    judgeVerdict: verdictResult.data || null
  }
}

export async function assignRoles(roomId: string) {
  // Get all members of the room
  const { data: members, error } = await supabase
    .from('room_members')
    .select('id, profile_id')
    .eq('room_id', roomId)

  if (error) throw error
  if (!members || members.length === 0) throw new Error('No members in room')

  // Assign roles: first member as prosecutor, second as defendant, rest as jury
  const updates = members.map((member, index) => {
    let role: 'prosecutor' | 'defendant' | 'jury'
    if (index === 0) role = 'prosecutor'
    else if (index === 1) role = 'defendant'
    else role = 'jury'

    return supabase
      .from('room_members')
      .update({ role })
      .eq('id', member.id)
  })

  const results = await Promise.all(updates)
  const errors = results.map(r => r.error).filter((e): e is Error => e !== null)
  if (errors.length > 0) throw new Error('Failed to assign roles')

  return results.map(r => r.data)
}

export async function deliverVerdict(
  roomId: string,
  verdict: 'guilty' | 'not_guilty',
  punishment: string | null,
  reasoning: string | null,
  voteDistribution: { guilty: number; not_guilty: number }
) {
  const { data, error } = await supabase
    .from('judge_verdicts')
    .insert([
      {
        room_id: roomId,
        verdict,
        punishment,
        reasoning,
        vote_distribution: voteDistribution
      }
    ])
    .select()
    .single()

  if (error) throw error
  return data
}