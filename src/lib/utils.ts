import { env } from '@/env'
import { createIsomorphicFn } from '@tanstack/react-start'
import type { ClassValue } from 'clsx'
import { clsx } from 'clsx'
import { nanoid } from 'nanoid'
import { twMerge } from 'tailwind-merge'

const ENTITY_PREFIXES = {
	databaseServer: 'ds',
} as const

type EntityType = keyof typeof ENTITY_PREFIXES

export function genId(entity: EntityType): string {
	const prefix = ENTITY_PREFIXES[entity]
	const id = nanoid(12)
	return `${prefix}_${id}`
}

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
