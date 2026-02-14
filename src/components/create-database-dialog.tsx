import { PlusSignIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { useForm } from '@tanstack/react-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createWorkspaceFn } from '@/lib/server/database-servers'
import { zCreateWorkspace } from '@/lib/server/database-servers-types'
import type z from 'zod'


type CreateWorkspace = z.infer<typeof zCreateWorkspace>
export function CreateDatabaseDialog({ serverId }: { serverId: string }) {
	const [open, setOpen] = useState(false)
	const queryClient = useQueryClient()
	const [errorMessage, setErrorMessage] = useState<string | null>(null)

	const mutation = useMutation({
		mutationFn: (data: z.infer<typeof zCreateWorkspace>) => createWorkspaceFn({ data }),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ['workspaces', 'list', serverId],
			})
			setOpen(false)
			form.reset()
			setErrorMessage(null)
		},
		onError: (error) => {
			setErrorMessage(error instanceof Error ? error.message : 'An error occurred')
		},
	})

	const form = useForm({
		defaultValues: {
			serverId: serverId,
			name: '',
		} as CreateWorkspace,
		validators: {
			onChange: zCreateWorkspace,
		},
		onSubmit: async ({ value }) => {
			await mutation.mutateAsync(value)
		},
	})

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger>
				<Button variant="outline" size="sm" onClick={() => setOpen(true)}>
					<HugeiconsIcon icon={PlusSignIcon} className="mr-2 size-4" />
					Create Database
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>Create Database</DialogTitle>
					<DialogDescription>
						Create a new database on this server. The name can only contain letters, numbers, underscores, and hyphens.
					</DialogDescription>
				</DialogHeader>
				<form
					onSubmit={(e) => {
						e.preventDefault()
						e.stopPropagation()
						form.handleSubmit()
					}}
					className="space-y-4"
				>
					<form.Field name="name">
						{(field) => (
							<div className="space-y-2">
								<Label htmlFor={field.name}>Database Name</Label>
								<Input
									id={field.name}
									name={field.name}
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
									placeholder="my-database"
								/>
								{field.state.meta.errors?.length > 0 && (
									<p className="text-destructive text-sm">{String(field.state.meta.errors[0]?.message)}</p>
								)}
							</div>
						)}
					</form.Field>

					{errorMessage && <p className="text-destructive text-sm">{errorMessage}</p>}

					<DialogFooter>
						<Button type="button" variant="outline" onClick={() => setOpen(false)}>
							Cancel
						</Button>
						<Button type="submit" disabled={form.state.isSubmitting || mutation.isPending}>
							<HugeiconsIcon icon={PlusSignIcon} className="mr-2 size-4" />
							{form.state.isSubmitting || mutation.isPending ? 'Creating...' : 'Create Database'}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	)
}
