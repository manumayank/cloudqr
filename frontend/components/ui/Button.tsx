import { ButtonHTMLAttributes, forwardRef, ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
  loading?: boolean
  asChild?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      loading = false,
      disabled,
      asChild = false,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles = 'btn-base font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200'

    const variants = {
      primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500 disabled:bg-primary-300',
      secondary: 'bg-secondary-400 text-white hover:bg-secondary-500 focus:ring-secondary-400 disabled:bg-secondary-200',
      outline: 'border-2 border-primary-600 text-primary-600 bg-white hover:bg-primary-50 focus:ring-primary-500 disabled:border-primary-300 disabled:text-primary-300',
      ghost: 'text-gray-700 bg-transparent hover:bg-gray-100 focus:ring-gray-500 disabled:text-gray-400',
      danger: 'bg-error-600 text-white hover:bg-error-700 focus:ring-error-500 disabled:bg-error-300',
    }

    const sizes = {
      sm: 'px-4 py-2 text-sm rounded-md',
      md: 'px-6 py-3 text-base rounded-lg',
      lg: 'px-8 py-4 text-lg rounded-xl',
    }

    const classes = cn(
      baseStyles,
      variants[variant],
      sizes[size],
      fullWidth && 'w-full',
      (disabled || loading) && 'cursor-not-allowed opacity-50',
      className
    )

    // If asChild, pass className to children
    if (asChild && typeof children === 'object' && children !== null && 'props' in children) {
      const child = children as React.ReactElement
      return (
        <child.type {...child.props} className={cn(classes, child.props.className)} ref={ref} />
      )
    }

    return (
      <button
        ref={ref}
        className={classes}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <span className="flex items-center justify-center">
            <svg
              className="animate-spin -ml-1 mr-2 h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Loading...
          </span>
        ) : (
          children
        )}
      </button>
    )
  }
)

Button.displayName = 'Button'

export default Button
