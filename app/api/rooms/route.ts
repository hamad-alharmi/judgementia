import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const { createdBy, crimeScenario } = await request.json()

    if (!createdBy || !crimeScenario) {
      return NextResponse.json(
        { error: 'Missing required fields: createdBy and crimeScenario' },
        { status: 400 }
      )
    }

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

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error creating room:', error)
    return NextResponse.json(
      { error: 'Failed to create room' },
      { status: 500 }
    )
  }
}