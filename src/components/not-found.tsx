import { Button } from '@/components/ui/button'
import { HelpCircleIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Link } from '@tanstack/react-router'

export function NotFound() {
	return (
		<div className="flex min-h-[80vh] flex-col items-center justify-center px-4 text-center">
			<div className="mb-6 flex h-24 w-24 items-center justify-center rounded-2xl bg-primary/10">
				<HugeiconsIcon icon={HelpCircleIcon} className="h-12 w-12 text-primary" />
			</div>

			<h1 className="mb-2 text-7xl font-bold tracking-tight text-foreground">404</h1>

			<p className="mb-8 text-xl text-muted-foreground">Page not found</p>

			<p className="mb-8 max-w-md text-base text-muted-foreground">
				The page you're looking for doesn't exist or has been moved.
			</p>

			<Button size="lg">
				<Link to="/">Go back home</Link>
			</Button>
		</div>
	)
}
