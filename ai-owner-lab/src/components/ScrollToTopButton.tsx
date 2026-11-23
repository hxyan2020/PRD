import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLanguage } from '../i18n/LanguageContext'

const SHOW_AFTER_PX = 280

type ScrollMetrics = {
  top: number
  view: number
  height: number
  bottomGap: number
}

function scrollMetrics(target: Window | Element): ScrollMetrics {
  if (target === window) {
    const top = window.scrollY || document.documentElement.scrollTop || 0
    const view = window.innerHeight || document.documentElement.clientHeight || 0
    const height = Math.max(
      document.documentElement.scrollHeight,
      document.body?.scrollHeight || 0,
    )
    return { top, view, height, bottomGap: Math.max(0, height - (top + view)) }
  }
  const el = target as HTMLElement
  return {
    top: el.scrollTop,
    view: el.clientHeight,
    height: el.scrollHeight,
    bottomGap: Math.max(0, el.scrollHeight - (el.scrollTop + el.clientHeight)),
  }
}

function resolveScrollTarget(): Window | Element {
  const fullscreen = document.querySelector('.note-fullscreen-body')
  if (fullscreen instanceof HTMLElement && fullscreen.scrollHeight > fullscreen.clientHeight + 48) {
    return fullscreen
  }
  const lightbox = document.querySelector('.note-image-lightbox-stage')
  if (lightbox instanceof HTMLElement && lightbox.scrollHeight > lightbox.clientHeight + 48) {
    return lightbox
  }
  return window
}

function scrollToEdge(target: Window | Element, edge: 'top' | 'bottom') {
  if (target === window) {
    const top =
      edge === 'top'
        ? 0
        : Math.max(
            document.documentElement.scrollHeight,
            document.body?.scrollHeight || 0,
          )
    window.scrollTo({ top, behavior: 'smooth' })
    return
  }
  const el = target as Element
  el.scrollTo({
    top: edge === 'top' ? 0 : el.scrollHeight,
    behavior: 'smooth',
  })
}

export function ScrollToTopButton() {
  const { t } = useLanguage()
  const [showTop, setShowTop] = useState(false)
  const [showBottom, setShowBottom] = useState(false)
  const targetRef = useRef<Window | Element>(window)

  useEffect(() => {
    let frame = 0

    function update() {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        if (document.body.classList.contains('menu-open')) {
          setShowTop(false)
          setShowBottom(false)
          return
        }
        const target = resolveScrollTarget()
        targetRef.current = target
        const { top, bottomGap, height, view } = scrollMetrics(target)
        const scrollable = height > view + 48
        setShowTop(scrollable && top > SHOW_AFTER_PX)
        setShowBottom(scrollable && bottomGap > SHOW_AFTER_PX)
      })
    }

    document.addEventListener('scroll', update, { capture: true, passive: true })
    window.addEventListener('resize', update)
    const mo = new MutationObserver(update)
    mo.observe(document.body, { childList: true, subtree: true, attributes: true })
    update()

    return () => {
      cancelAnimationFrame(frame)
      document.removeEventListener('scroll', update, true)
      window.removeEventListener('resize', update)
      mo.disconnect()
    }
  }, [])

  if (typeof document === 'undefined') return null

  const anyVisible = showTop || showBottom

  return createPortal(
    <div
      className={`scroll-jump${anyVisible ? ' on' : ''}`}
      aria-hidden={!anyVisible}
    >
      <button
        type="button"
        className={`scroll-jump-btn scroll-jump-top${showTop ? ' on' : ''}`}
        aria-label={t('scrollToTop')}
        title={t('scrollToTop')}
        tabIndex={showTop ? 0 : -1}
        aria-hidden={!showTop}
        onClick={() => scrollToEdge(targetRef.current, 'top')}
      >
        <span className="scroll-jump-icon scroll-jump-icon-up" aria-hidden="true" />
      </button>
      <button
        type="button"
        className={`scroll-jump-btn scroll-jump-bottom${showBottom ? ' on' : ''}`}
        aria-label={t('scrollToBottom')}
        title={t('scrollToBottom')}
        tabIndex={showBottom ? 0 : -1}
        aria-hidden={!showBottom}
        onClick={() => scrollToEdge(targetRef.current, 'bottom')}
      >
        <span className="scroll-jump-icon scroll-jump-icon-down" aria-hidden="true" />
      </button>
    </div>,
    document.body,
  )
}
