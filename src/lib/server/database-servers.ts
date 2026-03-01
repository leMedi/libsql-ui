import { genId } from '@/lib/utils'
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { fetchWorkspacesList, generateNormalAuthHeaders } from '../sqld-api'
import {
	type DatabaseServer,
	type DatabaseServerAdminAuth,
	type DatabaseServerNormalAuth,
	type DatabaseServerPublic,
	type ServerInfo,
	zAddDatabaseServer,
	zCreateWorkspace,
	zDatabaseServer,
} from './database-servers-types'

const removeTrailingSlash = (url: string) => url.replace(/\/+$/, '')

const normalizeUrl = (url: string) => removeTrailingSlash(url)

const adminAuthInputsToDbAuth = (auth: {
	token?: string
}): DatabaseServerAdminAuth => {
	return { type: 'basic', token: auth.token || '' }
}

const normalAuthInputsToDbAuth = (auth: {
	type: 'basic' | 'jwt'
	token?: string
	privateKey?: string
}): DatabaseServerNormalAuth => {
	if (auth.type === 'basic') {
		return { type: 'basic', token: auth.token || '' }
	}

	return { type: 'jwt', privateKey: auth.privateKey || '' }
}

// Helper to strip sensitive auth data before sending to frontend
const sanitizeServerForPublic = (server: DatabaseServer): DatabaseServerPublic => {
	const { adminAuth: _, normalAuth: __, ...publicServer } = server
	return publicServer
}

export const getDatabaseServersFn = createServerFn({ method: 'GET' }).handler(async () => {
	const { DatabaseServersStorage } = await import('@/lib/storage')
	const servers = await DatabaseServersStorage.all()
	return (servers ?? []).map(sanitizeServerForPublic)
})

export const getDatabaseServerConnectionInfoFromStorageFn = createServerFn({
	method: 'GET',
})
	.inputValidator(z.object({ id: z.string() }))
	.handler(async ({ data }) => {
		const { DatabaseServersStorage } = await import('@/lib/storage')
		const servers = await DatabaseServersStorage.all()
		const server = servers.find((s: DatabaseServer) => s.id === data.id)
		if (!server) {
			throw new Error('Database server not found')
		}
		return sanitizeServerForPublic(server)
	})

export const addDatabaseServerFn = createServerFn({ method: 'POST' })
	.inputValidator(zAddDatabaseServer)
	.handler(async ({ data }) => {
		const { DatabaseServersStorage } = await import('@/lib/storage')
		const servers = await DatabaseServersStorage.all()

		const existingWithName = servers.find((s: DatabaseServer) => s.name === data.name)
		if (existingWithName) {
			throw new Error(`Database server with name "${data.name}" already exists`)
		}

		const adminAuth = adminAuthInputsToDbAuth({
			token: data.adminToken,
		})

		const normalAuth = normalAuthInputsToDbAuth({
			type: data.normalAuthType,
			token: data.normalAuthBasicToken,
			privateKey: data.normalAuthJwtPrivateKey,
		})

		const newServer = {
			name: data.name,
			adminUrl: normalizeUrl(data.adminUrl),
			normalUrl: normalizeUrl(data.normalUrl),
			insecureTls: data.insecureTls,
			adminAuth,
			normalAuth,
			id: genId('databaseServer'),
			createdAt: new Date().toISOString(),
		} satisfies DatabaseServer

		servers.push(newServer)
		await DatabaseServersStorage.add(newServer)

		return sanitizeServerForPublic(newServer)
	})

export const testDatabaseServerConnectionFn = createServerFn({ method: 'POST' })
	.inputValidator(zAddDatabaseServer)
	.handler(async ({ data }) => {
		try {
			const adminUrl = normalizeUrl(data.adminUrl)
			console.log('Testing connection to database server admin URL:', adminUrl, {
				headers: {
					...(await generateNormalAuthHeaders(
						adminAuthInputsToDbAuth({
							token: data.adminToken,
						}),
					)),
				},
			})

			const response = await fetch(`${adminUrl}/health`, {
				method: 'GET',
				headers: {
					...(await generateNormalAuthHeaders(
						adminAuthInputsToDbAuth({
							token: data.adminToken,
						}),
					)),
				},
			})

			return response.ok
		} catch (error) {
			console.error('Error testing database server connection:', error)
			return false
		}
	})

export const deleteDatabaseServerFn = createServerFn({ method: 'POST' })
	.inputValidator(zDatabaseServer.pick({ id: true }))
	.handler(async ({ data }) => {
		const { DatabaseServersStorage } = await import('@/lib/storage')
		const servers = await DatabaseServersStorage.all()
		const filtered = servers.filter((s: DatabaseServer) => s.id !== data.id)

		if (filtered.length === servers.length) {
			throw new Error('Database server not found')
		}

		await DatabaseServersStorage.remove(data.id)
		return { success: true }
	})

const _SERVER_INFO_CACHE: Record<string, { date: Date; data: ServerInfo }> = {}
const getSeverInfoCached = async (serverId: string): Promise<ServerInfo> => {
	const { DatabaseServersStorage } = await import('@/lib/storage')
	const servers = await DatabaseServersStorage.all()
	const server = servers.find((s: DatabaseServer) => s.id === serverId)

	if (!server) {
		throw new Error('Database server not found')
	}

	try {
		// if (_SERVER_INFO_CACHE[serverId]) {
		// 	// TODO: check date is less than 15min old
		// 	return _SERVER_INFO_CACHE[serverId].data
		// }

		const workspaces = await fetchWorkspacesList(server)

		return {
			isAccessible: true,
			workspaces,
		}
	} catch {
		return { isAccessible: false, workspaces: [] }
	}
}

export const getServerInfoFn = createServerFn({ method: 'POST' })
	.inputValidator(zDatabaseServer.pick({ id: true }))
	.handler(async ({ data }) => {
		return getSeverInfoCached(data.id)
	})

export const createWorkspaceFn = createServerFn({ method: 'POST' })
	.inputValidator(zCreateWorkspace)
	.handler(async ({ data }): Promise<boolean> => {
		const { DatabaseServersStorage } = await import('@/lib/storage')
		const servers = await DatabaseServersStorage.all()
		const server = servers.find((s) => s.id === data.serverId)

		if (!server) {
			throw new Error('Database server not found')
		}

		try {
			const response = await fetch(`${server.adminUrl}/v1/namespaces/${encodeURIComponent(data.name)}/create`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Accept: 'application/json',
					...(await generateNormalAuthHeaders(server.adminAuth)),
				},
				body: JSON.stringify({}),
			})

			if (response.status === 409) {
				throw new Error('Database already exists')
			}

			if (!response.ok) {
				throw new Error(`Failed to create workspace: ${response.status} ${response.statusText}`)
			}

			delete _SERVER_INFO_CACHE[data.serverId]
			return true
		} catch (error) {
			if (error instanceof Error) {
				throw error
			}
			throw new Error('Failed to create workspace on server')
		}
	})
