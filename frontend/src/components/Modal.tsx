import { useEffect, useId, useRef } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { CloseIcon } from './icons'

interface ModalProps {
  open: boolean
  title: string
  description?: string
  onClose: () => void
  children?: ReactNode
  footer?: ReactNode
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

const modalStack: symbol[] = []
let scrollLocks = 0
let bodyOverflow = ''
let bodyPaddingRight = ''

function lockScroll() {
  scrollLocks += 1
  if (scrollLocks > 1) return

  const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
  bodyOverflow = document.body.style.overflow
  bodyPaddingRight = document.body.style.paddingRight
  document.body.style.overflow = 'hidden'
  if (scrollbarWidth > 0) {
    document.body.style.paddingRight = `${scrollbarWidth}px`
  }
}

function unlockScroll() {
  scrollLocks = Math.max(0, scrollLocks - 1)
  if (scrollLocks > 0) return

  document.body.style.overflow = bodyOverflow
  document.body.style.paddingRight = bodyPaddingRight
}

export function Modal({ open, title, description, onClose, children, footer }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const backdropDownRef = useRef(false)
  const onCloseRef = useRef(onClose)
  const titleId = useId()
  const descriptionId = useId()

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    if (!open) return

    const panel = panelRef.current
    const previousFocus = document.activeElement as HTMLElement | null
    const marker = Symbol('modal')
    modalStack.push(marker)
    lockScroll()

    const appRoot = document.getElementById('root')
    const rootWasInert = appRoot?.inert ?? false
    if (appRoot) appRoot.inert = true

    const initialFocus = panel?.querySelector<HTMLElement>('[data-autofocus]') ?? panel
    initialFocus?.focus({ preventScroll: true })

    function handleKeyDown(event: KeyboardEvent) {
      if (modalStack[modalStack.length - 1] !== marker) return

      if (event.key === 'Escape') {
        event.preventDefault()
        onCloseRef.current()
        return
      }

      if (event.key !== 'Tab' || !panel) return

      const focusable = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (element) => element.offsetParent !== null,
      )

      if (focusable.length === 0) {
        event.preventDefault()
        panel.focus()
        return
      }

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const active = document.activeElement
      const outside = !panel.contains(active)

      if (event.shiftKey) {
        if (active === first || outside) {
          event.preventDefault()
          last.focus()
        }
        return
      }

      if (active === last || outside) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      const index = modalStack.indexOf(marker)
      if (index !== -1) modalStack.splice(index, 1)
      unlockScroll()
      if (appRoot) appRoot.inert = rootWasInert
      if (previousFocus && document.contains(previousFocus)) {
        previousFocus.focus({ preventScroll: true })
      }
    }
  }, [open])

  if (!open) return null

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex animate-overlay-in items-end justify-center bg-brand-dark/50 backdrop-blur-sm sm:items-center sm:p-6"
      onMouseDown={(event) => {
        backdropDownRef.current = event.target === event.currentTarget
      }}
      onClick={(event) => {
        const closeFromBackdrop = backdropDownRef.current && event.target === event.currentTarget
        backdropDownRef.current = false
        if (closeFromBackdrop) onCloseRef.current()
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className="flex max-h-[calc(100dvh-1rem)] w-full max-w-md animate-modal-in flex-col overflow-hidden rounded-t-2xl border border-brand-dark/10 bg-white shadow-xl sm:max-h-[calc(100dvh-3rem)] sm:rounded-2xl"
      >
        <div className="flex flex-shrink-0 items-start gap-3 px-5 pb-4 pt-5 sm:px-6 sm:pt-6">
          <div className="min-w-0 flex-1">
            <h2 id={titleId} className="break-words text-base font-semibold text-brand-dark">
              {title}
            </h2>
            {description ? (
              <p
                id={descriptionId}
                className="mt-1 break-words text-sm leading-relaxed text-brand-muted"
              >
                {description}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => onCloseRef.current()}
            className="relative -m-1 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg text-brand-muted transition-colors before:absolute before:-inset-0.5 before:content-[''] hover:bg-brand-cream hover:text-brand-dark"
          >
            <CloseIcon className="h-4 w-4" />
            <span className="sr-only">Tutup dialog</span>
          </button>
        </div>

        {children ? (
          <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-4 sm:px-6">{children}</div>
        ) : null}

        {footer ? (
          <div className="flex flex-shrink-0 flex-col gap-2 border-t border-brand-dark/8 px-5 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4 sm:flex-row sm:justify-end sm:px-6 sm:pb-4">
            {footer}
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  )
}
