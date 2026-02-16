import { SignJWT, importPKCS8 } from 'jose'

import type { DatabaseServer, DatabaseServerNormalAuth } from './server/database-servers-types'

const JWT_ALG = 'EdDSA'
const JWT_EXPIRATION = '1h'

const signJwtToken = async (privateKey: string) => {
	const key = await importPKCS8(privateKey, JWT_ALG)
	return new SignJWT({}).setProtectedHeader({ alg: JWT_ALG }).setIssuedAt().setExpirationTime(JWT_EXPIRATION).sign(key)
}

export const generateNormalAuthHeaders = async (auth: DatabaseServerNormalAuth): Promise<Record<string, string>> => {
	if (auth.type === 'basic') {
		return {
			Authorization: `Basic ${auth.token}`,
		}
	}

	const jwt = await signJwtToken(auth.privateKey)
	console.log('Generated JWT for normal auth:', jwt)
	return {
		Authorization: `Bearer ${jwt}`,
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
		const response = await fetch(`${server.adminUrl}/v1/namespaces`, {
			method: 'GET',
			headers: {
				Accept: 'application/json',
				...(await generateNormalAuthHeaders(server.adminAuth)),
			},
		})

		if (!response.ok) {
			throw new Error(`Failed to fetch workspaces: ${response.status} ${response.statusText}`)
		}

		const data = await response.json()

		console.log('Parsed workspaces list:', data)

		return data.namespaces as Workspace[]
	} catch (error) {
		if (error instanceof Error) {
			throw error
		}
		throw new Error('Failed to fetch workspaces from server')
	}
}
