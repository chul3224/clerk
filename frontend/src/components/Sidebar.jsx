import { useEffect, useRef, useState } from 'react'
import { API_BASE, authHeaders } from '../api/client'

function timeGroup(dateStr) {
  const d = new Date(dateStr)
  const now = new Date()
  const diffDays = Math.floor((now - d) / 86400000)
  if (diffDays === 0) return '오늘'
  if (diffDays === 1) return '어제'
  if (diffDays < 7) return '이번 주'
  return '이전'
}

const GROUP_ORDER = ['오늘', '어제', '이번 주', '이전']

export default function Sidebar({
  user, onLogout, onNewMeeting, onSelectRecord,
  currentRecordId, refreshTrigger, onOpenSettings,
}) {
  const [history, setHistory]       = useState([])
  const [difyPushed, setDifyPushed] = useState({}) // { [record_id]: 'pushing' | 'done' | 'error' }

  const pushToDify = async (e, recordId) => {
    e.stopPropagation()
    setDifyPushed(p => ({ ...p, [recordId]: 'pushing' }))
    try {
      const res = await fetch(`${API_BASE}/api/dify/push/${recordId}`, {
        method: 'POST', headers: authHeaders(),
      })
      setDifyPushed(p => ({ ...p, [recordId]: res.ok ? 'done' : 'error' }))
    } catch {
      setDifyPushed(p => ({ ...p, [recordId]: 'error' }))
    }
  }

  useEffect(() => {
    fetch(`${API_BASE}/api/history`, { headers: authHeaders() })
      .then(r => r.ok ? r.json() : [])
      .then(data => setHistory(Array.isArray(data) ? data : []))
      .catch(() => {})
  }, [refreshTrigger])

  const groups = {}
  history.forEach(r => {
    const g = timeGroup(r.created_at)
    if (!groups[g]) groups[g] = []
    groups[g].push(r)
  })

  return (
    <div className="w-[260px] flex-shrink-0 bg-c-panel border-r border-c flex flex-col h-full select-none">
      {/* Logo */}
      <div className="px-4 h-12 flex items-center border-b border-c flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 bg-indigo-600 rounded-md flex items-center justify-center">
            <span className="text-white font-bold text-xs">C</span>
          </div>
          <span className="font-semibold text-c text-sm tracking-tight">Clerkai</span>
        </div>
      </div>

      {/* New meeting */}
      <div className="px-3 pt-3 pb-1 flex-shrink-0">
        <button
          onClick={onNewMeeting}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-c-muted hover:bg-c-hover hover:text-c transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          새 회의록
        </button>
      </div>

      {/* History list */}
      <div className="flex-1 overflow-y-auto px-3 py-1">
        {GROUP_ORDER.filter(g => groups[g]).map(group => (
          <div key={group} className="mb-4">
            <p className="text-[11px] font-semibold text-c-dim uppercase tracking-wider px-2 mb-1">{group}</p>
            {groups[group].map(record => (
              <div
                key={record.id}
                className={`relative group flex items-center rounded-lg transition-colors ${
                  currentRecordId === record.id
                    ? 'bg-c-active'
                    : 'hover:bg-c-hover2'
                }`}
              >
                <button
                  onClick={() => onSelectRecord(record)}
                  className={`flex-1 text-left px-3 py-2 min-w-0 ${
                    currentRecordId === record.id ? 'text-c' : 'text-c-faint hover:text-c-soft'
                  }`}
                >
                  <p className="text-xs truncate leading-5">
                    {record.summary?.slice(0, 40) || '(요약 없음)'}
                  </p>
                  <p className="text-[10px] text-c-ghost mt-0.5">
                    {new Date(record.created_at).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                    {' · '}{record.transcript_count}개 발화
                  </p>
                </button>

                {/* Dify push button — visible on hover */}
                <button
                  onClick={e => pushToDify(e, record.id)}
                  title="Dify 지식베이스에 저장"
                  className={`flex-shrink-0 mr-1.5 w-6 h-6 rounded flex items-center justify-center transition-all
                    opacity-0 group-hover:opacity-100
                    ${difyPushed[record.id] === 'done'  ? 'text-emerald-400' :
                      difyPushed[record.id] === 'error' ? 'text-red-400' :
                      'text-c-dim hover:text-indigo-400 hover:bg-c-hover'}`}
                >
                  {difyPushed[record.id] === 'pushing' ? (
                    <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                  ) : difyPushed[record.id] === 'done' ? (
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                  ) : difyPushed[record.id] === 'error' ? (
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  ) : (
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
                      <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3"/>
                    </svg>
                  )}
                </button>
              </div>
            ))}
          </div>
        ))}
        {history.length === 0 && (
          <p className="text-xs text-c-ghost text-center py-10">회의록이 없습니다</p>
        )}
      </div>

      {/* User info + settings */}
      {user && (
        <div className="border-t border-c px-3 py-2 flex items-center gap-2 flex-shrink-0">
          {user.avatar_url ? (
            <img src={user.avatar_url} alt={user.name} className="w-6 h-6 rounded-full flex-shrink-0" />
          ) : (
            <div className="w-6 h-6 bg-indigo-700 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-[10px] text-white font-semibold">{user.name?.[0]?.toUpperCase()}</span>
            </div>
          )}
          <span className="text-xs text-c-muted flex-1 truncate">{user.name}</span>

          {/* Settings gear icon */}
          <button
            onClick={onOpenSettings}
            title="설정"
            className="w-6 h-6 flex items-center justify-center rounded-md text-c-dim hover:text-c hover:bg-c-hover transition-colors flex-shrink-0"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}
