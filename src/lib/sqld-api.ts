import type { DatabaseServer, DatabaseServerAuth } from './server/database-servers-types'

export const generateAuthHeaders = (auth: DatabaseServerAuth): Record<string, string> => {
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

export type DatabaseServerInfo =
	| {
			isAccessible: false
	  }
	| {
			isAccessible: true
			version: string
			user_api: {
				http_listen_addr: string
				hrana_ws_listen_addr: any
				self_url: any
				primary_url: any
				enable_http_console: boolean
			}
			admin_api: {
				listen_addr: string
			}
			rpc: {
				listen_addr: any
			}
	  }

export const fetchServerInfo = async (server: DatabaseServer): Promise<DatabaseServerInfo> => {
	try {
		const response = await fetch(`${server.baseUrl}/v1/server/info`, {
			method: 'GET',
			headers: {
				Accept: 'application/json',
				...generateAuthHeaders(server.auth),
			},
		})

		if (!response.ok) {
			return {
				isAccessible: false,
			}
		}

		const info = (await response.json()) as Omit<Extract<DatabaseServerInfo, { isAccessible: true }>, 'isAccessible'>

		return {
			...info,
			isAccessible: true,
		}
	} catch {
		return {
			isAccessible: false,
		}
	}
}

export type Workspace = {
	name: string
	block_reads: boolean
	block_writes: boolean
	block_reason: string | null
	max_db_size: string
	heartbeat_url: string | null
	jwt_key: string | null
	allow_attach: boolean
	txn_timeout_s: number | null
	durability_mode: string
	shared_schema_name: string | null
}

export const fetchWorkspacesList = async (server: DatabaseServer) => {
	try {
		const response = await fetch(`${server.baseUrl}/v1/namespaces`, {
			method: 'GET',
			headers: {
				Accept: 'application/json',
				...generateAuthHeaders(server.auth),
			},
		})

		if (!response.ok) {
			throw new Error(`Failed to fetch workspaces: ${response.status} ${response.statusText}`)
		}

		const data = await response.json()

		return data.namespaces as Workspace[]
	} catch (error) {
		if (error instanceof Error) {
			throw error
		}
		throw new Error('Failed to fetch workspaces from server')
	}
}
