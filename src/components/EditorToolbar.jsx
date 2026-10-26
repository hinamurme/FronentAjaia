import {
  Bold, Heading1, Heading2, Italic, List, ListOrdered, Underline,
} from 'lucide-react'

function ToolbarButton({ label, active, disabled, onClick, children }) {
  return (
    <button
      type="button"
      className={`toolbar-button ${active ? 'active' : ''}`}
      aria-label={label}
      title={label}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

export default function EditorToolbar({ editor, disabled }) {
  if (!editor) return null
  const chain = () => editor.chain().focus()

  return (
    <div className="editor-toolbar" role="toolbar" aria-label="Text formatting">
      <ToolbarButton label="Bold" active={editor.isActive('bold')} disabled={disabled} onClick={() => chain().toggleBold().run()}>
        <Bold size={17} />
      </ToolbarButton>
      <ToolbarButton label="Italic" active={editor.isActive('italic')} disabled={disabled} onClick={() => chain().toggleItalic().run()}>
        <Italic size={17} />
      </ToolbarButton>
      <ToolbarButton label="Underline" active={editor.isActive('underline')} disabled={disabled} onClick={() => chain().toggleUnderline().run()}>
        <Underline size={17} />
      </ToolbarButton>
      <span className="toolbar-divider" />
      <ToolbarButton label="Heading 1" active={editor.isActive('heading', { level: 1 })} disabled={disabled} onClick={() => chain().toggleHeading({ level: 1 }).run()}>
        <Heading1 size={18} />
      </ToolbarButton>
      <ToolbarButton label="Heading 2" active={editor.isActive('heading', { level: 2 })} disabled={disabled} onClick={() => chain().toggleHeading({ level: 2 }).run()}>
        <Heading2 size={18} />
      </ToolbarButton>
      <span className="toolbar-divider" />
      <ToolbarButton label="Bullet list" active={editor.isActive('bulletList')} disabled={disabled} onClick={() => chain().toggleBulletList().run()}>
        <List size={18} />
      </ToolbarButton>
      <ToolbarButton label="Numbered list" active={editor.isActive('orderedList')} disabled={disabled} onClick={() => chain().toggleOrderedList().run()}>
        <ListOrdered size={18} />
      </ToolbarButton>
    </div>
  )
}
