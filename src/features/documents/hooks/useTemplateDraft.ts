'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { documentsApi } from '../api/documents.api'
import type { Orientation, Paper, TemplateBody, TemplateDetail } from '../types'

export interface DraftState {
  name: string
  paper: Paper
  orientation: Orientation
  body: TemplateBody
}

export type SaveStatus = 'saved' | 'dirty' | 'saving' | 'error'

const EMPTY_BODY: TemplateBody = { pages: [{}], elements: [] }
const AUTOSAVE_MS = 1500
const HISTORY_LIMIT = 100

function fromDetail(t: TemplateDetail): DraftState {
  return {
    name: t.name,
    paper: t.paper,
    orientation: t.orientation,
    body: t.body && Array.isArray(t.body.elements) ? { ...t.body, pages: t.body.pages?.length ? t.body.pages : [{}] } : EMPTY_BODY,
  }
}

/**
 * The editor's working copy of one template: local edits with undo/redo, debounced autosave of the
 * DRAFT version (publishing stays an explicit action) and an unsaved-changes guard.
 */
export function useTemplateDraft(id: string) {
  const query = useQuery({ queryKey: ['documents', 'template', id], queryFn: () => documentsApi.get(id) })
  // Local edits layer over the loaded template; until the first edit we simply show the loaded copy.
  const [local, setLocal] = useState<DraftState | null>(null)
  const state: DraftState | null = local ?? (query.data ? fromDetail(query.data) : null)
  const [hist, setHist] = useState({ undo: 0, redo: 0 })
  const [status, setStatus] = useState<SaveStatus>('saved')
  const past = useRef<DraftState[]>([])
  const future = useRef<DraftState[]>([])
  const rev = useRef(0) // bumps on every local edit; a save only clears "dirty" if nothing changed meanwhile
  const stateRef = useRef<DraftState | null>(null)
  useEffect(() => {
    stateRef.current = state
  }, [state])


  const commit = useCallback((next: DraftState, record: boolean) => {
    if (record && stateRef.current) {
      past.current.push(stateRef.current)
      if (past.current.length > HISTORY_LIMIT) past.current.shift()
      future.current = []
    }
    rev.current += 1
    stateRef.current = next
    setLocal(next)
    setHist({ undo: past.current.length, redo: future.current.length })
    setStatus('dirty')
  }, [])

  /** Apply an edit. `record=false` for continuous gestures (drag) so one gesture = one undo step. */
  const edit = useCallback(
    (fn: (s: DraftState) => DraftState, record = true) => {
      const cur = stateRef.current
      if (cur) commit(fn(cur), record)
    },
    [commit],
  )

  /** Call once at the start of a continuous gesture so its first change is one undo step. */
  const checkpoint = useCallback(() => {
    if (stateRef.current) {
      past.current.push(stateRef.current)
      if (past.current.length > HISTORY_LIMIT) past.current.shift()
      future.current = []
      setHist({ undo: past.current.length, redo: 0 })
    }
  }, [])

  const undo = useCallback(() => {
    const prev = past.current.pop()
    if (!prev || !stateRef.current) return
    future.current.push(stateRef.current)
    commit(prev, false)
  }, [commit])

  const redo = useCallback(() => {
    const next = future.current.pop()
    if (!next || !stateRef.current) return
    past.current.push(stateRef.current)
    commit(next, false)
  }, [commit])

  const save = useCallback(async () => {
    const cur = stateRef.current
    if (!cur) return
    const startedAt = rev.current
    setStatus('saving')
    try {
      await documentsApi.update(id, { name: cur.name, paper: cur.paper, orientation: cur.orientation, body: cur.body })
      setStatus(rev.current === startedAt ? 'saved' : 'dirty')
    } catch {
      setStatus('error')
    }
  }, [id])

  // debounced autosave
  useEffect(() => {
    if (status !== 'dirty') return
    const h = setTimeout(() => void save(), AUTOSAVE_MS)
    return () => clearTimeout(h)
  }, [status, state, save])

  // unsaved-changes guard
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (status === 'dirty' || status === 'saving' || status === 'error') {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [status])

  return {
    loading: query.isLoading || (!state && !query.isError),
    error: query.isError,
    detail: query.data,
    state,
    status,
    edit,
    checkpoint,
    undo,
    redo,
    canUndo: hist.undo > 0,
    canRedo: hist.redo > 0,
    save,
  }
}
