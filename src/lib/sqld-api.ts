import { SignJWT, importPKCS8 } from 'jose'

import type { DatabaseServer, DatabaseServerNormalAuth } from './server/database-servers-types'

const JWT_ALG = 'EdDSA'
const DEFAULT_JWT_EXPIRATION_SEC = 60 * 60

type SignJwtTokenOptions = {
	permission?: 'ro' | 'rw'
	namespace?: string
	expiresInSec?: number | null
}

export const signJwtToken = async (privateKey: string, options: SignJwtTokenOptions = {}) => {
	const key = await importPKCS8(privateKey, JWT_ALG)
	const now = Math.floor(Date.now() / 1000)

	const claims =
		typeof options.permission === 'string' && typeof options.namespace === 'string'
			? {
					a: options.permission,
					id: options.namespace,
				}
			: {}

	let token = new SignJWT(claims).setProtectedHeader({ alg: JWT_ALG }).setIssuedAt(now)

	const expiresInSec = options.expiresInSec === undefined ? DEFAULT_JWT_EXPIRATION_SEC : options.expiresInSec
	if (typeof expiresInSec === 'number') {
		token = token.setExpirationTime(now + expiresInSec)
	}

	return token.sign(key)
}

export const generateNormalAuthHeaders = async (auth: DatabaseServerNormalAuth): Promise<Record<string, string>> => {
	if (auth.type === 'basic') {
		return {
			Authorization: `Basic ${auth.token}`,
		}
	}

	const jwt = await signJwtToken(auth.privateKey)
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
