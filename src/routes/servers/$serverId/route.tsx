import { AppSidebar } from '@/components/app-sidebar'
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { databaseServerInfoQueryOptions } from '@/queries/database-server'
import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/servers/$serverId')({
	loader: async ({ params, context }) => {
		try {
			const data = await context.queryClient.ensureQueryData(databaseServerInfoQueryOptions(params.serverId))
			return data
		} catch {
			throw redirect({ to: '/' })
		}
	},
	component: RouteComponent,
})

function Header() {
	return (
		<div className="h-12 border-b flex flex-col justify-center px-4">
			<SidebarTrigger />
		</div>
	)
}

function RouteComponent() {
	return (
		<SidebarProvider>
			<AppSidebar />
			<main className="w-full">
				<Header />
				<div>
					<Outlet />
				</div>
			</main>
		</SidebarProvider>
	)
}
