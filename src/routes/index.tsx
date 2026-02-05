import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: Homepage,
})

function Homepage() {
  return <h1 className="text-2xl font-bold">Welcome to the homepage!</h1>
}
