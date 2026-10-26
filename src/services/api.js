const API_URL = import.meta.env.VITE_API_URL || 'https://ajaia-doc-editor-mzic.onrender.com/api'

export function getToken() {
  return window.localStorage.getItem('ajaia-token')
}

export function setToken(token) {
  window.localStorage.setItem('ajaia-token', token)
}

export function clearToken() {
  window.localStorage.removeItem('ajaia-token')
}

export async function apiRequest(path, options = {}) {
  const headers = new Headers(options.headers)
  const token = getToken()
  if (token) headers.set('Authorization', `Bearer ${token}`)
  if (options.body) headers.set('Content-Type', 'application/json')

  let response
  try {
    response = await fetch(`${API_URL}${path}`, { ...options, headers })
  } catch {
    throw new Error('Could not connect to the server. Check that the backend is running.')
  }
  let result
  try {
    result = await response.json()
  } catch {
    throw new Error('The server returned an invalid response.')
  }
  if (!response.ok || !result.success) {
    throw new Error(result.error || `Request failed (${response.status})`)
  }
  return result.data
}
