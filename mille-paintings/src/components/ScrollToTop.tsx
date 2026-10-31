import { useLayoutEffect } from 'react'
import { useLocation } from 'react-router-dom'

function jumpToTop() {
  const html = document.documentElement
  const prev = html.style.scrollBehavior
  html.style.scrollBehavior = 'auto'
  window.scrollTo(0, 0)
  html.scrollTop = 0
  document.body.scrollTop = 0
  html.style.scrollBehavior = prev
}

/** Reset scroll position when the route changes (HashRouter included). */
export function ScrollToTop() {
  const { pathname, search } = useLocation()

  useLayoutEffect(() => {
    jumpToTop()
    // Re-assert after paint/layout (images, sticky header, focus) can nudge scroll.
    const raf = requestAnimationFrame(() => {
      jumpToTop()
      requestAnimationFrame(jumpToTop)
    })
    const t1 = window.setTimeout(jumpToTop, 0)
    const t2 = window.setTimeout(jumpToTop, 50)
    const t3 = window.setTimeout(jumpToTop, 120)
    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
    }
  }, [pathname, search])

  return null
}
