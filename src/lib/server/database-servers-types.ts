import { z } from 'zod'
import type { Workspace } from '../sqld-api'

export const zDatabaseServerAdminAuth = z.object({
	type: z.literal('basic'),
	token: z.string().min(1, 'Admin token is required'),
})

export const zDatabaseServerNormalAuth = z.discriminatedUnion('type', [
	z.object({
		type: z.literal('basic'),
		token: z.string().min(1, 'Basic auth token is required'),
	}),
	z.object({
		type: z.literal('jwt'),
		privateKey: z.string().min(1, 'JWT private key is required'),
	}),
])

export const zDatabaseServer = z.object({
	id: z.string(),
	name: z.string().min(1, 'Name is required'),
	adminUrl: z.url(),
	normalUrl: z.url(),
	adminAuth: zDatabaseServerAdminAuth,
	normalAuth: zDatabaseServerNormalAuth,
	insecureTls: z.boolean().default(false),
	createdAt: z.string(),
})

export type DatabaseServer = z.infer<typeof zDatabaseServer>
export type DatabaseServerAdminAuth = z.infer<typeof zDatabaseServerAdminAuth>
export type DatabaseServerNormalAuth = z.infer<typeof zDatabaseServerNormalAuth>

export const zAddDatabaseServer = zDatabaseServer
	.omit({
		id: true,
		createdAt: true,
		adminAuth: true,
		normalAuth: true,
	})
	.extend({
		adminToken: z.string().min(1, 'Admin token is required'),
		normalAuthType: z.enum(['basic', 'jwt']),
		normalAuthBasicToken: z.string().default(''),
		normalAuthJwtPrivateKey: z.string().default(''),
	})
	.superRefine((data, ctx) => {
		if (data.normalAuthType === 'basic' && data.normalAuthBasicToken.trim().length === 0) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ['normalAuthBasicToken'],
				message: 'Basic auth token is required',
			})
		}

		if (data.normalAuthType === 'jwt' && data.normalAuthJwtPrivateKey.trim().length === 0) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ['normalAuthJwtPrivateKey'],
				message: 'JWT private key is required',
			})
		}
	})

export type AddDatabaseServer = z.input<typeof zAddDatabaseServer>

export type ServerInfo =
	| { isAccessible: false; workspaces: [] }
	| {
			isAccessible: true
			workspaces: Workspace[]
	  }

export const zCreateWorkspace = z.object({
	serverId: z.string(),
	name: z
		.string()
		.min(1)
		.regex(/^[a-zA-Z0-9_-]+$/),
})
