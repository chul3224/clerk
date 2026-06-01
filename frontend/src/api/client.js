export const API_BASE = ''

export async function uploadAudio(file) {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch(`${API_BASE}/api/upload`, { method: 'POST', body: form })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: '업로드 실패' }))
    throw new Error(err.detail || '업로드 실패')
  }
  return res.json()
}
