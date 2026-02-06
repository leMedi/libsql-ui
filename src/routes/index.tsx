import { useAddDatabaseServerDialog } from '@/components/add-database-server-dialog-context'
import { databaseServersQueryOptions } from '@/queries/database-server'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
	loader: async ({ context }) => {
		const queryClient = context.queryClient
		const data = await queryClient.ensureQueryData(databaseServersQueryOptions())
		return { databaseServers: data }
	},
	component: Homepage,
})

function Homepage() {
	const { data: databases = [] } = useQuery(databaseServersQueryOptions())
	const { openDialog } = useAddDatabaseServerDialog()

	if (databases.length === 0) {
		openDialog()
	}

	if (databases.length === 0 && !databases.length) {
		return (
			<div className="flex h-[calc(100vh-3rem)] items-center justify-center">
				<div className="text-muted-foreground">No database servers configured</div>
			</div>
		)
	}

	return <h1 className="text-2xl font-bold">Welcome to the homepage!</h1>
}
