import { PropsWithChildren } from 'react'

interface AvatarProps {
  name: string
  size?: number
  className?: string
}

export const Avatar = ({ name, size = 40, className = '' }: AvatarProps) => {
  // Get first letter of name, or use '?' if empty
  const initials = name ? name[0].toUpperCase() : '?'
  
  // Generate a consistent color based on name
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  
  const hue = Math.abs(hash) % 360
  const bgColor = `hsl(${hue}, 70%, 40%)`
  
  return (
    <div className={`
      flex-shrink-0 h-[${size}px] w-[${size}px] rounded-full
      flex items-center justify-center text-white font-medium
      bg-${bgColor}/20 ${className}
    `}>
      {initials}
    </div>
  )
}