import { useCallback, useEffect, useState } from 'react'

interface Snapshot<T> {
  data: T | null
  error: string | null
  settledFetcher: (() => Promise<T>) | null
  settledVersion: number
}

export interface Resource<T> {
  data: T | null
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useResource<T>(fetcher: () => Promise<T>): Resource<T> {
  const [snapshot, setSnapshot] = useState<Snapshot<T>>({
    data: null,
    error: null,
    settledFetcher: null,
    settledVersion: -1,
  })
  const [version, setVersion] = useState(0)

  const refetch = useCallback(() => setVersion((current) => current + 1), [])

  useEffect(() => {
    let active = true

    fetcher()
      .then((data) => {
        if (active) setSnapshot({ data, error: null, settledFetcher: fetcher, settledVersion: version })
      })
      .catch((error: unknown) => {
        if (!active) return
        const message =
          error instanceof Error ? error.message : 'Terjadi kesalahan tidak terduga.'
        setSnapshot({ data: null, error: message, settledFetcher: fetcher, settledVersion: version })
      })

    return () => {
      active = false
    }
  }, [fetcher, version])

  const loading = snapshot.settledFetcher !== fetcher || snapshot.settledVersion !== version

  return {
    data: loading ? null : snapshot.data,
    loading,
    error: loading ? null : snapshot.error,
    refetch,
  }
}
