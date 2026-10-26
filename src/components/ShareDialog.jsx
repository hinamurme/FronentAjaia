import { useState } from 'react'
import { Copy, Link2, Mail, X } from 'lucide-react'

export default function ShareDialog({ document, onClose, onShare, onRevoke }) {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)

  async function addShare(event) {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      await onShare(email)
      setEmail('')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  async function copyLink() {
    try {
      const url = new URL(window.location.href)
      url.searchParams.set('doc', document.id)
      await navigator.clipboard.writeText(url.toString())
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      setError('Could not copy the link. Copy the address from your browser instead.')
    }
  }

  async function revoke(userId) {
    setError('')
    try {
      await onRevoke(userId)
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose()
    }}>
      <section className="share-modal" role="dialog" aria-modal="true" aria-labelledby="share-title">
        <div className="modal-heading">
          <div>
            <h2 id="share-title">Share document</h2>
            <p>Invite a registered user to view this document.</p>
          </div>
          <button className="icon-button" aria-label="Close" onClick={onClose}><X size={18} /></button>
        </div>
        <form className="share-form" onSubmit={addShare}>
          <label htmlFor="share-email">Email address</label>
          <div className="share-input-row">
            <div className="share-input-wrap"><Mail size={16} /><input id="share-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@example.com" required /></div>
            <button className="primary-button" disabled={busy}>{busy ? 'Inviting…' : 'Invite'}</button>
          </div>
        </form>
        <div className="share-link-row">
          <div><Link2 size={16} /><span>Anyone with access must sign in</span></div>
          <button className="outline-button" onClick={copyLink}><Copy size={15} />{copied ? 'Copied' : 'Copy link'}</button>
        </div>
        {error && <div className="form-error" role="alert">{error}</div>}
        <div className="share-list-heading">People with access</div>
        <div className="share-list">
          {document.sharedWith?.length ? document.sharedWith.map((person) => (
            <div className="share-person" key={person.id || person}>
              <div className="person-avatar">{(person.email || 'U')[0].toUpperCase()}</div>
              <div className="person-info"><span>{person.email || 'Shared user'}</span><small>Viewer</small></div>
              <button className="revoke-button" onClick={() => revoke(person.id || person)} aria-label={`Revoke access for ${person.email || 'user'}`}>Remove</button>
            </div>
          )) : <p className="empty-shares">Only you have access right now.</p>}
        </div>
      </section>
    </div>
  )
}
