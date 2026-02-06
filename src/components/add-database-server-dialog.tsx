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
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
	type AddDatabaseServer,
	addDatabaseServerFn,
	testDatabaseServerConnectionFn,
	zAddDatabaseServer,
} from '@/lib/server/database-servers'
import { useRouter } from '@tanstack/react-router'

export function AddDatabaseServerDialog({
	isOpen,
	onOpenChange,
}: {
	isOpen: boolean
	onOpenChange: (open: boolean) => void
}) {
	const router = useRouter()
	const queryClient = useQueryClient()
	const [testResult, setTestResult] = useState<'idle' | 'success' | 'error'>('idle')

	const mutation = useMutation({
		mutationFn: (data: AddDatabaseServer) => addDatabaseServerFn({ data }),
		onSuccess: (newServer) => {
			router.invalidate()
			queryClient.invalidateQueries({ queryKey: ['database-servers'] })
			onOpenChange(false)
			form.reset()
			setTestResult('idle')
			router.navigate({
				to: '/server/$serverId',
				params: { serverId: newServer.id },
			})
		},
	})

	const testConnectionMutation = useMutation({
		mutationFn: (data: AddDatabaseServer) => testDatabaseServerConnectionFn({ data }),
		onSuccess: (success) => {
			setTestResult(success ? 'success' : 'error')
		},
		onError: () => {
			setTestResult('error')
		},
	})

	const form = useForm({
		defaultValues: {
			authType: 'none' as 'none' | 'bearer' | 'header',
		} as AddDatabaseServer,
		validators: {
			onChange: zAddDatabaseServer,
		},
		onSubmit: async ({ value }) => {
			await mutation.mutateAsync(value)
		},
	})

	return (
		<Dialog open={isOpen} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>Add Database Server</DialogTitle>
					<DialogDescription>
						Connect to a new libsql/sqld server. Fill in the connection details below.
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
					<form.Field
						name="name"
						children={(field) => (
							<div className="space-y-2">
								<Label htmlFor={field.name}>Name</Label>
								<Input
									id={field.name}
									name={field.name}
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
									placeholder="My Production Server"
								/>
								{field.state.meta.errors?.length > 0 && (
									<p className="text-destructive text-sm">{String(field.state.meta.errors[0]?.message)}</p>
								)}
							</div>
						)}
					/>

					<form.Field
						name="baseUrl"
						children={(field) => (
							<div className="space-y-2">
								<Label htmlFor={field.name}>Base URL</Label>
								<Input
									id={field.name}
									name={field.name}
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
									placeholder="http://localhost:8080"
								/>
								{field.state.meta.errors?.length > 0 && (
									<p className="text-destructive text-sm">{String(field.state.meta.errors[0]?.message)}</p>
								)}
							</div>
						)}
					/>

					<form.Field
						name="authType"
						children={(field) => (
							<div className="space-y-2">
								<Label htmlFor={field.name}>Authentication</Label>
								<Select
									value={field.state.value}
									onValueChange={(value) => field.handleChange(value as 'none' | 'bearer' | 'header')}
								>
									<SelectTrigger className="w-full">
										<SelectValue placeholder="Select authentication type" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="none">None</SelectItem>
										<SelectItem value="bearer">Bearer Token</SelectItem>
										<SelectItem value="header">Custom Header</SelectItem>
									</SelectContent>
								</Select>
							</div>
						)}
					/>

					<form.Subscribe
						selector={(state) => state.values.authType}
						children={(authType) =>
							authType === 'bearer' ? (
								<form.Field
									name="authToken"
									children={(field) => (
										<div className="space-y-2">
											<Label htmlFor={field.name}>Bearer Token</Label>
											<Input
												id={field.name}
												name={field.name}
												type="password"
												value={field.state.value}
												onBlur={field.handleBlur}
												onChange={(e) => field.handleChange(e.target.value)}
												placeholder="your-secret-token"
											/>
										</div>
									)}
								/>
							) : authType === 'header' ? (
								<>
									<form.Field
										name="authHeaderName"
										children={(field) => (
											<div className="space-y-2">
												<Label htmlFor={field.name}>Header Name</Label>
												<Input
													id={field.name}
													name={field.name}
													value={field.state.value}
													onBlur={field.handleBlur}
													onChange={(e) => field.handleChange(e.target.value)}
													placeholder="X-Custom-Auth"
												/>
											</div>
										)}
									/>
									<form.Field
										name="authHeaderValue"
										children={(field) => (
											<div className="space-y-2">
												<Label htmlFor={field.name}>Header Value</Label>
												<Input
													id={field.name}
													name={field.name}
													type="password"
													value={field.state.value}
													onBlur={field.handleBlur}
													onChange={(e) => field.handleChange(e.target.value)}
													placeholder="your-secret-value"
												/>
											</div>
										)}
									/>
								</>
							) : null
						}
					/>

					<form.Field
						name="insecureTls"
						children={(field) => (
							<div className="flex items-center space-x-2">
								<input
									type="checkbox"
									id={field.name}
									checked={field.state.value}
									onChange={(e) => field.handleChange(e.target.checked)}
									className="h-4 w-4 rounded border-gray-300"
								/>
								<Label htmlFor={field.name} className="text-sm font-normal">
									Allow insecure TLS (self-signed certificates)
								</Label>
							</div>
						)}
					/>

					{mutation.error && (
						<p className="text-destructive text-sm">
							{mutation.error instanceof Error ? mutation.error.message : 'An error occurred'}
						</p>
					)}

					<DialogFooter className="block">
						<p
							className={`min-h-5 block text-sm mb-4 ${testResult === 'success' ? 'text-green-600' : 'text-destructive'}`}
						>
							{testResult !== 'idle' &&
								(testConnectionMutation.data === true
									? 'Connection successful!'
									: testConnectionMutation.data === false
										? 'Connection failed. Please check your settings.'
										: '')}
						</p>
						<div className="flex w-full">
							<div className="flex w-full gap-2 justify-end">
								<Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
									Cancel
								</Button>
								<form.Subscribe
									selector={(state) => [state.canSubmit, state.values]}
									children={([canSubmit, values]) => (
										<Button
											type="button"
											variant="secondary"
											disabled={!canSubmit || testConnectionMutation.isPending}
											onClick={() => testConnectionMutation.mutate(values as AddDatabaseServer)}
										>
											{testConnectionMutation.isPending ? 'Testing...' : 'Test Connection'}
										</Button>
									)}
								/>
								<Button type="submit" disabled={form.state.isSubmitting}>
									{form.state.isSubmitting ? 'Adding...' : 'Add Server'}
								</Button>
							</div>
						</div>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	)
}
