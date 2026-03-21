// Re-export for convenience — use the right client based on context:
// - createBrowserClient() for Client Components ('use client')
// - createServerClient() for Server Components, Route Handlers, Server Actions

export { createClient as createBrowserClient } from './client'
export { createClient as createServerClient } from './server'
