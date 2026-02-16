import * as React from 'react'

import { AddDatabaseServerDialog } from '@/components/add-database-server-dialog'

type AddDatabaseServerDialogContextType = {
	isOpen: boolean
	openDialog: () => void
	closeDialog: () => void
}

const AddDatabaseServerDialogContext = React.createContext<AddDatabaseServerDialogContextType | undefined>(undefined)

export function AddDatabaseServerDialogProvider({
	children,
}: {
	children: React.ReactNode
}) {
	const [isOpen, setIsOpen] = React.useState(false)

	const openDialog = React.useCallback(() => {
		setIsOpen(true)
	}, [])

	const closeDialog = React.useCallback(() => {
		setIsOpen(false)
	}, [])

	return (
		<AddDatabaseServerDialogContext.Provider value={{ isOpen, openDialog, closeDialog }}>
			{children}
			<AddDatabaseServerDialog isOpen={isOpen} onOpenChange={setIsOpen} />
		</AddDatabaseServerDialogContext.Provider>
	)
}

export function useAddDatabaseServerDialog(): AddDatabaseServerDialogContextType {
	const context = React.use(AddDatabaseServerDialogContext)
	if (context === undefined) {
		throw new Error('useAddDatabaseServerDialog must be used within a AddDatabaseServerDialogProvider')
	}
	return context
}
