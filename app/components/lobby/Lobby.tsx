'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { type PlayerRole } from '@/types/game'

interface LobbyProps {
  room: any
  profiles: any[]
  myProfile: any | null
  myRole: PlayerRole | null
  onStartAccusation: () => Promise<void>
}

export default function Lobby({
  room,
  profiles,
  myProfile,
  myRole,
  onStartAccusation
}: LobbyProps) {
  const [showStartButton, setShowStartButton] = useState(false)

  // Show start button only if user is creator and we have at least 3 players
  useEffect(() => {
    if (myProfile?.id === room.created_by && profiles.length >= 3) {
      setShowStartButton(true)
    } else {
      setShowStartButton(false)
    }
  }, [myProfile, room.created_by, profiles.length])

  const handleStartGame = async () => {
    try {
      await onStartAccusation()
    } catch (err) {
      console.error('Failed to start game:', err)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 p-6">
      <div className="w-full max-w-4xl space-y-8">
        <div className="flex items-center space-x-4">
          <div className="h-12 w-12 bg-gradient-to-r from-red-400 to-yellow-400 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">⚖️</span>
          </div>
          <h1 className="text-3xl font-bold text-center bg-gradient-to-r from-red-400 to-yellow-400 bg-clip-text text-transparent">
            Judgementia
          </h1>
        </div>

        <div className="bg-zinc-800/50 rounded-xl p-6 border border-zinc-700">
          <h2 className="text-2xl font-semibold mb-4 text-center">Room Code: <span className="text-yellow-400 font-mono">{room.room_code}</span></h2>
          
          <div className="space-y-4">
            <p className="text-zinc-400 text-center">
              Waiting for players... <span className="text-yellow-400">{profiles.length}</span>/∞
            </p>
            
            <div className="grid grid-cols-2 gap-4">
              {profiles.map(profile => (
                <div key={profile.id} className="flex items-center space-x-3 bg-zinc-700/50 p-3 rounded-lg">
                  <Avatar 
                    name={profile.username} 
                    size={32} 
                    className="flex-shrink-0"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-zinc-100">{profile.username}</p>
                    <p className="text-xs text-zinc-400">
                      {profile.id === myProfile?.id ? '(You)' : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-zinc-800/50 rounded-xl p-6 border border-zinc-700">
          <h2 className="text-xl font-semibold mb-4 text-center">Game Overview</h2>
          <div className="space-y-3 text-zinc-300 text-center">
            <p>👥 One Prosecutor, one Defendant, rest as Jury</p>
            <p>⚖️ Central AI Judge presides over the case</p>
            <p>📝 Ridiculous crime scenario generated automatically</p>
            <p>⏱️ 60 seconds per phase for arguments</p>
            <p>🗳️ Real-time voting by Jury</p>
            <p>🤖 AI Judge delivers theatrical verdict</p>
          </div>
        </div>

        {showStartButton && (
          <div className="flex justify-center">
            <Button 
              onClick={handleStartGame}
              className="bg-gradient-to-r from-red-500 to-yellow-500 hover:from-red-600 hover:to-yellow-600 text-white font-bold py-3 px-8"
            >
              Start Game (As Creator)
            </Button>
          </div>
        )}

        {!showStartButton && myProfile?.id === room.created_by && (
          <p className="text-center text-zinc-400">
            Need at least 3 players to start the game
          </p>
        )}

        {!showStartButton && myProfile?.id !== room.created_by && (
          <p className="text-center text-zinc-400">
            Waiting for the room creator to start the game...
          </p>
        )}
      </div>
    </div>
  )
}