import { useCallback, useEffect, useRef, useState } from 'react'

interface CacheRecord<T> {
  data: T
  timestamp: number
}

const DEFAULT_STALE_TIME = 30_000

const memoryCache = new Map<string, CacheRecord<unknown>>()
const inFlight = new Map<string, Promise<unknown>>()
const listeners = new Set<(prefix?: string) => void>()
const keyGenerations = new Map<string, number>()
let cacheGeneration = 0

export function invalidateResourceCache(prefix?: string) {
  if (!prefix) {
    memoryCache.clear()
    inFlight.clear()
    keyGenerations.clear()
    cacheGeneration += 1
  } else {
    const keys = new Set([...memoryCache.keys(), ...inFlight.keys()])
    for (const key of keys) {
      if (key === prefix || key.startsWith(`${prefix}:`)) {
        memoryCache.delete(key)
        inFlight.delete(key)
        keyGenerations.set(key, (keyGenerations.get(key) ?? 0) + 1)
      }
    }
  }

  listeners.forEach((listener) => listener(prefix))
}

export interface ResourceOptions {
  staleTime?: number
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
    const requestGeneration = cacheGeneration
    const requestKeyGeneration = key ? (keyGenerations.get(key) ?? 0) : 0

    fetchOnce(key, fetcher)
      .then((data) => {
        if (
          !active ||
          requestGeneration !== cacheGeneration ||
          (key !== null && requestKeyGeneration !== (keyGenerations.get(key) ?? 0))
        ) return
        if (key) memoryCache.set(key, { data, timestamp: Date.now() })
        setState({ data, loading: false, error: null })
      })
      .catch((error: unknown) => {
        if (
          !active ||
          requestGeneration !== cacheGeneration ||
          (key !== null && requestKeyGeneration !== (keyGenerations.get(key) ?? 0))
        ) return
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
