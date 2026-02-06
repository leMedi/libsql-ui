import { ArrowUpDownIcon, PlusSignIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import * as React from 'react'

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

import type { IconSvgElement } from '@hugeicons/react'

export function DatabaseSwitcher({
	databases,
}: {
	databases: {
		name: string
		logo: IconSvgElement
		plan: string
	}[]
}) {
	const { isMobile } = useSidebar()
	const [activeDatabase, setActiveDatabase] = React.useState(databases[0])

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
								<HugeiconsIcon icon={activeDatabase.logo} className="size-4" />
							</div>
							<div className="grid flex-1 text-left text-sm leading-tight">
								<span className="truncate font-medium">{activeDatabase.name}</span>
								<span className="truncate text-xs">{activeDatabase.plan}</span>
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
										<HugeiconsIcon icon={database.logo} className="size-3.5 shrink-0" />
									</div>
									{database.name}
									<DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
								</DropdownMenuItem>
							))}
						</DropdownMenuGroup>
						<DropdownMenuSeparator />
						<DropdownMenuItem className="gap-2 p-2">
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
