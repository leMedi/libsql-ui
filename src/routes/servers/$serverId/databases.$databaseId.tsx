import { sendQueryToDatabaseFn } from '@/lib/server/database'
import type { Workspace } from '@/lib/sqld-api'
import { createFileRoute, getRouteApi, useParams } from '@tanstack/react-router'
import { useEffect, useRef } from 'react'

export const Route = createFileRoute('/servers/$serverId/databases/$databaseId')({
	component: RouteComponent,
})

const routeApi = getRouteApi('/servers/$serverId')

function RouteComponent() {
	const { databaseId, serverId } = useParams({ from: '/servers/$serverId/databases/$databaseId' })

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

	const database = server.workspaces.find(w => w.name === databaseId)
	if (!database) {
		return (
			<div className="container mx-auto py-8 px-8">
				<div className="">
					<h1 className="text-3xl font-bold">Database not found</h1>
					<p className="text-muted-foreground">
						The database "{databaseId}" was not found on server.
					</p>
				</div>
			</div>
		)
	}

	return (
		<div className="container mx-auto py-8 px-8">
			<div className="space-y-3">
				<h1 className="text-3xl font-bold">
					{databaseId}
				</h1>
				<LibSQLStudioEmbed serverId={serverId} workspace={database} />
			</div>
		</div>
	)
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
