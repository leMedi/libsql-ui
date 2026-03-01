import { useAddDatabaseServerDialog } from '@/components/add-database-server-dialog-context'
import { databaseServersQueryOptions } from '@/queries/database-server'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { useEffect } from 'react'

export const Route = createFileRoute('/')({
	loader: async ({ context }) => {
		const queryClient = context.queryClient
		const data = await queryClient.ensureQueryData(databaseServersQueryOptions())

		if (data.length > 0) {
			throw redirect({ to: '/servers/$serverId', params: { serverId: data[0].id } })
		}

		return { databaseServers: data }
	},
	component: Homepage,
})

function Homepage() {
	const data = Route.useLoaderData()

	const { openDialog, closeDialog } = useAddDatabaseServerDialog()

	useEffect(() => {
		if (data.databaseServers.length === 0) {
			openDialog()
		} else {
			closeDialog()
		}
	}, [data, openDialog, closeDialog])

	// openDialog()
	return (
		<div className="flex h-[calc(100vh-3rem)] items-center justify-center">
			<div className="text-muted-foreground">No database servers configured</div>
		</div>
	)
}
