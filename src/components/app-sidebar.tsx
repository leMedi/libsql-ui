'use client'

import {
	AudioWave01Icon,
	CommandIcon,
	Forward,
	FramerIcon,
	Image02Icon,
	Location01Icon,
	PieChartIcon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import type * as React from 'react'

import { DatabaseSwitcher } from '@/components/database-switcher'
import { Sidebar, SidebarContent, SidebarHeader, SidebarMenuButton, SidebarRail } from '@/components/ui/sidebar'
import { Link } from '@tanstack/react-router'

// This is sample data.
const data = {
	user: {
		name: 'shadcn',
		email: 'm@example.com',
		avatar: '/avatars/shadcn.jpg',
	},
	databases: [
		{
			name: 'Acme Inc',
			logo: Image02Icon,
			plan: 'Enterprise',
		},
		{
			name: 'Acme Corp.',
			logo: AudioWave01Icon,
			plan: 'Startup',
		},
		{
			name: 'Evil Corp.',
			logo: CommandIcon,
			plan: 'Free',
		},
	],
	projects: [
		{
			name: 'Design Engineering',
			url: '#',
			icon: FramerIcon,
		},
		{
			name: 'Sales & Marketing',
			url: '#',
			icon: PieChartIcon,
		},
		{
			name: 'Travel',
			url: '#',
			icon: Location01Icon,
		},
	],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
	return (
		<Sidebar collapsible="icon" {...props}>
			<SidebarHeader>
				<DatabaseSwitcher databases={data.databases} />
			</SidebarHeader>
			<SidebarContent>
				<NavLinks />
			</SidebarContent>
			<SidebarRail />
		</Sidebar>
	)
}

function NavLinks() {
	// const { isMobile } = useSidebar();
	return (
		<SidebarMenuButton className="text-md">
			<Link to={'/'} className="flex items-center gap-2">
				<HugeiconsIcon size={'80px'} icon={Forward} />
				<span>Test</span>
			</Link>
		</SidebarMenuButton>
	)
}
