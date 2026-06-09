import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_BASE, authHeaders } from '../api/client'
import { useAuth } from '../contexts/AuthContext'

export default function History() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)

  useEffect(() => {
    fetch(`${API_BASE}/api/history`, { headers: authHeaders() })
      .then((r) => r.json())
      .then(setRecords)
      .catch(() => setRecords([]))
      .finally(() => setLoading(false))
  }, [])

  const handleDelete = async (id, e) => {
    e.stopPropagation()
    if (!confirm('이 회의록을 삭제하시겠습니까?')) return
    await fetch(`${API_BASE}/api/history/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    })
    setRecords((prev) => prev.filter((r) => r.id !== id))
  }

  const formatDate = (iso) => {
    if (!iso) return ''
    const d = new Date(iso)
    return d.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/')} className="text-gray-400 hover:text-gray-600 transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">C</span>
              </div>
              <span className="text-xl font-bold text-gray-900">회의록 히스토리</span>
            </div>
          </div>
          <span className="text-sm text-gray-400">{user?.name}</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : records.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <div className="text-5xl mb-4">📋</div>
            <p className="text-lg font-medium text-gray-500">저장된 회의록이 없습니다</p>
            <p className="text-sm mt-1">회의록을 분석하면 자동으로 저장됩니다</p>
            <button
              onClick={() => navigate('/')}
              className="mt-6 px-5 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700"
            >
              새 회의록 분석
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {records.map((r) => (
              <div
                key={r.id}
                className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden cursor-pointer hover:border-blue-200 transition-colors"
                onClick={() => setExpanded(expanded === r.id ? null : r.id)}
              >
                <div className="px-5 py-4 flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-gray-400">{formatDate(r.created_at)}</span>
                      <span className="text-xs text-gray-300">·</span>
                      <span className="text-xs text-gray-400">발화 {r.transcript_count}개</span>
                    </div>
                    <p className="text-sm text-gray-700 line-clamp-2">{r.summary}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={(e) => handleDelete(r.id, e)}
                      className="text-gray-300 hover:text-red-400 transition-colors p-1"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 6h18M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                    <svg
                      width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                      className={`text-gray-400 transition-transform ${expanded === r.id ? 'rotate-180' : ''}`}
                    >
                      <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>

                {expanded === r.id && (
                  <div className="border-t border-gray-100 px-5 py-4 bg-gray-50 flex flex-col gap-4">
                    {r.key_decisions.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">결정사항</p>
                        <ul className="flex flex-col gap-1">
                          {r.key_decisions.map((d, i) => (
                            <li key={i} className="text-sm text-gray-700 flex gap-2">
                              <span className="text-blue-400 mt-0.5">•</span>{d}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {r.action_items.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">액션아이템</p>
                        <ul className="flex flex-col gap-1">
                          {r.action_items.map((a, i) => (
                            <li key={i} className="text-sm text-gray-700 flex gap-2">
                              <span className="text-green-400 mt-0.5">✓</span>
                              <span>{a.task}{a.assignee ? ` (${a.assignee})` : ''}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
