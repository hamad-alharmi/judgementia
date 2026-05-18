'use client'

import { useState, useEffect } from 'react'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Timer } from '../ui/Timer'
import { Avatar } from '../ui/Avatar'
import { type PlayerRole } from '../../types/game'

interface DefensePhaseProps {
  room: any
  profiles: any[]
  arguments: any[]
  myProfile: any | null
  myRole: PlayerRole | null
  onSubmitArgument: (content: string) => Promise<void>
  onStartJury: () => Promise<void>
  isDefendant: boolean
}

export default function DefensePhase({
  room,
  profiles,
  arguments,
  myProfile,
  myRole,
  onSubmitArgument,
  onStartJury,
  isDefendant
}: DefensePhaseProps) {
  const [argument, setArgument] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [timerStarted, setTimerStarted] = useState(false)
  const [timeLeft, setTimeLeft] = useState(60)

  // Find defendant profile
  const defendantProfile = profiles.find(p => 
    p.id === room.defendant_id
  )

  // Find prosecutor's argument
  const prosecutorArgument = arguments.find(arg => 
    arg.phase === 'accusation' && arg.player_id === room.prosecutor_id
  )

  useEffect(() => {
    if (isDefendant && !timerStarted) {
      setTimerStarted(true)
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer)
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [isDefendant, timerStarted])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!argument.trim() || submitting) return
    
    setSubmitting(true)
    try {
      await onSubmitArgument(argument)
      setArgument('')
    } catch (err) {
      console.error('Failed to submit argument:', err)
    } finally {
      setSubmitting(false)
    }
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

        {/* Timer and Roles */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* Prosecutor's Argument Section */}
          <div className="mb-8">
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
              <p className="text-zinc-400 text-center">Waiting for the prosecution's argument...</p>
            )}
          </div>

          {/* Defendant Section */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-2 flex items-center space-x-2">
              <div className="h-8 w-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <span className="text-blue-400 font-bold">🛡️</span>
              </div>
              The Defense
            </h2>
            <div className="flex items-center space-x-4">
              {defendantProfile ? (
                <>
                  <Avatar 
                    name={defendantProfile.username} 
                    size={40} 
                    className="flex-shrink-0"
                  />
                  <div>
                    <p className="font-medium text-zinc-100">{defendantProfile.username}</p>
                    <p className="text-xs text-zinc-400">
                      {defendantProfile.id === myProfile?.id ? '(You)' : ''}
                    </p>
                  </div>
                </>
              ) : (
                <p className="text-zinc-400">Waiting for defendant...</p>
              )}
            </div>
          </div>

          {/* Timer */}
          {isDefendant && (
            <div className="text-center mb-6">
              <div className="inline-block bg-zinc-800 rounded-lg px-4 py-2">
                <Timer 
                  seconds={timeLeft} 
                  onEnd={() => {
                    // Auto-submit empty argument or move to next phase when timer ends
                    if (!argument.trim()) {
                      // Could auto-submit or just move on
                    }
                  }} 
                />
              </div>
              <p className="mt-2 text-sm text-zinc-400">
                Time to submit your defense
              </p>
            </div>
          )}

          {/* Argument Submission Form */}
          {!isDefendant && (
            <div className="text-center py-8">
              <p className="text-zinc-400">
                Waiting for the defendant to submit their argument...
              </p>
            </div>
          )}

          {isDefendant && (
            <form onSubmit={handleSubmit} className="mt-8">
              <div className="mb-4">
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Your Defense
                </label>
                <textarea
                  value={argument}
                  onChange={(e) => setArgument(e.target.value)}
                  placeholder="Explain why your actions were justified..."
                  className={`
                    w-full min-h-[100px] resize-y rounded-md border border-zinc-700
                    bg-zinc-800/50 px-4 py-2 text-zinc-100 text-sm
                    focus:outline-none focus:ring-2 focus:ring-zinc-600
                    placeholder:text-zinc-400
                  `}
                  disabled={submitting}
                  maxLength={500}
                />
                <p className={`
                  mt-1 text-sm 
                  ${submitting ? 'text-zinc-400' : 'text-zinc-500'}
                `}>
                  {argument.length}/500 characters
                </p>
              </div>
              
              <Button 
                type="submit" 
                disabled={submitting || !argument.trim()}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-bold py-3"
                loading={submitting}
              >
                {submitting ? 'Submitting...' : 'Submit Defense'}
              </Button>
            </form>
          )}
        </div>
      </div>

      {/* Footer - Move to Next Phase */}
      {!isDefendant && (
        <div className="bg-zinc-800/50 border-t border-zinc-700 px-6 py-4">
          <Button 
            onClick={onStartJury}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-3"
          >
            Start Jury Deliberation
          </Button>
        </div>
      )}
    </div>
  )
}