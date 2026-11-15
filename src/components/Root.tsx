import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { TourPanel } from './Tour'

/** Wraps both the public site and the app, so the demo tour follows the visitor everywhere. */
export function Root() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return (
    <>
      <Outlet />
      <TourPanel />
    </>
  )
}
