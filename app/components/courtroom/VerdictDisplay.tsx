'use client'

import { useEffect, useState } from 'react'
import { Button } from '../ui/Button'
import { Avatar } from '../ui/Avatar'
import { type PlayerRole } from '../../types/game'

interface VerdictDisplayProps {
  room: any
  profiles: any[]
  arguments: any[]
  votes: any[]
  judgeVerdict: any | null
  myProfile: any | null
  myRole: PlayerRole | null
}

export default function VerdictDisplay({
  room,
  profiles,
  arguments,
  votes,
  judgeVerdict,
  myProfile,
  myRole
}: VerdictDisplayProps) {
  const [showNewGameButton, setShowNewGameButton] = useState(false)

  // Find prosecutor's argument
  const prosecutorArgument = arguments.find(arg => 
    arg.phase === 'accusation' && arg.player_id === room.prosecutor_id
  )
  
  // Find defendant's argument
  const defendantArgument = arguments.find(arg => 
    arg.phase === 'defense' && arg.player_id === room.defendant_id
  )

  // Calculate vote distribution
  const guiltyVotes = votes.filter(v => v.vote === 'guilty').length
  const notGuiltyVotes = votes.filter(v => v.vote === 'not_guilty').length

  // Determine if we should show the new game button (after a small delay to show verdict)
  useEffect(() => {
    if (judgeVerdict) {
      const timer = setTimeout(() => {
        setShowNewGameButton(true)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [judgeVerdict])

  const handleNewGame = () => {
    // Reset the room to waiting state and clear arguments/votes/verdict
    // In a real app, we'd update the database, but for now we'll just refresh
    window.location.reload()
  }

  if (!judgeVerdict) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Waiting for AI Judge's Verdict...</h2>
          <div className="animate-pulse rounded-lg bg-zinc-800/50 w-32 h-32 flex items-center justify-center">
            <span className="text-zinc-400 font-bold">⚖️</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950">
      {/* Header */}
      <div className="bg-zinc-800/50 border-b border-zinc-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-gradient-to-r from-red-400 to-yellow-400 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">⚖️</span>
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-red-400 to-yellow-400 bg-clip-text text-transparent">
              Judgementia
            </h1>
          </div>
          <div className="text-xs text-zinc-400">
            Room: {room.room_code}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Crime Scenario */}
        <div className="bg-zinc-800/50 border-b border-zinc-700 px-6 py-4">
          <h2 className="text-xl font-semibold mb-2 text-center">The Case</h2>
          <p className="text-zinc-300 text-center italic max-w-2xl mx-auto">
            "{room.crime_scenario}"
          </p>
        </div>

        {/* Arguments Section */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* Prosecutor's Argument */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2 flex items-center space-x-2">
              <div className="h-8 w-8 bg-red-500/20 rounded-lg flex items-center justify-center">
                <span className="text-red-400 font-bold">📜</span>
              </div>
              The Prosecution's Argument
            </h2>
            {prosecutorArgument ? (
              <div className="bg-zinc-800/30 rounded-lg p-4">
                <p className="text-zinc-200 italic">
                  "{prosecutorArgument.content}"
                </p>
                <p className="mt-2 text-xs text-zinc-400 text-right">
                  — {profiles.find(p => p.id === prosecutorArgument.player_id)?.username || 'Unknown'}
                </p>
              </div>
            ) : (
              <p className="text-zinc-400 text-center">No prosecution argument submitted</p>
            )}
          </div>

          {/* Defendant's Argument */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2 flex items-center space-x-2">
              <div className="h-8 w-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <span className="text-blue-400 font-bold">🛡️</span>
              </div>
              The Defense's Argument
            </h2>
            {defendantArgument ? (
              <div className="bg-zinc-800/30 rounded-lg p-4">
                <p className="text-zinc-200 italic">
                  "{defendantArgument.content}"
                </p>
                <p className="mt-2 text-xs text-zinc-400 text-right">
                  — {profiles.find(p => p.id === defendantArgument.player_id)?.username || 'Unknown'}
                </p>
              </div>
            ) : (
              <p className="text-zinc-400 text-center">No defense argument submitted</p>
            )}
          </div>
        </div>

        {/* Vote Results */}
        <div className="bg-zinc-800/50 border-b border-zinc-700 px-6 py-4">
          <h2 className="text-xl font-semibold mb-4 text-center">Jury Vote Results</h2>
          <div className="text-center space-y-4">
            <div className="flex justify-between text-zinc-300">
              <span>Guilty:</span>
              <span className="font-mono text-red-400 text-2xl">{guiltyVotes}</span>
            </div>
            <div className="flex justify-between text-zinc-300">
              <span>Not Guilty:</span>
              <span className="font-mono text-blue-400 text-2xl">{notGuiltyVotes}</span>
            </div>
          </div>
        </div>

        {/* AI Judge's Verdict */}
        <div className="bg-zinc-800/50 border-b border-zinc-700 px-6 py-4">
          <h2 className="text-xl font-semibold mb-4 text-center">The AI Judge's Verdict</h2>
          <div className="relative overflow-hidden bg-zinc-800 rounded-lg p-6">
            {/* Animated gavel effect */}
            <div className="absolute -top-4 -right-4 w-20 h-20 bg-yellow-400/20 rounded-full flex items-center justify-center pointer-events-none">
              <span className="text-yellow-500 text-5x transform rotate-45">🔨</span>
            </div>
            
            <div className="relative z-10 space-y-4">
              <div className={`text-3xl font-bold text-center mb-4 ${
                judgeVerdict.verdict === 'guilty' ? 'text-red-400' : 'text-blue-400'
              }`}
              >
                {judgeVerdict.verdict.toUpperCase()}
              </div>
              
              {judgeVerdict.verdict === 'guilty' && judgeVerdict.punishment && (
                <div className="text-zinc-300 italic">
                  <p className="mb-2">Punishment:</p>
                  <p className="text-yellow-400 font-medium">"{judgeVerdict.punishment}"</p>
                </div>
              )}
              
              {judgeVerdict.reasoning && (
                <div className="text-zinc-300">
                  <p className="mb-2">Reasoning:</p>
                  <p className="whitespace-pre-line">{judgeVerdict.reasoning}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Participants */}
        <div className="bg-zinc-800/50 border-t border-zinc-700 px-6 py-4">
          <h2 className="text-xl font-semibold mb-4 text-center">Participants</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-zinc-700/50 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-2 text-red-400">📜 Prosecutor</h3>
              <p className="text-zinc-300">
                {profiles.find(p => p.id === room.prosecutor_id)?.username || 'Not Assigned'}
              </p>
            </div>
            <div className="bg-zinc-700/50 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-2 text-blue-400">🛡️ Defendant</h3>
              <p className="text-zinc-300">
                {profiles.find(p => p.id === room.defendant_id)?.username || 'Not Assigned'}
              </p>
            </div>
            <div className="bg-zinc-700/50 rounded-lg p-4 col-span-2">
              <h3 className="text-lg font-semibold mb-2 text-zinc-400">👥 Jury ({profiles.filter(p => p.role === 'jury').length})</h3>
              <div className="flex flex-wrap gap-2">
                {profiles
                  .filter(p => p.role === 'jury')
                  .map(profile => (
                    <Avatar 
                      key={profile.id} 
                      name={profile.username} 
                      size={32} 
                      className="flex-shrink-0"
                    />
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer - New Game Button */}
      {showNewGameButton && (
        <div className="bg-zinc-800/50 border-t border-zinc-700 px-6 py-4">
          <Button 
            onClick={handleNewGame}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-3"
          >
            Play Again
          </Button>
        </div>
      )}
    </div>
  )
}