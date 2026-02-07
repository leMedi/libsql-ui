import { getDatabaseServerFn, getDatabaseServersFn, getServerInfoFn } from '@/lib/server/database-servers'
import { queryOptions } from '@tanstack/react-query'

export const databaseServersQueryOptions = () =>
	queryOptions({
		queryKey: ['database-server', 'list'],
		queryFn: () => getDatabaseServersFn(),
	})

export const databaseServerInfoQueryOptions = (serverId: string) =>
	queryOptions({
		queryKey: ['database-server', 'info', serverId],
		queryFn: () => getServerInfoFn({ data: { id: serverId } }),
		staleTime: 30000,
	})

export const databaseServerQueryOptions = (serverId: string) =>
	queryOptions({
		queryKey: ['database-server', 'detail', serverId],
		queryFn: () => getDatabaseServerFn({ data: { id: serverId } }),
	})
