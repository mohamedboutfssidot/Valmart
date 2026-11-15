import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useDemo } from '../store'

/** Sends signed-out visitors to the sign-in page and brings them back after. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const user = useDemo((s) => s.user)
  const loc = useLocation()
  if (!user) return <Navigate to="/signin" replace state={{ from: loc.pathname }} />
  return <>{children}</>
}
