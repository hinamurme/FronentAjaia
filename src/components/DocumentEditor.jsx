import { useCallback, useEffect, useRef, useState } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import { Cloud, CloudUpload, RotateCw } from 'lucide-react'
import EditorToolbar from './EditorToolbar'

export default function DocumentEditor({ document, user, onSave, registerFlush }) {
  const readOnly = document.ownerId !== user.id
  const [title, setTitle] = useState(document.title)
  const [saveState, setSaveState] = useState('saved')
  const [saveError, setSaveError] = useState('')
  const timeoutRef = useRef(null)
  const pendingRef = useRef(false)
  const inFlightRef = useRef(null)
  const titleRef = useRef(title)
  const editorRef = useRef(null)
  const saveNowRef = useRef(null)

  useEffect(() => {
    titleRef.current = title
  }, [title])

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] }, underline: false }),
      Underline,
    ],
    content: document.content,
    editable: !readOnly,
    onUpdate() {
      pendingRef.current = true
      setSaveState('saving')
      setSaveError('')
      window.clearTimeout(timeoutRef.current)
      timeoutRef.current = window.setTimeout(() => void saveNowRef.current?.(), 800)
    },
  })

  useEffect(() => {
    editorRef.current = editor
  }, [editor])

  const saveNow = useCallback(async () => {
    window.clearTimeout(timeoutRef.current)
    if (inFlightRef.current) {
      const saved = await inFlightRef.current
      if (!saved) return false
      return pendingRef.current ? saveNowRef.current() : true
    }
    if (!pendingRef.current || readOnly || !editorRef.current) return true

    const request = (async () => {
      try {
        while (pendingRef.current) {
          pendingRef.current = false
          setSaveState('saving')
          await onSave(document.id, {
            title: titleRef.current,
            content: editorRef.current.getJSON(),
          })
        }
        setSaveState('saved')
        setSaveError('')
        return true
      } catch (error) {
        pendingRef.current = true
        setSaveState('error')
        setSaveError(error.message)
        return false
      }
    })()
    inFlightRef.current = request
    const saved = await request
    if (inFlightRef.current === request) inFlightRef.current = null
    return saved
  }, [document.id, onSave, readOnly])

  useEffect(() => {
    saveNowRef.current = saveNow
    registerFlush(saveNow)
    return () => {
      window.clearTimeout(timeoutRef.current)
      registerFlush(null)
    }
  }, [registerFlush, saveNow])

  useEffect(() => {
    function warnBeforeLeaving(event) {
      if (pendingRef.current || inFlightRef.current) {
        event.preventDefault()
        event.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', warnBeforeLeaving)
    return () => window.removeEventListener('beforeunload', warnBeforeLeaving)
  }, [])

  function updateTitle(value) {
    setTitle(value)
    titleRef.current = value
    pendingRef.current = true
    setSaveState('saving')
    setSaveError('')
    window.clearTimeout(timeoutRef.current)
    timeoutRef.current = window.setTimeout(() => void saveNowRef.current?.(), 800)
  }

  return (
    <section className="editor-panel">
      <div className="document-heading">
        <input
          className="document-title-input"
          aria-label="Document title"
          value={title}
          maxLength={200}
          readOnly={readOnly}
          onChange={(event) => updateTitle(event.target.value)}
          onBlur={() => {
            if (!titleRef.current.trim()) {
              setTitle('Untitled document')
              titleRef.current = 'Untitled document'
              pendingRef.current = true
              void saveNowRef.current?.()
            }
          }}
        />
        <div className={`save-indicator ${saveState}`} aria-live="polite">
          {saveState === 'saving' ? <CloudUpload size={15} /> : saveState === 'error' ? <RotateCw size={14} /> : <Cloud size={15} />}
          <span>{saveState === 'saving' ? 'Saving…' : saveState === 'error' ? 'Not saved' : 'Saved'}</span>
        </div>
      </div>
      {readOnly && <div className="readonly-note">You have view-only access to this shared document.</div>}
      <EditorToolbar editor={editor} disabled={readOnly} />
      {saveError && (
        <div className="save-error" role="alert">
          <span>{saveError} Your changes are still here.</span>
          <button onClick={() => void saveNowRef.current?.()}>Retry save</button>
        </div>
      )}
      <div className="page-scroll">
        <div className={`paper ${readOnly ? 'read-only' : ''}`}>
          <EditorContent editor={editor} />
        </div>
      </div>
    </section>
  )
}
