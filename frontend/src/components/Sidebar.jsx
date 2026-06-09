import { useEffect, useState } from 'react'
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

export default function Sidebar({ user, onLogout, onNewMeeting, onSelectRecord, currentRecordId, refreshTrigger }) {
  const [history, setHistory] = useState([])

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
    <div className="w-[260px] flex-shrink-0 bg-[#161618] border-r border-[#2a2a2e] flex flex-col h-full select-none">
      {/* Logo */}
      <div className="px-4 h-12 flex items-center border-b border-[#2a2a2e] flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 bg-indigo-600 rounded-md flex items-center justify-center">
            <span className="text-white font-bold text-xs">C</span>
          </div>
          <span className="font-semibold text-white text-sm tracking-tight">Clerkai</span>
        </div>
      </div>

      {/* New meeting */}
      <div className="px-3 pt-3 pb-1 flex-shrink-0">
        <button
          onClick={onNewMeeting}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-[#222226] hover:text-gray-200 transition-colors"
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
            <p className="text-[11px] font-semibold text-gray-600 uppercase tracking-wider px-2 mb-1">{group}</p>
            {groups[group].map(record => (
              <button
                key={record.id}
                onClick={() => onSelectRecord(record)}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors group ${
                  currentRecordId === record.id
                    ? 'bg-[#27272b] text-white'
                    : 'text-gray-500 hover:bg-[#1e1e22] hover:text-gray-300'
                }`}
              >
                <p className="text-xs truncate leading-5">
                  {record.summary?.slice(0, 45) || '(요약 없음)'}
                </p>
                <p className="text-[10px] text-gray-700 mt-0.5">
                  {new Date(record.created_at).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                  {' · '}
                  {record.transcript_count}개 발화
                </p>
              </button>
            ))}
          </div>
        ))}
        {history.length === 0 && (
          <p className="text-xs text-gray-700 text-center py-10">회의록이 없습니다</p>
        )}
      </div>

      {/* User info */}
      {user && (
        <div className="border-t border-[#2a2a2e] px-4 py-3 flex items-center gap-2.5 flex-shrink-0">
          {user.avatar_url ? (
            <img src={user.avatar_url} alt={user.name} className="w-6 h-6 rounded-full flex-shrink-0" />
          ) : (
            <div className="w-6 h-6 bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-[10px] text-gray-300 font-semibold">{user.name?.[0]?.toUpperCase()}</span>
            </div>
          )}
          <span className="text-xs text-gray-400 flex-1 truncate">{user.name}</span>
          <button
            onClick={onLogout}
            className="text-[11px] text-gray-600 hover:text-gray-300 transition-colors flex-shrink-0"
          >
            나가기
          </button>
        </div>
      )}
    </div>
  )
}
