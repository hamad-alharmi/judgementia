'use client'

import { useState, useEffect } from 'react'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Timer } from '../ui/Timer'
import { Avatar } from '../ui/Avatar'
import { type PlayerRole } from '../../types/game'

interface AccusationPhaseProps {
  room: any
  profiles: any[]
  arguments: any[]
  myProfile: any | null
  myRole: PlayerRole | null
  onSubmitArgument: (content: string) => Promise<void>
  onStartDefense: () => Promise<void>
  isProsecutor: boolean
}

export default function AccusationPhase({
  room,
  profiles,
  arguments,
  myProfile,
  myRole,
  onSubmitArgument,
  onStartDefense,
  isProsecutor
}: AccusationPhaseProps) {
  const [argument, setArgument] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [timerStarted, setTimerStarted] = useState(false)
  const [timeLeft, setTimeLeft] = useState(60)

  // Find prosecutor profile
  const prosecutorProfile = profiles.find(p => 
    p.id === room.prosecutor_id
  )

  useEffect(() => {
    if (isProsecutor && !timerStarted) {
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
  }, [isProsecutor, timerStarted])

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
          {/* Prosecutor Section */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-2 flex items-center space-x-2">
              <div className="h-8 w-8 bg-red-500/20 rounded-lg flex items-center justify-center">
                <span className="text-red-400 font-bold">📜</span>
              </div>
              The Prosecution
            </h2>
            <div className="flex items-center space-x-4">
              {prosecutorProfile ? (
                <>
                  <Avatar 
                    name={prosecutorProfile.username} 
                    size={40} 
                    className="flex-shrink-0"
                  />
                  <div>
                    <p className="font-medium text-zinc-100">{prosecutorProfile.username}</p>
                    <p className="text-xs text-zinc-400">
                      {prosecutorProfile.id === myProfile?.id ? '(You)' : ''}
                    </p>
                  </div>
                </>
              ) : (
                <p className="text-zinc-400">Waiting for prosecutor...</p>
              )}
            </div>
          </div>

          {/* Timer */}
          {isProsecutor && (
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
                Time to submit your opening argument
              </p>
            </div>
          )}

          {/* Argument Submission Form */}
          {!isProsecutor && (
            <div className="text-center py-8">
              <p className="text-zinc-400">
                Waiting for the prosecutor to submit their argument...
              </p>
            </div>
          )}

          {isProsecutor && (
            <form onSubmit={handleSubmit} className="mt-8">
              <div className="mb-4">
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Your Opening Argument
                </label>
                <textarea
                  value={argument}
                  onChange={(e) => setArgument(e.target.value)}
                  placeholder="Explain why the defendant is guilty..."
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
                className="w-full bg-gradient-to-r from-red-500 to-yellow-500 hover:from-red-600 hover:to-yellow-600 text-white font-bold py-3"
                loading={submitting}
              >
                {submitting ? 'Submitting...' : 'Submit Argument'}
              </Button>
            </form>
          )}
        </div>
      </div>

      {/* Footer - Move to Next Phase */}
      {!isProsecutor && (
        <div className="bg-zinc-800/50 border-t border-zinc-700 px-6 py-4">
          <Button 
            onClick={onStartDefense}
            className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-bold py-3"
          >
            Start Defense Phase
          </Button>
        </div>
      )}
    </div>
  )
}