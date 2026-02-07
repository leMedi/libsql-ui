import { ArrowUpDownIcon, DatabaseIcon, PlusSignIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { useQuery, useSuspenseQuery } from '@tanstack/react-query'
import * as React from 'react'

import { useAddDatabaseServerDialog } from '@/components/add-database-server-dialog-context'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuShortcut,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from '@/components/ui/sidebar'
import type { DatabaseServer } from '@/lib/server/database-servers'
import { databaseServerInfoQueryOptions, databaseServersQueryOptions } from '@/queries/database-server'

function DatabaseStatusIndicator({ serverId }: { serverId: string }) {
	const { data: serverInfo } = useQuery(databaseServerInfoQueryOptions(serverId))

	const isAccessible = serverInfo?.isAccessible ?? false

	return (
		<div
			className={`size-2 rounded-full ${isAccessible ? 'bg-green-500' : 'bg-red-500'}`}
			title={isAccessible ? 'Server accessible' : 'Server not accessible'}
		/>
	)
}

export function DatabaseSwitcher() {
	const { openDialog } = useAddDatabaseServerDialog()
	const { isMobile } = useSidebar()
	const { data: databases = [] } = useSuspenseQuery(databaseServersQueryOptions())
	const [activeDatabase, setActiveDatabase] = React.useState<DatabaseServer | null>(null)

	React.useEffect(() => {
		if (databases.length > 0 && !activeDatabase) {
			setActiveDatabase(databases[0])
		}
	}, [databases, activeDatabase])

	if (!activeDatabase) {
		return null
	}

	return (
		<SidebarMenu className="py-4">
			<SidebarMenuItem>
				<DropdownMenu>
					<DropdownMenuTrigger className="w-full">
						<SidebarMenuButton
							size="lg"
							className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground w-full justify-start"
						>
							<div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
								<HugeiconsIcon icon={DatabaseIcon} className="size-4" />
							</div>
							<div className="grid flex-1 text-left text-sm leading-tight">
								<div className="flex items-center gap-2">
									<span className="truncate font-medium">{activeDatabase.name}</span>
									<DatabaseStatusIndicator serverId={activeDatabase.id} />
								</div>
								<span className="truncate text-xs">{activeDatabase.baseUrl}</span>
							</div>
							<HugeiconsIcon icon={ArrowUpDownIcon} className="ml-auto" />
						</SidebarMenuButton>
					</DropdownMenuTrigger>
					<DropdownMenuContent
						className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
						align="start"
						side={isMobile ? 'bottom' : 'right'}
						sideOffset={4}
					>
						<DropdownMenuGroup>
							<DropdownMenuLabel className="text-muted-foreground text-xs">Databases</DropdownMenuLabel>
							{databases.map((database, index) => (
								<DropdownMenuItem key={database.name} onClick={() => setActiveDatabase(database)} className="gap-2 p-2">
									<div className="flex size-6 items-center justify-center rounded-md border">
										<HugeiconsIcon icon={DatabaseIcon} className="size-3.5 shrink-0" />
									</div>
									<div className="flex flex-1 items-center gap-2">
										{database.name}
										<DatabaseStatusIndicator serverId={database.id} />
									</div>
									<DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
								</DropdownMenuItem>
							))}
						</DropdownMenuGroup>
						<DropdownMenuSeparator />
						<DropdownMenuItem className="gap-2 p-2" onClick={openDialog}>
							<div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
								<HugeiconsIcon icon={PlusSignIcon} className="size-4" />
							</div>
							<div className="text-muted-foreground font-medium">Add database</div>
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</SidebarMenuItem>
		</SidebarMenu>
	)
}
