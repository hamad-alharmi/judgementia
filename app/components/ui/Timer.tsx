import { useEffect, useState } from 'react'

interface TimerProps {
  seconds: number
  onEnd?: () => void
}

export const Timer = ({ seconds, onEnd }: TimerProps) => {
  const [timeLeft, setTimeLeft] = useState(seconds)

  useEffect(() => {
    if (timeLeft <= 0) {
      onEnd?.()
      return
    }

    const timer = setTimeout(() => {
      setTimeLeft(prev => prev - 1)
    }, 1000)

    return () => clearTimeout(timer)
  }, [timeLeft, onEnd])

  const minutes = Math.floor(timeLeft / 60)
  const remainingSeconds = timeLeft % 60
  const displayTime = `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`

  return (
    <div className="text-center">
      <div className="text-5xl font-bold text-red-400">
        {displayTime}
      </div>
      <p className="text-sm text-zinc-400">seconds remaining</p>
    </div>
  )
}