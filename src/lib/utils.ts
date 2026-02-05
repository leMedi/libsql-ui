import { env } from '@/env'
import { createIsomorphicFn } from '@tanstack/react-start'
import type { ClassValue } from 'clsx'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: Array<ClassValue>) {
  return twMerge(clsx(inputs))
}

export const getBaseUrl = createIsomorphicFn()
  .server(() => {
    return env.VITE_SITE_URL
  })
  .client(() => {
    return window.location.origin
  })

export function getInitials(name: string) {
  const tokens = name.trim().split(/\s+/).filter(Boolean)
  if (tokens.length === 0) {
    return ''
  }
  const initials = tokens.map((token) => token.charAt(0).toUpperCase()).join('')
  return initials.slice(0, 2)
}
