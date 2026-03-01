import { type ResultSet, createClient } from '@libsql/client/web'
import { createServerFn } from '@tanstack/react-start'
import z from 'zod'
import { generateNormalAuthHeaders } from '../sqld-api'
import type { DatabaseServer } from './database-servers-types'

type DatabaseQueryRow = Record<string, string | number | boolean | null>

type DatabaseQueryResult = {
	rows: DatabaseQueryRow[]
	headers: {
		name: string
		displayName: string
		originalType: null
		type: string
	}[]
	stat: {
		rowsAffected: number
		rowsRead: number | null
	}
}

const transformRawResult = (result: ResultSet): DatabaseQueryResult => {
	return {
		rows: result.rows as DatabaseQueryRow[],
		headers: result.columns.map((col) => ({
			name: col,
			displayName: col,
			originalType: null,
			type: 'text',
		})),
		stat: {
			rowsAffected: result.rowsAffected || 0,
			rowsRead: result.rows.length || null,
		},
	}
}

const zSendQueryToDatabase = z.object({
	serverId: z.string(),
	workspaceId: z.string(),
	statement: z.union([z.string().min(1), z.array(z.string().min(1)).min(1)]),
})

export type SendQueryToDatabase = z.infer<typeof zSendQueryToDatabase>

export const sendQueryToDatabaseFn = createServerFn({ method: 'POST' })
	.inputValidator(zSendQueryToDatabase)
	.handler(async ({ data }) => {
		const { DatabaseServersStorage } = await import('@/lib/storage')
		const servers = await DatabaseServersStorage.all()
		const server = servers.find((s: DatabaseServer) => s.id === data.serverId)

		if (!server) {
			throw new Error('Database server not found')
		}

		const normalAuthHeaders = await generateNormalAuthHeaders(server.normalAuth)
		const client = createClient({
			url: server.normalUrl,
			tls: server.insecureTls === true,
			fetch: async (originalRequest: Request) => {
				const headers = new Headers(originalRequest.headers)

				// inject the namespace header to route the request to the correct workspace
				headers.set('x-namespace', data.workspaceId)
				for (const [key, value] of Object.entries(normalAuthHeaders)) {
					headers.set(key, value)
				}

				const newRequest = new Request(originalRequest.url, {
					method: originalRequest.method,
					headers,
					body:
						originalRequest.method !== 'GET' && originalRequest.method !== 'HEAD'
							? await originalRequest.clone().text()
							: undefined,
					credentials: originalRequest.credentials,
					mode: originalRequest.mode,
					cache: originalRequest.cache,
					redirect: originalRequest.redirect,
					referrer: originalRequest.referrer,
					integrity: originalRequest.integrity,
				})

				return fetch(newRequest)
			},
		})

		try {
			if (Array.isArray(data.statement)) {
				const results = await client.batch(data.statement, 'write')
				return results.map((result) => transformRawResult(result))
			}

			const result = await client.execute(data.statement)
			return transformRawResult(result)
		} catch (err) {
			throw new Error((err as Error).message)
		}
	})
