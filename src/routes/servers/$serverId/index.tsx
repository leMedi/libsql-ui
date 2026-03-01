import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { databaseServersQueryOptions } from '@/queries/database-server'
import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, getRouteApi } from '@tanstack/react-router'

export const Route = createFileRoute('/servers/$serverId/')({
	component: RouteComponent,
})

const serverRouteApi = getRouteApi('/servers/$serverId')

function RouteComponent() {
	const { serverId } = Route.useParams()
	const serverInfo = serverRouteApi.useLoaderData()
	const { data: servers } = useSuspenseQuery(databaseServersQueryOptions())
	const server = servers.find((item) => item.id === serverId)

	if (!server) {
		return (
			<div className="container mx-auto px-8 py-8">
				<h1 className="text-3xl font-bold">Server not found</h1>
				<p className="text-muted-foreground mt-2">No configured server matches id "{serverId}".</p>
			</div>
		)
	}

	return (
		<div className="container mx-auto px-8 py-8">
			<div className="mb-4">
				<h1 className="text-3xl font-bold">{server.name}</h1>
				<p className="text-muted-foreground mt-2">Server details and connection health</p>
			</div>

			<div className="grid gap-4 md:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle>Overview</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3">
						<div className="flex items-center justify-between gap-4">
							<span className="text-muted-foreground">Status</span>
							<Badge variant={serverInfo.isAccessible ? 'secondary' : 'destructive'}>
								{serverInfo.isAccessible ? 'Accessible' : 'Not accessible'}
							</Badge>
						</div>
						<div className="flex items-center justify-between gap-4">
							<span className="text-muted-foreground">Server ID</span>
							<span className="font-mono text-xs">{server.id}</span>
						</div>
						<div className="flex items-center justify-between gap-4">
							<span className="text-muted-foreground">Insecure TLS</span>
							<span>{server.insecureTls ? 'Enabled' : 'Disabled'}</span>
						</div>
						<div className="flex items-center justify-between gap-4">
							<span className="text-muted-foreground">Workspaces</span>
							<span>{serverInfo.workspaces.length}</span>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Endpoints</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3">
						<div>
							<p className="text-muted-foreground mb-1">Admin URL</p>
							<p className="font-mono text-xs break-all">{server.adminUrl}</p>
						</div>
						<div>
							<p className="text-muted-foreground mb-1">Normal URL</p>
							<p className="font-mono text-xs break-all">{server.normalUrl}</p>
						</div>
						<div>
							<p className="text-muted-foreground mb-1">Created</p>
							<p>{new Date(server.createdAt).toLocaleString()}</p>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	)
}
