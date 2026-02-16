import { DatabaseIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { useQuery } from '@tanstack/react-query'
import type * as React from 'react'

import { DatabaseSwitcher } from '@/components/database-switcher'
import {
	Sidebar,
	SidebarContent,
	SidebarGroup,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarRail,
} from '@/components/ui/sidebar'
import { databaseServerInfoQueryOptions } from '@/queries/database-server'
import { Link, useParams } from '@tanstack/react-router'
import { CreateDatabaseDialog } from './create-database-dialog'

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
	const { serverId } = useParams({ from: '/servers/$serverId' })

	return (
		<Sidebar collapsible="icon" {...props}>
			<SidebarHeader>
				<DatabaseSwitcher />
			</SidebarHeader>
			<SidebarContent>
				<CreateDatabaseDialog serverId={serverId} />
				<WorkspacesList />
			</SidebarContent>
			<SidebarRail />
		</Sidebar>
	)
}

function WorkspacesList() {
	const { serverId } = useParams({ from: '/servers/$serverId' })
	const { data: serverInfo, isLoading } = useQuery(databaseServerInfoQueryOptions(serverId))

	if (isLoading) {
		return (
			<SidebarGroup>
				<SidebarGroupLabel>Databases</SidebarGroupLabel>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton disabled>
							<span className="text-muted-foreground">Loading...</span>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarGroup>
		)
	}

	if (serverInfo?.workspaces.length === 0) {
		return (
			<SidebarGroup>
				<SidebarGroupLabel>Databases</SidebarGroupLabel>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton disabled>
							<span className="text-muted-foreground">No databases found</span>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarGroup>
		)
	}

	return (
		<SidebarGroup>
			<SidebarGroupLabel>Databases</SidebarGroupLabel>
			<SidebarMenu>
				{serverInfo?.workspaces.map((workspace) => (
					<SidebarMenuItem key={workspace.name} value={workspace.name}>
						<SidebarMenuButton>
							<Link to="/servers/$serverId/databases/$databaseId" params={{ serverId, databaseId: workspace.name }} className="w-full">
								<span className="flex items-center gap-2">
									<HugeiconsIcon icon={DatabaseIcon} className="size-4" />
									<span className='text-md'>{workspace.name}</span>
								</span>
							</Link>
						</SidebarMenuButton>
					</SidebarMenuItem>
				))}
			</SidebarMenu>
		</SidebarGroup>
	)
}
