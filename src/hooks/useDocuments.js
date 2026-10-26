import { useCallback, useEffect, useState } from 'react'
import { documentService } from '../services/documentService'

export function useDocuments(user) {
  const [documents, setDocuments] = useState([])
  const [activeDocument, setActiveDocument] = useState(null)
  const [loading, setLoading] = useState(Boolean(user))
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError('')
    try {
      const result = await documentService.list()
      setDocuments(result.documents)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (!user) return undefined
    let active = true
    documentService.list()
      .then((result) => {
        if (active) setDocuments(result.documents)
      })
      .catch((requestError) => {
        if (active) setError(requestError.message)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [user])

  const openDocument = useCallback(async (id) => {
    const result = await documentService.get(id)
    setActiveDocument(result.document)
    return result.document
  }, [])

  const createDocument = useCallback(async (title, content) => {
    const result = await documentService.create({ title, content })
    setDocuments((current) => [result.document, ...current])
    setActiveDocument(result.document)
    return result.document
  }, [])

  const saveDocument = useCallback(async (id, updates) => {
    const result = await documentService.update(id, updates)
    setActiveDocument((current) => current?.id === id ? result.document : current)
    setDocuments((current) => current.map((document) =>
      document.id === id ? { ...document, ...result.document } : document,
    ))
    return result.document
  }, [])

  const deleteDocument = useCallback(async (id) => {
    await documentService.remove(id)
    setDocuments((current) => current.filter((document) => document.id !== id))
    setActiveDocument((current) => current?.id === id ? null : current)
  }, [])

  const shareDocument = useCallback(async (id, email) => {
    const result = await documentService.share(id, email)
    setActiveDocument(result.document)
    setDocuments((current) => current.map((document) =>
      document.id === id ? { ...document, sharedWith: result.document.sharedWith } : document,
    ))
    return result.document
  }, [])

  const revokeShare = useCallback(async (id, userId) => {
    const result = await documentService.revoke(id, userId)
    setActiveDocument(result.document)
    setDocuments((current) => current.map((document) =>
      document.id === id ? { ...document, sharedWith: result.document.sharedWith } : document,
    ))
    return result.document
  }, [])

  return {
    documents,
    activeDocument,
    setActiveDocument,
    loading,
    error,
    refresh,
    openDocument,
    createDocument,
    saveDocument,
    deleteDocument,
    shareDocument,
    revokeShare,
  }
}
