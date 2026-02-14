import { genId } from '@/lib/utils'
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { fetchServerInfo, fetchWorkspacesList, generateAuthHeaders } from '../sqld-api'
import {
	type DatabaseServer,
	type ServerInfo,
	zAddDatabaseServer,
	zCreateWorkspace,
	zDatabaseServer,
} from './database-servers-types'

const removeTrailingSlash = (url: string) => url.replace(/\/+$/, '')

function authInputsToDbAuth(auth: {
	type: 'none' | 'bearer' | 'header'
	token?: string
	name?: string
	value?: string
}): import('./database-servers-types').DatabaseServerAuth {
	if (auth.type === 'none') {
		return { type: 'none' }
	}
	if (auth.type === 'bearer') {
		return { type: 'bearer', token: auth.token || '' }
	}
	return {
		type: 'header',
		name: auth.name || '',
		value: auth.value || '',
	}
}

export const getDatabaseServersFn = createServerFn({ method: 'GET' }).handler(async () => {
	const { DatabaseServersStorage } = await import('@/lib/storage')
	const servers = await DatabaseServersStorage.all()
	return servers ?? []
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
		return server
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

		const auth = authInputsToDbAuth({
			type: data.authType,
			token: data.authToken,
			name: data.authHeaderName,
			value: data.authHeaderValue,
		})

		const newServer = {
			name: data.name,
			baseUrl: removeTrailingSlash(data.baseUrl),
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
					...generateAuthHeaders(
						authInputsToDbAuth({
							type: data.authType,
							token: data.authToken,
							name: data.authHeaderName,
							value: data.authHeaderValue,
						}),
					),
				},
			})

			return response.ok
		} catch {
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
		if (_SERVER_INFO_CACHE[serverId]) {
			// TODO: check date is less than 15min old
			return _SERVER_INFO_CACHE[serverId].data
		}

		const info = await fetchServerInfo(server)

		if (info.isAccessible === false) {
			return { isAccessible: false, workspaces: [] }
		}

		const workspaces = await fetchWorkspacesList(server)

		return {
			...info,
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
			const response = await fetch(`${server.baseUrl}/v1/namespaces/${encodeURIComponent(data.name)}/create`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Accept: 'application/json',
					...generateAuthHeaders(server.auth),
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
