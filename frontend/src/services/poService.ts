import { get, post, put } from './api'
import type { DraftItemInput, POFilter, POLog } from '../types/po'

export function listPO(status: POFilter): Promise<POLog[]> {
  return get<POLog[]>('/api/po', { status })
}

export function getPO(id: number): Promise<POLog> {
  return get<POLog>(`/api/po-draft/${id}`)
}

export function updateDraft(id: number, items: DraftItemInput[]): Promise<POLog> {
  return put<POLog>(`/api/po-draft/${id}`, { items })
}

export function submitDraft(id: number): Promise<POLog> {
  return post<POLog>(`/api/po-draft/${id}/submit`)
}
