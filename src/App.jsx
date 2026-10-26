import { useCallback, useEffect, useRef, useState } from 'react'
import { FilePlus2, LoaderCircle, X } from 'lucide-react'
import './App.css'
import AuthScreen from './components/AuthScreen'
import DocumentEditor from './components/DocumentEditor'
import Header from './components/Header'
import ShareDialog from './components/ShareDialog'
import Sidebar from './components/Sidebar'
import { useDocuments } from './hooks/useDocuments'
import { apiRequest, clearToken, getToken } from './services/api'
import { importDocumentFile } from './services/importDocument'

export default function App() {
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(() => Boolean(getToken()))

  useEffect(() => {
    if (!getToken()) return
    apiRequest('/auth/me')
      .then((result) => setUser(result.user))
      .catch(() => clearToken())
      .finally(() => setAuthLoading(false))
  }, [])

  if (authLoading) {
    return <main className="loading-screen"><LoaderCircle className="spin" size={24} />Checking your account…</main>
  }
  if (!user) return <AuthScreen onAuthenticated={setUser} />
  return <Workspace key={user.id} user={user} onSignOut={() => { clearToken(); setUser(null) }} />
}

function Workspace({ user, onSignOut }) {
  const docs = useDocuments(user)
  const [showShare, setShowShare] = useState(false)
  const [notice, setNotice] = useState('')
  const [search, setSearch] = useState('')
  const flushRef = useRef(null)
  const registerFlush = useCallback((flush) => {
    flushRef.current = flush
  }, [])
  const requestedDocument = useRef(new URLSearchParams(window.location.search).get('doc'))
  const { documents, loading, openDocument } = docs

  useEffect(() => {
    const id = requestedDocument.current
    if (!id || loading) return
    requestedDocument.current = null
    if (!documents.some((document) => document.id === id)) {
      setNotice('That document is not available to your account.')
      return
    }
    openDocument(id).catch((error) => setNotice(error.message))
  }, [documents, loading, openDocument])

  function setDocumentUrl(id) {
    const url = new URL(window.location.href)
    if (id) url.searchParams.set('doc', id)
    else url.searchParams.delete('doc')
    window.history.replaceState({}, '', url)
  }

  async function leaveCurrentDocument() {
    if (!flushRef.current) return true
    const saved = await flushRef.current()
    if (saved) return true
    return window.confirm('Your latest changes could not be saved. Leave and discard those unsaved changes?')
  }

  async function selectDocument(id) {
    if (id === docs.activeDocument?.id || !(await leaveCurrentDocument())) return
    setNotice('')
    try {
      await docs.openDocument(id)
      setDocumentUrl(id)
    } catch (error) {
      setNotice(error.message)
    }
  }

  async function createDocument() {
    if (!(await leaveCurrentDocument())) return
    setNotice('')
    try {
      const document = await docs.createDocument('Untitled document', {
        type: 'doc',
        content: [{ type: 'paragraph' }],
      })
      setDocumentUrl(document.id)
    } catch (error) {
      setNotice(error.message)
    }
  }

  async function importFile(file) {
    try {
      const imported = await importDocumentFile(file)
      if (!(await leaveCurrentDocument())) return
      const document = await docs.createDocument(imported.title, imported.content)
      setDocumentUrl(document.id)
      setNotice('')
    } catch (error) {
      setNotice(error.message)
    }
  }

  async function removeDocument(document) {
    if (!window.confirm(`Delete “${document.title}”? This cannot be undone.`)) return
    const activeId = docs.activeDocument?.id
    if (document.id === activeId && !(await leaveCurrentDocument())) return
    try {
      await docs.deleteDocument(document.id)
      setNotice('')
      if (document.id === activeId) {
        const next = docs.documents.find((item) => item.id !== document.id)
        if (next) {
          await docs.openDocument(next.id)
          setDocumentUrl(next.id)
        } else {
          setDocumentUrl(null)
        }
      }
    } catch (error) {
      setNotice(error.message)
    }
  }

  async function signOut() {
    if (!(await leaveCurrentDocument())) return
    onSignOut()
  }

  return (
    <div className="app-shell">
      <Header
        user={user}
        activeDocument={docs.activeDocument}
        search={search}
        onSearch={setSearch}
        onShare={() => setShowShare(true)}
        onSignOut={() => void signOut()}
      />
      <div className="workspace">
        <Sidebar
          documents={docs.documents.filter((document) => document.title.toLocaleLowerCase().includes(search.toLocaleLowerCase()))}
          activeId={docs.activeDocument?.id}
          user={user}
          loading={docs.loading}
          onCreate={() => void createDocument()}
          onSelect={(id) => void selectDocument(id)}
          onDelete={(document) => void removeDocument(document)}
          onImport={importFile}
        />
        <main className="editor-main">
          {(notice || docs.error) && (
            <div className="notice" role="alert">
              <span>{notice || docs.error}</span>
              <button aria-label="Dismiss message" onClick={() => { setNotice(''); void docs.refresh() }}><X size={16} /></button>
            </div>
          )}
          {docs.loading && !docs.activeDocument ? (
            <div className="empty-state"><LoaderCircle className="spin" size={25} /><p>Loading your documents…</p></div>
          ) : docs.activeDocument ? (
            <DocumentEditor
              key={docs.activeDocument.id}
              document={docs.activeDocument}
              user={user}
              onSave={docs.saveDocument}
              registerFlush={registerFlush}
            />
          ) : (
            <div className="empty-state">
              <div className="empty-icon"><FilePlus2 size={24} /></div>
              <h1>{docs.documents.length ? 'Choose a document' : 'Your next great idea starts here'}</h1>
              <p>{docs.documents.length ? 'Select a document from the sidebar to continue editing.' : 'Create a document or import an existing file to get started.'}</p>
              {!docs.documents.length && <button className="primary-button" onClick={() => void createDocument()}>Create your first document</button>}
            </div>
          )}
        </main>
      </div>
      {showShare && docs.activeDocument && (
        <ShareDialog
          document={docs.activeDocument}
          onClose={() => setShowShare(false)}
          onShare={(email) => docs.shareDocument(docs.activeDocument.id, email)}
          onRevoke={(id) => docs.revokeShare(docs.activeDocument.id, id)}
        />
      )}
    </div>
  )
}
