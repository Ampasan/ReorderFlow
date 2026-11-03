import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

export function ScrollToTop() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    if (!hash) {
      window.scrollTo(0, 0)
      return
    }

    const id = hash.slice(1)
    let attempts = 0
    let timer: number | undefined

    const scrollToHash = () => {
      const element = document.getElementById(id)
      if (element) {
        element.scrollIntoView({ block: 'start' })
        return
      }
      attempts += 1
      if (attempts < 20) {
        timer = window.setTimeout(scrollToHash, 50)
      }
    }

    scrollToHash()
    return () => {
      if (timer) window.clearTimeout(timer)
    }
  }, [pathname, hash])

  return null
}
