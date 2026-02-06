import { getDatabaseServersFn } from '@/lib/server/database-servers'
import { queryOptions } from '@tanstack/react-query'

export const databaseServersQueryOptions = () =>
	queryOptions({
		queryKey: ['database-server', 'list'],
		queryFn: () => getDatabaseServersFn(),
	})
