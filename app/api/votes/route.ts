import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const { roomId, juryMemberId, vote } = await request.json()

    if (!roomId || !juryMemberId || !vote) {
      return NextResponse.json(
        { error: 'Missing required fields: roomId, juryMemberId, and vote' },
        { status: 400 }
      )
    }

    if (vote !== 'guilty' && vote !== 'not_guilty') {
      return NextResponse.json(
        { error: 'Vote must be either "guilty" or "not_guilty"' },
        { status: 400 }
      )
    }

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

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error submitting vote:', error)
    return NextResponse.json(
      { error: 'Failed to submit vote' },
      { status: 500 }
    )
  }
}