import { DatabaseServersStorage } from '@/lib/storage'
import { genId } from '@/lib/utils'
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

const removeTrailingSlash = (url: string) => url.replace(/\/+$/, '')
const generateAuthHeaders = (auth: DatabaseServerAuth): Record<string, string> => {
	if (auth.type === 'bearer') {
		return {
			Authorization: `Bearer ${auth.token}`,
		}
	}

	if (auth.type === 'header') {
		return {
			[auth.name]: auth.value,
		}
	}
	return {}
}

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

export const getDatabaseServersFn = createServerFn({ method: 'GET' }).handler(async () => {
	const servers = await DatabaseServersStorage.all()
	return servers ?? []
})

export const getDatabaseServerFn = createServerFn({ method: 'GET' })
	.inputValidator(z.object({ id: z.string() }))
	.handler(async ({ data }) => {
		const servers = await DatabaseServersStorage.all()
		const server = servers.find((s: DatabaseServer) => s.id === data.id)
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
		const servers = await DatabaseServersStorage.all()

		const existingWithName = servers.find((s: DatabaseServer) => s.name === data.name)
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
		await DatabaseServersStorage.add(newServer)

		return newServer
	})

export const testDatabaseServerConnectionFn = createServerFn({ method: 'POST' })
	.inputValidator(zAddDatabaseServer)
	.handler(async ({ data }) => {
		try {
			const baseUrl = removeTrailingSlash(data.baseUrl)
			const response = await fetch(`${baseUrl}/health`, {
				method: 'GET',
				headers: {
					...generateAuthHeaders({
						type: data.authType,
						token: data.authToken,
						name: data.authHeaderName,
						value: data.authHeaderValue,
					}),
				},
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
		const servers = await DatabaseServersStorage.all()
		const filtered = servers.filter((s: DatabaseServer) => s.id !== data.id)

		if (filtered.length === servers.length) {
			throw new Error('Database server not found')
		}

		await DatabaseServersStorage.remove(data.id)
		return { success: true }
	})

export interface ServerInfo {
	version: string | null
	gitCommit: string | null
	buildDate: string | null
	isAccessible: boolean
	responseTimeMs: number
}

export const getServerInfoFn = createServerFn({ method: 'POST' })
	.inputValidator(zDatabaseServer.pick({ id: true }))
	.handler(async ({ data }): Promise<ServerInfo> => {
		const servers = await DatabaseServersStorage.all()
		const server = servers.find((s: DatabaseServer) => s.id === data.id)

		if (!server) {
			throw new Error('Database server not found')
		}

		const headers: Record<string, string> = {
			Accept: 'text/plain',
			...generateAuthHeaders(server.auth),
		}

		const baseUrl = removeTrailingSlash(server.baseUrl)
		const startTime = Date.now()

		try {
			const response = await fetch(`${baseUrl}/version`, {
				method: 'GET',
				headers,
			})

			const responseTimeMs = Date.now() - startTime

			if (!response.ok) {
				return {
					version: null,
					gitCommit: null,
					buildDate: null,
					isAccessible: false,
					responseTimeMs,
				}
			}

			const versionText = await response.text()

			// Parse version string like: "sqld 0.21.9 (67f3ea5d 2023-10-26)"
			const versionMatch = versionText.match(/sqld\s+([\d.]+)\s+\(([a-f0-9]+)\s+(\d{4}-\d{2}-\d{2})\)/)

			return {
				version: (versionMatch?.[1] ?? versionText.trim()) || null,
				gitCommit: versionMatch?.[2] ?? null,
				buildDate: versionMatch?.[3] ?? null,
				isAccessible: true,
				responseTimeMs,
			}
		} catch {
			return {
				version: null,
				gitCommit: null,
				buildDate: null,
				isAccessible: false,
				responseTimeMs: Date.now() - startTime,
			}
		}
	})
