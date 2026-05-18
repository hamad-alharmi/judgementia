import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const roomId = searchParams.get('roomId')

    if (!roomId) {
      return NextResponse.json(
        { error: 'Missing required parameter: roomId' },
        { status: 400 }
      )
    }

    // Get room state
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

    return NextResponse.json({
      room: roomResult.data,
      profiles: profiles,
      arguments: argumentsResult.data || [],
      votes: votesResult.data || [],
      judgeVerdict: verdictResult.data || null
    })
  } catch (error) {
    console.error('Error fetching room state:', error)
    return NextResponse.json(
      { error: 'Failed to fetch room state' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const { roomId, status } = await request.json()

    if (!roomId || !status) {
      return NextResponse.json(
        { error: 'Missing required fields: roomId and status' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('rooms')
      .update({ status })
      .eq('id', roomId)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error updating room status:', error)
    return NextResponse.json(
      { error: 'Failed to update room status' },
      { status: 500 }
    )
  }
}