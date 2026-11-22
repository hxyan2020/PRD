import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLanguage } from '../i18n/LanguageContext'

const SHOW_AFTER_PX = 280

function scrollTopOf(target: Window | Element): number {
  if (target === window) {
    return window.scrollY || document.documentElement.scrollTop || 0
  }
  return (target as Element).scrollTop
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

export function ScrollToTopButton() {
  const { t } = useLanguage()
  const [visible, setVisible] = useState(false)
  const targetRef = useRef<Window | Element>(window)

  useEffect(() => {
    let frame = 0

    function update() {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        if (document.body.classList.contains('menu-open')) {
          setVisible(false)
          return
        }
        const target = resolveScrollTarget()
        targetRef.current = target
        setVisible(scrollTopOf(target) > SHOW_AFTER_PX)
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

  function onClick() {
    const target = targetRef.current
    if (target === window) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    ;(target as Element).scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (typeof document === 'undefined') return null

  return createPortal(
    <button
      type="button"
      className={`scroll-to-top${visible ? ' on' : ''}`}
      aria-label={t('scrollToTop')}
      title={t('scrollToTop')}
      tabIndex={visible ? 0 : -1}
      aria-hidden={!visible}
      onClick={onClick}
    >
      <span className="scroll-to-top-icon" aria-hidden="true" />
    </button>,
    document.body,
  )
}
