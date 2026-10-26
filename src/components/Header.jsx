import { Bell, LogOut, Search, Share2 } from 'lucide-react'

export default function Header({ user, activeDocument, onShare, onSignOut, search, onSearch }) {
  const owned = activeDocument?.ownerId === user.id

  return (
    <header className="app-header">
      <div className="header-brand">
        <div className="brand-mark small"><span>A</span></div>
        <span>Ajaia <strong>Docs</strong></span>
      </div>
      <label className="header-search"><Search size={17} /><input aria-label="Search documents" placeholder="Search documents..." value={search} onChange={(event) => onSearch(event.target.value)} /></label>
      <div className="header-actions">
        <button className="icon-button notification-button" title="Notifications" aria-label="Notifications"><Bell size={18} /></button>
        {activeDocument && owned && (
          <button className="outline-button share-button" onClick={onShare}>
            <Share2 size={16} /> <span>Share</span>
          </button>
        )}
        <span className="user-email" title={user.email}>{user.email}</span>
        <button className="icon-button" title="Sign out" aria-label="Sign out" onClick={onSignOut}>
          <LogOut size={17} />
        </button>
      </div>
    </header>
  )
}
