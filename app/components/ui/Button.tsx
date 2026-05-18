import { ButtonHTMLAttributes, ForwardedRef, forwardRef } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  asChild?: boolean
}

const Button = forwardRef<
  HTMLButtonElement,
  ButtonProps
>(({ className, variant = 'default', size = 'default', asChild = false, ...props }, ref) => {
  const Componant = asChild ? 'span' : 'button'

  const variants: Record<
    ButtonProps['variant'],
    string
  > = {
    default: 'bg-primary text-primary-foreground hover:bg-primary/90',
    destructive:
      'bg-destructive text-destructive-foreground hover:bg-destructive/90',
    outline: 'border border-input hover:bg-accent hover:text-accent-foreground',
    secondary:
      'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    ghost: 'hover:bg-accent hover:text-accent-foreground',
    link: 'underline-offset-4 hover:underline text-primary'
  }

  const sizes: Record<
    ButtonProps['size'],
    string
  > = {
    default: 'h-10 px-4 py-2',
    sm: 'h-9 px-3 rounded',
    lg: 'h-11 px-8 rounded',
    icon: 'h-10 w-10'
  }

  return (
    <Componant
      className={`
        inline-flex items-center justify-center rounded-md text-sm font-medium
        transition-colors focus-visible:outline-none focus-visible:ring-2
        focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none
        disabled:opacity-50
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
      ref={ref as ForwardedRef<HTMLButtonElement>}
      {...props}
    />
  )
})
Button.displayName = 'Button'

export { Button }