'use client'

import { supabase } from './lib/supabase'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from './components/ui/Button'
import { createRoom, joinRoom, startAccusationPhase, startDefensePhase, startJuryPhase, submitArgument, submitVote, getRoomState, assignRoles, deliverVerdict } from './lib/actions'
import AccusationPhase from './components/courtroom/AccusationPhase'
import DefensePhase from './components/courtroom/DefensePhase'
import JuryDeliberation from './components/courtroom/JuryDeliberation'
import VerdictDisplay from './components/courtroom/VerdictDisplay'
import Lobby from './components/lobby/Lobby'
import { type GameState, type PlayerRole } from './types/game'

export default function Room() {
  const { roomId } = useParams<{ roomId: string }>()
  const router = useRouter()
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [myProfileId, setMyProfileId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!roomId) {
      router.push('/')
      return
    }

    // Get anonymous user ID for this session
    const getProfileId = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        setMyProfileId(session.user.id)
        initializeRoom()
      } else {
        // Sign in anonymously
        const { data: authData, error: authError } = await supabase.auth.signInAnonymously()
        if (authError) {
          setError('Failed to authenticate')
          setLoading(false)
          return
        }
        setMyProfileId(authData.user.id)
        initializeRoom()
      }
    }

    getProfileId()
  }, [roomId, router])

  const initializeRoom = async () => {
    if (!myProfileId) return

    try {
      setLoading(true)
      setError(null)

      // Check if profile exists, if not create it
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', myProfileId)
        .single()

      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError
      }

      if (!profileData) {
        // Create profile if it doesn't exist
        await supabase
          .from('profiles')
          .upsert({
            id: myProfileId,
            username: `Player_${Math.floor(Math.random() * 1000)}`,
            avatar_url: null
          })
      }

      // Join room
      const { data: roomData, error: roomError } = await supabase
        .from('rooms')
        .select('id')
        .eq('id', roomId)
        .single()

      if (roomError) throw roomError
      if (!roomData) {
        setError('Room not found')
        setLoading(false)
        return
      }

      // Add to room_members if not already there
      const { data: memberData, error: memberError } = await supabase
        .from('room_members')
        .select('id')
        .eq('room_id', roomId)
        .eq('profile_id', myProfileId)
        .maybeSingle()

      if (memberError && memberError.code !== 'PGRST116') {
        throw memberError
      }

      if (!memberData) {
        await supabase
          .from('room_members')
          .insert({
            room_id: roomId,
            profile_id: myProfileId,
            role: 'jury' // Default role
          })
      }

      // Load initial game state
      await loadGameState()

      // Subscribe to realtime updates
      const roomChannel = supabase
        .channel(`room:${roomId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms' }, () => {
          loadGameState()
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'room_members' }, () => {
          loadGameState()
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'arguments' }, () => {
          loadGameState()
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'votes' }, () => {
          loadGameState()
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'judge_verdicts' }, () => {
          loadGameState()
        })
        .subscribe()

      // Cleanup on unmount
      return () => {
        supabase.removeChannel(roomChannel)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to initialize room')
      setLoading(false)
    }
  }

  const loadGameState = async () => {
    if (!myProfileId) return

    try {
      const state = await getRoomState(roomId)
      
      // Get current user's profile and role
      const myProfile = state.profiles.find(p => p.id === myProfileId)
      
      setGameState({
        ...state,
        myProfile: myProfile || null
      })
    } catch (err) {
      console.error('Failed to load game state:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleStartAccusation = async () => {
    try {
      setLoading(true)
      await startAccusationPhase(roomId)
      await assignRoles(roomId)
      await loadGameState()
    } catch (err: any) {
      setError(err.message || 'Failed to start accusation phase')
    } finally {
      setLoading(false)
    }
  }

  const handleStartDefense = async () => {
    try {
      setLoading(true)
      await startDefensePhase(roomId)
      await loadGameState()
    } catch (err: any) {
      setError(err.message || 'Failed to start defense phase')
    } finally {
      setLoading(false)
    }
  }

  const handleStartJury = async () => {
    try {
      setLoading(true)
      await startJuryPhase(roomId)
      await loadGameState()
    } catch (err: any) {
      setError(err.message || 'Failed to start jury phase')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitArgument = async (content: string) => {
    if (!myProfileId) return
    
    try {
      setLoading(true)
      // Determine phase based on room status
      const phase = gameState?.room?.status === 'accusation' ? 'accusation' : 'defense'
      await submitArgument(roomId, myProfileId, phase, content)
      await loadGameState()
    } catch (err: any) {
      setError(err.message || 'Failed to submit argument')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitVote = async (vote: 'guilty' | 'not_guilty') => {
    if (!myProfileId) return
    
    try {
      setLoading(true)
      await submitVote(roomId, myProfileId, vote)
      await loadGameState()
    } catch (err: any) {
      setError(err.message || 'Failed to submit vote')
    } finally {
      setLoading(false)
    }
  }

  const handleDeliverVerdict = async (
    verdict: 'guilty' | 'not_guilty',
    punishment: string | null,
    reasoning: string | null,
    voteDistribution: { guilty: number; not_guilty: number }
  ) => {
    try {
      setLoading(true)
      await deliverVerdict(roomId, verdict, punishment, reasoning, voteDistribution)
      await loadGameState()
    } catch (err: any) {
      setError(err.message || 'Failed to deliver verdict')
    } finally {
      setLoading(false)
    }
  }

  if (loading || !gameState) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="animate-pulse rounded-md bg-zinc-800 px-6 py-4">
          <h2 className="text-center text-zinc-400">Loading room...</h2>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-6">
        <div className="rounded-md bg-destructive/20 px-6 py-4 w-full max-w-md">
          <h2 className="text-center text-destructive mb-4">Error</h2>
          <p className="text-center text-zinc-300">{error}</p>
          <Button 
            variant="outline" 
            onClick={() => router.push('/')}
            className="w-full mt-4"
          >
            Return to Home
          </Button>
        </div>
      </div>
    )
  }

  const { room, profiles, arguments, votes, judgeVerdict, myProfile } = gameState
  const myRole = myProfile ? 
    profiles.find(p => p.id === myProfileId)?.role || null : 
    null

  // Determine which component to render based on room status and user role
  switch (room.status) {
    case 'waiting':
      return <Lobby 
        room={room} 
        profiles={profiles} 
        myProfile={myProfile} 
        myRole={myRole as PlayerRole | null}
        onStartAccusation={handleStartAccusation}
      />
    case 'accusation':
      return <AccusationPhase 
        room={room} 
        profiles={profiles} 
        arguments={arguments}
        myProfile={myProfile} 
        myRole={myRole as PlayerRole | null}
        onSubmitArgument={handleSubmitArgument}
        onStartDefense={handleStartDefense}
        isProsecutor={myRole === 'prosecutor'}
      />
    case 'defense':
      return <DefensePhase 
        room={room} 
        profiles={profiles} 
        arguments={arguments}
        myProfile={myProfile} 
        myRole={myRole as PlayerRole | null}
        onSubmitArgument={handleSubmitArgument}
        onStartJury={handleStartJury}
        isDefendant={myRole === 'defendant'}
      />
    case 'jury':
      return <JuryDeliberation 
        room={room} 
        profiles={profiles} 
        arguments={arguments}
        votes={votes}
        myProfile={myProfile} 
        myRole={myRole as PlayerRole | null}
        onSubmitVote={handleSubmitVote}
        onDeliverVerdict={handleDeliverVerdict}
        isJury={myRole === 'jury'}
      />
    case 'verdict':
    case 'finished':
      return <VerdictDisplay 
        room={room} 
        profiles={profiles} 
        arguments={arguments}
        votes={votes}
        judgeVerdict={judgeVerdict}
        myProfile={myProfile} 
        myRole={myRole as PlayerRole | null}
      />
    default:
      return <div>Unknown room status</div>
  }
}