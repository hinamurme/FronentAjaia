const MAX_FILE_SIZE = 5 * 1024 * 1024

function escapeHtml(value) {
  return value.replace(/[&<>"]/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
  })[character])
}

function markdownToHtml(markdown) {
  const lines = markdown.split(/\r?\n/)
  const output = []
  let listType = null
  const closeList = () => {
    if (listType) output.push(`</${listType}>`)
    listType = null
  }

  for (const line of lines) {
    const heading = line.match(/^(#{1,3})\s+(.+)$/)
    const ordered = line.match(/^\s*\d+[.)]\s+(.+)$/)
    const bullet = line.match(/^\s*[-*+]\s+(.+)$/)
    if (heading) {
      closeList()
      const level = heading[1].length
      output.push(`<h${level}>${escapeHtml(heading[2])}</h${level}>`)
    } else if (ordered || bullet) {
      const nextType = ordered ? 'ol' : 'ul'
      if (listType !== nextType) {
        closeList()
        listType = nextType
        output.push(`<${listType}>`)
      }
      const text = (ordered || bullet)[1]
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
      output.push(`<li>${escapeHtml(text).replace(/&lt;(strong|\/strong|em|\/em)&gt;/g, '<$1>')}</li>`)
    } else {
      closeList()
      if (line.trim()) {
        const text = escapeHtml(line)
          .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
          .replace(/\*(.+?)\*/g, '<em>$1</em>')
        output.push(`<p>${text}</p>`)
      } else {
        output.push('<p></p>')
      }
    }
  }
  closeList()
  return output.join('')
}

function marksFor(element, inherited = []) {
  const marks = [...inherited]
  const tag = element.tagName?.toLowerCase()
  if (['strong', 'b'].includes(tag) && !marks.some((mark) => mark.type === 'bold')) {
    marks.push({ type: 'bold' })
  }
  if (['em', 'i'].includes(tag) && !marks.some((mark) => mark.type === 'italic')) {
    marks.push({ type: 'italic' })
  }
  if (tag === 'u' && !marks.some((mark) => mark.type === 'underline')) {
    marks.push({ type: 'underline' })
  }
  return marks
}

function inlineContent(node, marks = []) {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent ? [{ type: 'text', text: node.textContent, ...(marks.length ? { marks } : {}) }] : []
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return []
  const nextMarks = marksFor(node, marks)
  return [...node.childNodes].flatMap((child) => inlineContent(child, nextMarks))
}

function blocksFrom(element) {
  const nodes = []
  for (const child of element.children) {
    const tag = child.tagName.toLowerCase()
    if (tag === 'ul' || tag === 'ol') {
      const items = [...child.children]
        .filter((item) => item.tagName.toLowerCase() === 'li')
        .map((item) => {
          const content = blocksFrom(item)
          if (!content.some((block) => block.type === 'paragraph' || block.type === 'heading')) {
            const inline = inlineContent(item)
            content.unshift({ type: 'paragraph', ...(inline.length ? { content: inline } : {}) })
          }
          return { type: 'listItem', content }
        })
      nodes.push({ type: tag === 'ul' ? 'bulletList' : 'orderedList', content: items })
    } else if (/^h[1-3]$/.test(tag)) {
      nodes.push({
        type: 'heading',
        attrs: { level: Number(tag[1]) },
        content: inlineContent(child),
      })
    } else if (tag === 'p' || tag === 'div' || tag === 'li') {
      nodes.push({ type: 'paragraph', content: inlineContent(child) })
    } else {
      nodes.push(...blocksFrom(child))
    }
  }
  return nodes
}

export async function importDocumentFile(file) {
  const extension = file.name.split('.').pop()?.toLowerCase()
  if (!['txt', 'md', 'docx'].includes(extension)) {
    throw new Error('Unsupported file type. Choose a .txt, .md, or .docx file.')
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('This file is too large. The maximum import size is 5 MB.')
  }

  let html
  if (extension === 'docx') {
    try {
      const { default: mammoth } = await import('mammoth')
      const result = await mammoth.convertToHtml({ arrayBuffer: await file.arrayBuffer() })
      html = result.value
    } catch {
      throw new Error('This DOCX file could not be read. Try exporting it again from Word.')
    }
  } else {
    const text = await file.text()
    html = extension === 'md' ? markdownToHtml(text) : text.split(/\r?\n/).map((line) => `<p>${escapeHtml(line)}</p>`).join('')
  }

  const parsed = new DOMParser().parseFromString(html, 'text/html')
  const content = blocksFrom(parsed.body)
  return {
    title: file.name.replace(/\.[^.]+$/, '').slice(0, 200) || 'Imported document',
    content: { type: 'doc', content: content.length ? content : [{ type: 'paragraph' }] },
  }
}
