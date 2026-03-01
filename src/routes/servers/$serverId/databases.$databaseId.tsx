import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { sendQueryToDatabaseFn } from '@/lib/server/database'
import type { Workspace } from '@/lib/sqld-api'
import { createFileRoute, getRouteApi, useParams } from '@tanstack/react-router'
import { useEffect, useRef } from 'react'

export const Route = createFileRoute('/servers/$serverId/databases/$databaseId')({
	component: RouteComponent,
})

const routeApi = getRouteApi('/servers/$serverId')

function RouteComponent() {
	const { databaseId, serverId } = useParams({
		from: '/servers/$serverId/databases/$databaseId',
	})

	const server = routeApi.useLoaderData()
	if (!server.isAccessible) {
		return (
			<div className="container mx-auto py-8 px-8">
				<div className="">
					<h1 className="text-3xl font-bold">Server not accessible</h1>
					<p className="text-muted-foreground">
						The server "{server.isAccessible}" is currently not accessible. Please check your connection settings.
					</p>
				</div>
			</div>
		)
	}

	const database = server.workspaces.find((w) => w.name === databaseId)
	if (!database) {
		return (
			<div className="container mx-auto py-8 px-8">
				<div className="">
					<h1 className="text-3xl font-bold">Database not found</h1>
					<p className="text-muted-foreground">The database "{databaseId}" was not found on server.</p>
				</div>
			</div>
		)
	}

	return (
		<div className="container mx-auto py-8 px-8">
			<div className="space-y-4">
				<div className="mb-4 pl-5">
					<h1 className="text-3xl font-bold">Database: {databaseId}</h1>
					<p className="text-muted-foreground mt-2">Workspace overview and data explorer</p>
				</div>

				<div>
					<Tabs defaultValue="overview" className="space-y-4 flex-col">
						<TabsList variant="line" className="mx-5">
							<TabsTrigger value="overview">Overview</TabsTrigger>
							<TabsTrigger value="data">Data</TabsTrigger>
						</TabsList>

						<TabsContent value="overview" className="px-5">
							<DatabaseOverview workspace={database} />
						</TabsContent>

						<TabsContent value="data">
							<LibSQLStudioEmbed serverId={serverId} workspace={database} />
						</TabsContent>
					</Tabs>
				</div>
			</div>
		</div>
	)
}

function DatabaseOverview({ workspace }: { workspace: Workspace }) {
	return (
		<div className="grid gap-4 md:grid-cols-2">
			<Card>
				<CardHeader>
					<CardTitle>Configuration</CardTitle>
				</CardHeader>
				<CardContent className="space-y-3">
					<div className="flex items-center justify-between gap-4">
						<span className="text-muted-foreground">Name</span>
						<span className="font-mono text-xs">{workspace.name}</span>
					</div>
					<div className="flex items-center justify-between gap-4">
						<span className="text-muted-foreground">Durability mode</span>
						<span>{workspace.durability_mode}</span>
					</div>
					<div className="flex items-center justify-between gap-4">
						<span className="text-muted-foreground">Attach allowed</span>
						<BooleanBadge value={workspace.allow_attach} />
					</div>
					<div className="flex items-center justify-between gap-4">
						<span className="text-muted-foreground">Reads blocked</span>
						<BooleanBadge value={workspace.block_reads} trueLabel="Blocked" falseLabel="Allowed" />
					</div>
					<div className="flex items-center justify-between gap-4">
						<span className="text-muted-foreground">Writes blocked</span>
						<BooleanBadge value={workspace.block_writes} trueLabel="Blocked" falseLabel="Allowed" />
					</div>
					<div className="flex items-start justify-between gap-4">
						<span className="text-muted-foreground">Block reason</span>
						<span className="text-right text-sm">{workspace.block_reason ?? 'None'}</span>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Limits and Integrations</CardTitle>
				</CardHeader>
				<CardContent className="space-y-3">
					<div className="flex items-center justify-between gap-4">
						<span className="text-muted-foreground">Max DB size</span>
						<span>{workspace.max_db_size}</span>
					</div>
					<div className="flex items-center justify-between gap-4">
						<span className="text-muted-foreground">Transaction timeout</span>
						<span>{workspace.txn_timeout_s === null ? 'Default' : `${workspace.txn_timeout_s}s`}</span>
					</div>
					<div className="flex items-start justify-between gap-4">
						<span className="text-muted-foreground">Shared schema</span>
						<span className="text-right text-sm">{workspace.shared_schema_name ?? 'None'}</span>
					</div>
					<div className="flex items-center justify-between gap-4">
						<span className="text-muted-foreground">JWT key</span>
						<BooleanBadge value={workspace.jwt_key !== null} trueLabel="Configured" falseLabel="Not set" />
					</div>
					<div>
						<p className="text-muted-foreground mb-1">Heartbeat URL</p>
						<p className="font-mono text-xs break-all">{workspace.heartbeat_url ?? 'Not configured'}</p>
					</div>
				</CardContent>
			</Card>
		</div>
	)
}

function BooleanBadge({
	value,
	trueLabel = 'Yes',
	falseLabel = 'No',
}: {
	value: boolean
	trueLabel?: string
	falseLabel?: string
}) {
	return <Badge variant={value ? 'secondary' : 'outline'}>{value ? trueLabel : falseLabel}</Badge>
}

function LibSQLStudioEmbed({
	serverId,
	workspace,
}: {
	serverId: string
	workspace: Workspace
}) {
	const iframeRef = useRef<HTMLIFrameElement>(null)

	useEffect(() => {
		const contentWindow = iframeRef.current?.contentWindow

		if (!contentWindow) {
			return
		}

		const handler = (e: MessageEvent) => {
			if (e.data.type === 'query' && e.data.statement) {
				sendQueryToDatabaseFn({
					data: {
						serverId,
						workspaceId: workspace.name,
						statement: e.data.statement,
					},
				})
					.then((result) => {
						contentWindow.postMessage(
							{
								type: e.data.type,
								id: e.data.id,
								data: result,
							},
							'*',
						)
					})
					.catch((err) => {
						contentWindow.postMessage(
							{
								type: e.data.type,
								id: e.data.id,
								error: (err as Error).message,
							},
							'*',
						)
					})
			} else if (e.data.type === 'transaction' && e.data.statements) {
				sendQueryToDatabaseFn({
					data: {
						serverId,
						workspaceId: workspace.name,
						statement: e.data.statements,
					},
				})
					.then((result) => {
						contentWindow.postMessage(
							{
								type: e.data.type,
								id: e.data.id,
								data: result,
							},
							'*',
						)
					})
					.catch((err) => {
						contentWindow.postMessage(
							{
								type: e.data.type,
								id: e.data.id,
								error: (err as Error).message,
							},
							'*',
						)
					})
			}
		}

		window.addEventListener('message', handler)
		return () => window.removeEventListener('message', handler)
	}, [serverId, workspace.name])

	return (
		<iframe
			ref={iframeRef}
			src="https://libsqlstudio.com/embed/sqlite"
			title="LibSQL Studio"
			className="w-full h-screen border-0"
		/>
	)
}
