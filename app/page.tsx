'use client'

import { supabase } from './lib/supabase'
import { useState, useEffect } from 'react'
import { Button } from './components/ui/Button'
import { Input } from './components/ui/Input'
import { CreateRoomBtn } from './components/lobby/CreateRoomBtn'
import { RoomCodeInput } from './components/lobby/RoomCodeInput'

export default function Home() {
  const [username, setUsername] = useState('')
  const [roomCode, setRoomCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Generate a random username if not provided
  useEffect(() => {
    if (!username) {
      const randomName = `Player_${Math.floor(Math.random() * 1000)}`
      setUsername(randomName)
    }
  }, [username])

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      // Sign in anonymously to get a user ID
      const { data: authData, error: authError } = await supabase.auth.signInAnonymously()
      if (authError) throw authError

      const userId = authData.user.id

      // Create profile
      await supabase.from('profiles').upsert({
        id: userId,
        username,
        role: null
      })

      // Create room
      const crimeScenario = generateCrimeScenario()
      const room = await supabase
        .from('rooms')
        .insert([
          {
            room_code: Math.random().toString(36).substring(2, 8).toUpperCase(),
            created_by: userId,
            crime_scenario: crimeScenario,
            status: 'waiting'
          }
        ])
        .select()
        .single()

      if (room.error) throw room.error

      // Update profile with current room
      await supabase
        .from('profiles')
        .update({ current_room_id: room.data.id })
        .eq('id', userId)

      // Redirect to room
      window.location.href = `/room/${room.data.id}`
    } catch (err: any) {
      setError(err.message || 'Failed to create room')
    } finally {
      setLoading(false)
    }
  }

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      // Sign in anonymously to get a user ID
      const { data: authData, error: authError } = await supabase.auth.signInAnonymously()
      if (authError) throw authError

      const userId = authData.user.id

      // Create profile
      await supabase.from('profiles').upsert({
        id: userId,
        username,
        role: null
      })

      // Find room by code
      const { data: room, error: roomError } = await supabase
        .from('rooms')
        .select('id, status')
        .eq('room_code', roomCode.toUpperCase())
        .single()

      if (roomError) throw roomError
      if (!room) throw new Error('Room not found')

      // Join room
      await supabase
        .from('profiles')
        .update({ current_room_id: room.id })
        .eq('id', userId)

      // Redirect to room
      window.location.href = `/room/${room.id}`
    } catch (err: any) {
      setError(err.message || 'Failed to join room')
    } finally {
      setLoading(false)
    }
  }

  const generateCrimeScenario = () => {
    const scenarios = [
      "The Defendant is accused of putting pineapples on pizza in a Michelin-star Italian restaurant",
      "The Defendant is accused of teaching squirrels to steal shiny objects from tourists",
      "The Defendant is accused of replacing all the sugar in a café with salt",
      "The Defendant is accused of organizing a flash mob of people yelling memes in a library",
      "The Defendant is accused of using a formal dinner fork to eat soup",
      "The Defendant is accused of negotiating with pigeons for better breadcrumbs",
      "The Defendant is accused of altering traffic light patterns to create smiley faces",
      "The Defendant is accused of substituting diplomacy tools with interpretive dance"
    ]
    return scenarios[Math.floor(Math.random() * scenarios.length)]
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 p-6">
      <h1 className="text-4xl font-bold text-center mb-8 bg-gradient-to-r from-red-400 to-yellow-400 bg-clip-text text-transparent">
        Judgementia
      </h1>
      <p className="text-center text-zinc-400 mb-12 max-w-xl">
        A real-time multiplayer courtroom game where AI judges the absurd
      </p>

      <div className="w-full max-w-md space-y-6">
        <form onSubmit={handleCreateRoom} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-zinc-300 mb-2">
              Your Name
            </label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your name"
              className="w-full"
              autoFocus
            />
          </div>
          <Button type="submit" className="w-full bg-gradient-to-r from-red-500 to-yellow-500 hover:from-red-600 hover:to-yellow-600 text-white font-bold py-3 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Creating room...' : 'Create New Room'}
          </Button>
        </form>

        <form onSubmit={handleJoinRoom} className="space-y-4">
          <div>
            <label htmlFor="roomCode" className="block text-sm font-medium text-zinc-300 mb-2">
              Room Code
            </label>
            <Input
              id="roomCode"
              type="text"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value)}
              placeholder="Enter room code"
              className="w-full"
              autoComplete="off"
            />
          </div>
          <Button type="submit" className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-bold py-3 disabled:opacity-50"
            disabled={loading || !roomCode.trim()}
          >
            {loading ? 'Joining room...' : 'Join Room'}
          </Button>
          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}
        </form>
      </div>

      <div className="mt-8 text-xs text-zinc-500">
        <p>Room codes are 6-character uppercase codes. Create a room to get one!</p>
      </div>
    </div>
  )
}