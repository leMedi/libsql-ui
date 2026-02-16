import { env } from '@/env'
import { createStorage } from 'unstorage'
import fsDriver from 'unstorage/drivers/fs'
import type { DatabaseServer } from './server/database-servers-types'

const storagePath = env.DATABASE_STORE_PATH || './data'

export const storage = createStorage({
	driver: fsDriver({ base: storagePath }),
})

export const STORAGE_KEY = 'database-servers'

function getStorage<T>(key: string) {
	return storage.getItem<T>(key)
}

export const DatabaseServersStorage = {
	all: async () => {
		const data = await getStorage<DatabaseServer[]>(STORAGE_KEY)
		return data ?? []
	},
	add: async (server: DatabaseServer) => {
		const servers = (await getStorage<DatabaseServer[]>(STORAGE_KEY)) ?? []
		servers.push(server)
		await storage.setItem(STORAGE_KEY, servers)
		return server
	},
	remove: async (id: string) => {
		const servers = (await getStorage<DatabaseServer[]>(STORAGE_KEY)) ?? []
		const filtered = servers.filter((s: DatabaseServer) => s.id !== id)

		if (filtered.length === servers.length) {
			throw new Error('Database server not found')
		}

		await storage.setItem(STORAGE_KEY, filtered)
		return { success: true }
	},
}
