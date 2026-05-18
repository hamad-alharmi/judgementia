'use client'

import { useState, useEffect } from 'react'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Avatar } from '../ui/Avatar'
import { type PlayerRole } from '../../types/game'

interface JuryDeliberationProps {
  room: any
  profiles: any[]
  arguments: any[]
  votes: any[]
  myProfile: any | null
  myRole: PlayerRole | null
  onSubmitVote: (vote: 'guilty' | 'not_guilty') => Promise<void>
  onDeliverVerdict: (
    verdict: 'guilty' | 'not_guilty',
    punishment: string | null,
    reasoning: string | null,
    voteDistribution: { guilty: number; not_guilty: number }
  ) => Promise<void>
  isJury: boolean
}

export default function JuryDeliberation({
  room,
  profiles,
  arguments,
  votes,
  myProfile,
  myRole,
  onSubmitVote,
  onDeliverVerdict,
  isJury
}: JuryDeliberationProps) {
  const [vote, setVote] = useState<'guilty' | 'not_guilty' | null>(null)
  const [submittingVote, setSubmittingVote] = useState(false)
  const [showVerdictControls, setShowVerdictControls] = useState(false)
  const [verdict, setVerdict] = useState<'guilty' | 'not_guilty' | null>(null)
  const [punishment, setPunishment] = useState('')
  const [reasoning, setReasoning] = useState('')
  const [submittingVerdict, setSubmittingVerdict] = useState(false)

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
  const totalVotes = guiltyVotes + notGuiltyVotes
  const juryMembers = profiles.filter(p => p.role === 'jury').length
  const allVoted = totalVotes >= juryMembers && juryMembers > 0

  // Find user's vote
  const myVote = votes.find(v => v.jury_member_id === myProfile?.id)?.vote || null

  useEffect(() => {
    if (myProfile && myRole === 'jury') {
      setVote(myVote || null)
    }
  }, [myProfile, myRole, myVote])

  const handleVote = async (selectedVote: 'guilty' | 'not_guilty') => {
    setSubmittingVote(true)
    try {
      await onSubmitVote(selectedVote)
      setVote(selectedVote)
    } catch (err) {
      console.error('Failed to submit vote:', err)
    } finally {
      setSubmittingVote(false)
    }
  }

  const handleDeliverVerdict = async () => {
    if (!verdict || !punishment.trim()) return
    
    setSubmittingVerdict(true)
    try {
      await onDeliverVerdict(
        verdict,
        punishment.trim(),
        reasoning.trim(),
        { guilty: guiltyVotes, not_guilty: notGuiltyVotes }
      )
    } catch (err) {
      console.error('Failed to deliver verdict:', err)
    } finally {
      setSubmittingVerdict(false)
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

        {/* Voting Section (for Jury) or Results (for others) */}
        {myRole === 'jury' ? (
          <>
            {/* User Voting */}
            {!vote && (
              <div className="bg-zinc-800/50 rounded-xl p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4 text-center">Cast Your Vote</h2>
                <div className="grid grid-cols-2 gap-4">
                  <Button 
                    onClick={() => handleVote('guilty')}
                    disabled={submittingVote}
                    className={`bg-gradient-to-r from-red-500 to-yellow-500 hover:from-red-600 hover:to-yellow-600 text-white font-bold py-3 ${
                      submittingVote ? 'opacity-50' : ''
                    }`}
                  >
                    {submittingVote ? 'Submitting...' : 'GUILTY'}
                  </Button>
                  <Button 
                    onClick={() => handleVote('not_guilty')}
                    disabled={submittingVote}
                    className={`bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-bold py-3 ${
                      submittingVote ? 'opacity-50' : ''
                    }`}
                  >
                    {submittingVote ? 'Submitting...' : 'NOT GUILTY'}
                  </Button>
                </div>
                {vote && (
                  <p className="mt-4 text-center text-zinc-300">
                    You voted: <span className="font-medium text-white">{vote.toUpperCase()}</span>
                  </p>
                )}
              </div>
            )}
            
            {/* Vote Status */}
            <div className="bg-zinc-800/50 rounded-xl p-6">
              <h2 className="text-xl font-semibold mb-4 text-center">Vote Status</h2>
              <div className="space-y-4">
                <div className="flex justify-between text-zinc-300">
                  <span>Guilty:</span>
                  <span className="font-mono">{guiltyVotes}</span>
                </div>
                <div className="flex justify-between text-zinc-300">
                  <span>Not Guilty:</span>
                  <span className="font-mono">{notGuiltyVotes}</span>
                </div>
                <div className="flex justify-between text-zinc-300">
                  <span>Total Votes:</span>
                  <span className="font-mono">{totalVotes}/{juryMembers}</span>
                </div>
                {allVoted && (
                  <div className="mt-4 p-3 bg-zinc-700/50 rounded-lg">
                    <p className="text-center text-zinc-300 font-medium">
                      All votes have been cast!
                    </p>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <>
            {/* For non-jury members, show vote results */}
            {totalVotes > 0 && (
              <div className="bg-zinc-800/50 rounded-xl p-6">
                <h2 className="text-xl font-semibold mb-4 text-center">Vote Results</h2>
                <div className="space-y-4">
                  <div className="flex justify-between text-zinc-300">
                    <span>Guilty:</span>
                    <span className="font-mono text-red-400 text-2xl">{guiltyVotes}</span>
                  </div>
                  <div className="flex justify-between text-zinc-300">
                    <span>Not Guilty:</span>
                    <span className="font-mono text-blue-400 text-2xl">{notGuiltyVotes}</span>
                  </div>
                  <div className="flex justify-between text-zinc-300">
                    <span>Total Votes:</span>
                    <span className="font-mono">{totalVotes}/{juryMembers}</span>
                  </div>
                </div>
              </div>
            )}
            
            {/* Show deliver verdict button to room creator when all votes are in */}
            {myProfile?.id === room.created_by && allVoted && !showVerdictControls && (
              <div className="bg-zinc-800/50 rounded-xl p-6">
                <h2 className="text-xl font-semibold mb-4 text-center">Deliver Verdict</h2>
                <Button 
                  onClick={() => setShowVerdictControls(true)}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-3"
                >
                  AI Judge: Deliver Verdict
                </Button>
              </div>
            )}
          </>
        )}

        {/* Verdict Controls (shown when creator clicks "Deliver Verdict") */}
        {showVerdictControls && (
          <div className="bg-zinc-800/50 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4 text-center">AI Judge's Verdict</h2>
            <div className="space-y-4">
              <div className="mb-4">
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Verdict
                </label>
                <div className="flex space-x-3">
                  <Button 
                    onClick={() => {
                      setVerdict('guilty')
                      setPunishment('')
                      setReasoning('')
                    }}
                    className={`flex-1 bg-gradient-to-r from-red-500 to-yellow-500 hover:from-red-600 hover:to-yellow-600 text-white font-bold py-2 ${
                      verdict === 'guilty' ? 'opacity-80' : ''
                    }`}
                  >
                    GUILTY
                  </Button>
                  <Button 
                    onClick={() => {
                      setVerdict('not_guilty')
                      setPunishment('')
                      setReasoning('')
                    }}
                    className={`flex-1 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-bold py-2 ${
                      verdict === 'not_guilty' ? 'opacity-80' : ''
                    }`}
                  >
                    NOT GUILTY
                  </Button>
                </div>
              </div>
              
              {!verdict || verdict === 'guilty' && (
                <>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Punishment (if guilty)
                    </label>
                    <Input
                      type="text"
                      value={punishment}
                      onChange={(e) => setPunishment(e.target.value)}
                      placeholder="Enter an absurd punishment..."
                      className="w-full"
                      maxLength={100}
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Reasoning
                    </label>
                    <textarea
                      value={reasoning}
                      onChange={(e) => setReasoning(e.target.value)}
                      placeholder="Explain your reasoning as the AI Judge..."
                      className={`
                        w-full min-h-[80px] resize-y rounded-md border border-zinc-700
                        bg-zinc-800/50 px-4 py-2 text-zinc-100 text-sm
                        focus:outline-none focus:ring-2 focus:ring-zinc-600
                        placeholder:text-zinc-400
                      `}
                      maxLength={500}
                    />
                  </div>
                </>
              )}
              
              <div className="flex justify-end">
                <Button 
                  onClick={handleDeliverVerdict}
                  disabled={submittingVerdict || !verdict || (verdict === 'guilty' && !punishment.trim())}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-3"
                  loading={submittingVerdict}
                >
                  {submittingVerdict ? 'Delivering...' : 'Deliver Verdict'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}