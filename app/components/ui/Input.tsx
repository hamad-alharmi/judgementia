import { ReactNode, forwardRef } from 'react'

interface InputProps {
  className?: string
  asChild?: boolean
}

const Input = forwardRef<
  HTMLInputElement,
  InputProps
>(({ className, asChild = false, ...props }, ref) => {
  const Componant = asChild ? 'span' : 'input'

  return (
    <Componant
      className={`
        flex h-10 w-full rounded-md border border-input bg-background px-3 py-2
        text-sm ring-offset-background file:border-0 file:bg-transparent
        file:text-sm file:font-medium placeholder:text-muted-foreground
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
        focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50
        ${className}
      `}
      ref={ref as React.RefObject<HTMLInputElement>}
      {...props}
    />
  )
})
Input.displayName = 'Input'

export { Input }