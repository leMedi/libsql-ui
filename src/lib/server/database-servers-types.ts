import { z } from 'zod'
import type { DatabaseServerInfo, Workspace } from '../sqld-api'

export const zDatabaseServerAuth = z.discriminatedUnion('type', [
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

export type ServerInfo =
	| { isAccessible: false; workspaces: [] }
	| (Extract<DatabaseServerInfo, { isAccessible: true }> & { workspaces: Workspace[] })

export const zCreateWorkspace = z.object({
	serverId: z.string(),
	name: z
		.string()
		.min(1)
		.regex(/^[a-zA-Z0-9_-]+$/),
})
