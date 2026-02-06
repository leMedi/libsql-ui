import { genId } from '@/lib/utils'
import { createServerFn } from '@tanstack/react-start'
import { useStorage } from 'nitro/storage'
import { z } from 'zod'

const removeTrailingSlash = (url: string) => url.replace(/\/+$/, '')

const zDatabaseServerAuth = z.discriminatedUnion('type', [
	z.object({ type: z.literal('none') }),
	z.object({ type: z.literal('bearer'), token: z.string() }),
	z.object({
		type: z.literal('header'),
		name: z.string(),
		value: z.string(),
	}),
])

export const zDatabaseServer = z.object({
	id: z.string(),
	name: z.string().min(1, 'Name is required'),
	baseUrl: z.url(),
	auth: zDatabaseServerAuth,
	insecureTls: z.boolean().default(false),
	createdAt: z.string(),
})

export type DatabaseServer = z.infer<typeof zDatabaseServer>
export type DatabaseServerAuth = z.infer<typeof zDatabaseServerAuth>

const STORAGE_KEY = 'database-servers'

export const getDatabaseServersFn = createServerFn({ method: 'GET' }).handler(async () => {
	const storage = useStorage('main')
	const servers = await storage.getItem<DatabaseServer[]>(STORAGE_KEY)
	return servers ?? []
})

export const getDatabaseServerFn = createServerFn({ method: 'GET' })
	.inputValidator(z.object({ id: z.string() }))
	.handler(async ({ data }) => {
		const storage = useStorage('main')
		const servers = (await storage.getItem<DatabaseServer[]>(STORAGE_KEY)) ?? []
		const server = servers.find((s) => s.id === data.id)
		if (!server) {
			throw new Error('Database server not found')
		}
		return server
	})

export const zAddDatabaseServer = zDatabaseServer
	.omit({
		id: true,
		createdAt: true,
		auth: true,
	})
	.extend({
		authType: z.enum(['none', 'bearer', 'header']),
		authToken: z.string().default(''),
		authHeaderName: z.string().default(''),
		authHeaderValue: z.string().default(''),
	})

export type AddDatabaseServer = z.input<typeof zAddDatabaseServer>

export const addDatabaseServerFn = createServerFn({ method: 'POST' })
	.inputValidator(zAddDatabaseServer)
	.handler(async ({ data }) => {
		const storage = useStorage('main')
		const servers = (await storage.getItem<DatabaseServer[]>(STORAGE_KEY)) ?? []

		const existingWithName = servers.find((s) => s.name === data.name)
		if (existingWithName) {
			throw new Error(`Database server with name "${data.name}" already exists`)
		}

		const auth =
			data.authType === 'none'
				? { type: 'none' as const }
				: data.authType === 'bearer'
					? { type: 'bearer' as const, token: data.authToken || '' }
					: {
							type: 'header' as const,
							name: data.authHeaderName || '',
							value: data.authHeaderValue || '',
						}

		const newServer = {
			name: data.name,
			baseUrl: data.baseUrl,
			insecureTls: data.insecureTls,
			auth,
			id: genId('databaseServer'),
			createdAt: new Date().toISOString(),
		} satisfies DatabaseServer

		servers.push(newServer)
		await storage.setItem(STORAGE_KEY, servers)

		return newServer
	})

export const testDatabaseServerConnectionFn = createServerFn({ method: 'POST' })
	.inputValidator(zAddDatabaseServer)
	.handler(async ({ data }) => {
		const headers: Record<string, string> = {
			Accept: 'application/json',
		}

		if (data.authType === 'bearer') {
			headers.Authorization = `Bearer ${data.authToken}`
		} else if (data.authType === 'header') {
			headers[data.authHeaderName] = data.authHeaderValue
		}

		try {
			const baseUrl = removeTrailingSlash(data.baseUrl)
			const response = await fetch(`${baseUrl}/health`, {
				method: 'GET',
				headers,
			})

			return response.ok
		} catch {
			return false
		}
	})

const zDeleteDatabaseServer = zDatabaseServer.pick({ id: true })

export const deleteDatabaseServerFn = createServerFn({ method: 'POST' })
	.inputValidator(zDeleteDatabaseServer)
	.handler(async ({ data }) => {
		const storage = useStorage('main')
		const servers = (await storage.getItem<DatabaseServer[]>(STORAGE_KEY)) ?? []
		const filtered = servers.filter((s) => s.id !== data.id)

		if (filtered.length === servers.length) {
			throw new Error('Database server not found')
		}

		await storage.setItem(STORAGE_KEY, filtered)
		return { success: true }
	})
