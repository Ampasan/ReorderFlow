import { useCallback, useEffect, useRef, useState } from 'react'

interface CacheRecord<T> {
  data: T
  timestamp: number
}

const DEFAULT_STALE_TIME = 30_000

const memoryCache = new Map<string, CacheRecord<unknown>>()
const inFlight = new Map<string, Promise<unknown>>()
const listeners = new Set<(prefix?: string) => void>()

/**
 * Invalidate client cache. If prefix is provided, only keys starting with
 * that prefix are deleted; otherwise all cache entries are cleared.
 */
export function invalidateResourceCache(prefix?: string) {
  if (!prefix) {
    memoryCache.clear()
  } else {
    for (const key of Array.from(memoryCache.keys())) {
      if (key === prefix || key.startsWith(`${prefix}:`)) {
        memoryCache.delete(key)
      }
    }
  }

  inFlight.clear()
  listeners.forEach((listener) => listener(prefix))
}

export interface ResourceOptions {
  /** How long cached data is served without a network request, in milliseconds. */
  staleTime?: number
  /** Skip fetching while false. Useful for data that is only needed on demand. */
  enabled?: boolean
}

export interface Resource<T> {
  data: T | null
  loading: boolean
  error: string | null
  refetch: () => void
}

interface ResourceState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

function readCached<T>(key: string | null, enabled: boolean): ResourceState<T> {
  const hit = key ? memoryCache.get(key) : undefined
  if (hit) {
    return { data: hit.data as T, loading: false, error: null }
  }
  return { data: null, loading: enabled, error: null }
}

// Concurrent mounts of the same resource share one request instead of firing
// a duplicate call (StrictMode and two components using the same key).
function fetchOnce<T>(key: string | null, fetcher: () => Promise<T>): Promise<T> {
  if (!key) return fetcher()

  const pending = inFlight.get(key) as Promise<T> | undefined
  if (pending) return pending

  const request = fetcher()
  inFlight.set(key, request)

  const clear = () => {
    if (inFlight.get(key) === request) inFlight.delete(key)
  }
  request.then(clear, clear)

  return request
}

export function useResource<T>(
  keyOrFetcher: string | (() => Promise<T>),
  maybeFetcher?: () => Promise<T>,
  options: ResourceOptions = {},
): Resource<T> {
  const isKeyMode = typeof keyOrFetcher === 'string'
  const key = isKeyMode ? keyOrFetcher : null
  const fetcher = (isKeyMode ? maybeFetcher : keyOrFetcher) as () => Promise<T>
  const { staleTime = DEFAULT_STALE_TIME, enabled = true } = options

  const [state, setState] = useState<ResourceState<T>>(() => readCached<T>(key, enabled))
  const [activeKey, setActiveKey] = useState(`${enabled}:${key ?? ''}`)
  const [version, setVersion] = useState(0)
  const forceRefetch = useRef(false)

  // Swap in the cache entry for a new key during render. Waiting for the
  // effect would flash the previous filter's rows first.
  const signature = `${enabled}:${key ?? ''}`
  if (signature !== activeKey) {
    setActiveKey(signature)
    if (enabled) setState(readCached<T>(key, enabled))
  }

  const refetch = useCallback(() => {
    forceRefetch.current = true
    setState((current) =>
      current.data === null
        ? { data: null, loading: true, error: null }
        : { ...current, error: null },
    )
    setVersion((current) => current + 1)
  }, [])

  useEffect(() => {
    if (!key) return

    const onInvalidate = (prefix?: string) => {
      if (!prefix || key === prefix || key.startsWith(`${prefix}:`)) {
        forceRefetch.current = true
        setVersion((current) => current + 1)
      }
    }

    listeners.add(onInvalidate)
    return () => {
      listeners.delete(onInvalidate)
    }
  }, [key])

  useEffect(() => {
    if (!enabled) return

    const cached = key ? memoryCache.get(key) : undefined
    if (!forceRefetch.current && cached && Date.now() - cached.timestamp < staleTime) {
      return
    }
    forceRefetch.current = false

    let active = true

    fetchOnce(key, fetcher)
      .then((data) => {
        if (!active) return
        if (key) memoryCache.set(key, { data, timestamp: Date.now() })
        setState({ data, loading: false, error: null })
      })
      .catch((error: unknown) => {
        if (!active) return
        setState((current) => ({
          ...current,
          loading: false,
          error: error instanceof Error ? error.message : 'Terjadi kesalahan tidak terduga.',
        }))
      })

    return () => {
      active = false
    }
  }, [key, version, enabled, staleTime, fetcher])

  return { data: state.data, loading: state.loading, error: state.error, refetch }
}
