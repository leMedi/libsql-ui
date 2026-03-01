import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { sendQueryToDatabaseFn } from '@/lib/server/database'
import { createScopedJwtTokenFn } from '@/lib/server/database-servers'
import type { Workspace } from '@/lib/sqld-api'
import { databaseServersQueryOptions } from '@/queries/database-server'
import { useMutation, useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, getRouteApi, useParams } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'

export const Route = createFileRoute('/servers/$serverId/databases/$databaseId')({
	component: RouteComponent,
})

const routeApi = getRouteApi('/servers/$serverId')

function RouteComponent() {
	const { databaseId, serverId } = useParams({
		from: '/servers/$serverId/databases/$databaseId',
	})
	const { data: servers } = useSuspenseQuery(databaseServersQueryOptions())

	const server = routeApi.useLoaderData()
	const selectedServer = servers.find((item) => item.id === serverId)
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
							<DatabaseOverview
								workspace={database}
								serverId={serverId}
								canCreateScopedToken={selectedServer?.normalAuthType === 'jwt'}
							/>
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

function DatabaseOverview({
	workspace,
	serverId,
	canCreateScopedToken,
}: {
	workspace: Workspace
	serverId: string
	canCreateScopedToken: boolean
}) {
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
					<div className="flex items-center justify-between gap-3">
						<CardTitle>Limits and Integrations</CardTitle>
						{canCreateScopedToken && <CreateScopedTokenDialog serverId={serverId} namespace={workspace.name} />}
					</div>
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

const expirationOptions = [
	{ value: 'never', label: 'Never', expiresInSec: null },
	{ value: '1-day', label: '1 day', expiresInSec: 60 * 60 * 24 },
	{ value: '7-day', label: '7 day', expiresInSec: 60 * 60 * 24 * 7 },
	{ value: '10-day', label: '10 day', expiresInSec: 60 * 60 * 24 * 10 },
	{ value: '30-day', label: '30 day', expiresInSec: 60 * 60 * 24 * 30 },
	{ value: '90-day', label: '90 day', expiresInSec: 60 * 60 * 24 * 90 },
	{ value: '1-year', label: '1 year', expiresInSec: 60 * 60 * 24 * 365 },
] as const

type ExpirationValue = (typeof expirationOptions)[number]['value']
type PermissionValue = 'ro' | 'rw'

function CreateScopedTokenDialog({
	serverId,
	namespace,
}: {
	serverId: string
	namespace: string
}) {
	const [open, setOpen] = useState(false)
	const [expiration, setExpiration] = useState<ExpirationValue>('never')
	const [permission, setPermission] = useState<PermissionValue>('rw')
	const [token, setToken] = useState('')
	const [copied, setCopied] = useState(false)

	const mutation = useMutation({
		mutationFn: async () => {
			const selectedExpiration = expirationOptions.find((item) => item.value === expiration)
			if (!selectedExpiration) {
				throw new Error('Invalid expiration selected')
			}

			return createScopedJwtTokenFn({
				data: {
					serverId,
					namespace,
					permission,
					expiresInSec: selectedExpiration.expiresInSec,
				},
			})
		},
		onSuccess: (data) => {
			setToken(data.token)
			setCopied(false)
		},
	})

	const closeDialog = (nextOpen: boolean) => {
		setOpen(nextOpen)
		if (!nextOpen) {
			setExpiration('never')
			setPermission('rw')
			setToken('')
			setCopied(false)
			mutation.reset()
		}
	}

	const copyToken = async () => {
		if (!token) {
			return
		}

		await navigator.clipboard.writeText(token)
		setCopied(true)
	}

	return (
		<Dialog open={open} onOpenChange={closeDialog}>
			<DialogTrigger>
				<Button variant="outline" size="sm" onClick={() => setOpen(true)}>
					Create token
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-[560px]">
				<DialogHeader>
					<DialogTitle>Create scoped JWT token</DialogTitle>
					<DialogDescription>
						Generate a JWT token for namespace <span className="font-mono text-xs">{namespace}</span>.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4">
					<div className="space-y-2">
						<Label>Permission</Label>
						<Select value={permission} onValueChange={(value) => setPermission(value as PermissionValue)}>
							<SelectTrigger className="w-full">
								<SelectValue placeholder="Select permission" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="ro">Read only</SelectItem>
								<SelectItem value="rw">Read &amp; write</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-2">
						<Label>Expires</Label>
						<Select value={expiration} onValueChange={(value) => setExpiration(value as ExpirationValue)}>
							<SelectTrigger className="w-full">
								<SelectValue placeholder="Select expiration" />
							</SelectTrigger>
							<SelectContent>
								{expirationOptions.map((option) => (
									<SelectItem key={option.value} value={option.value}>
										{option.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					{mutation.error && (
						<p className="text-destructive text-sm">
							{mutation.error instanceof Error ? mutation.error.message : 'Failed to create token'}
						</p>
					)}

					{token && (
						<div className="space-y-2">
							<Label>JWT token</Label>
							<Textarea value={token} readOnly className="font-mono text-xs break-all whitespace-pre-wrap" rows={6} />
						</div>
					)}
				</div>

				<DialogFooter>
					<Button type="button" variant="outline" onClick={() => closeDialog(false)}>
						Close
					</Button>
					{token && (
						<Button type="button" variant="secondary" onClick={() => copyToken()}>
							{copied ? 'Copied' : 'Copy token'}
						</Button>
					)}
					<Button type="button" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
						{mutation.isPending ? 'Creating...' : 'Create token'}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
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
