import { FilePlus2, FileText, MoreHorizontal, Plus, Trash2, Upload } from 'lucide-react'
import { useRef } from 'react'

function formatDate(value) {
  if (!value) return ''
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(new Date(value))
}

export default function Sidebar({ documents, activeId, user, loading, onCreate, onSelect, onDelete, onImport }) {
  const fileInput = useRef(null)

  async function chooseFile(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (file) await onImport(file)
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-actions">
        <button className="primary-button new-document-button" onClick={onCreate}>
          <Plus size={17} /> New document
        </button>
        <button className="outline-button import-button" onClick={() => fileInput.current?.click()}>
          <Upload size={16} /> Import file
        </button>
        <input ref={fileInput} className="visually-hidden" type="file" accept=".txt,.md,.docx" onChange={chooseFile} />
      </div>
      <div className="sidebar-section-title">
        <span>YOUR DOCUMENTS</span>
        <button className="subtle-icon" aria-label="Create document" title="Create document" onClick={onCreate}>
          <FilePlus2 size={16} />
        </button>
      </div>
      {loading ? (
        <div className="sidebar-message">Loading documents…</div>
      ) : documents.length === 0 ? (
        <div className="sidebar-message">Your documents will appear here.</div>
      ) : (
        <nav className="document-list" aria-label="Documents">
          {documents.map((document) => {
            const isOwner = document.ownerId === user.id
            return (
              <div className={`document-row ${activeId === document.id ? 'selected' : ''}`} key={document.id}>
                <button className="document-select" onClick={() => onSelect(document.id)}>
                  <FileText size={16} className="document-icon" />
                  <span className="document-label">
                    <span className="document-title">{document.title}</span>
                    <span className="document-date">{isOwner ? 'Edited' : 'Shared'} {formatDate(document.updatedAt)}</span>
                  </span>
                </button>
                {isOwner && (
                  <button
                    className="delete-document"
                    aria-label={`Delete ${document.title}`}
                    title="Delete document"
                    onClick={() => onDelete(document)}
                  >
                    <Trash2 size={15} />
                  </button>
                )}
                {!isOwner && <MoreHorizontal className="shared-indicator" size={15} aria-label="Shared with you" />}
              </div>
            )
          })}
        </nav>
      )}
      <div className="sidebar-footer"><span className="status-dot" /> Changes save automatically</div>
    </aside>
  )
}
