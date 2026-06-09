import { useState } from 'react'
import { API_BASE, authHeaders } from '../api/client'

const STATUS = { idle: null, loading: 'loading', success: 'success', error: 'error' }

export default function SlackShare({ summary, keyDecisions, actionItems, transcriptCount }) {
  const [editedSummary, setEditedSummary] = useState(summary)
  const [editedDecisions, setEditedDecisions] = useState(keyDecisions)
  const [editedActions, setEditedActions] = useState(actionItems)
  const [isEditing, setIsEditing] = useState(false)
  const [status, setStatus] = useState(STATUS.idle)
  const [errorMsg, setErrorMsg] = useState('')

  const handleShare = async () => {
    setStatus(STATUS.loading)
    setErrorMsg('')
    try {
      const res = await fetch(`${API_BASE}/api/share/slack`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({
          summary: editedSummary,
          key_decisions: editedDecisions,
          action_items: editedActions,
          transcript_count: transcriptCount,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || 'Slack 전송 실패')
      }
      setStatus(STATUS.success)
    } catch (e) {
      setStatus(STATUS.error)
      setErrorMsg(e.message)
    }
  }

  const updateDecision = (i, val) =>
    setEditedDecisions(d => d.map((x, idx) => (idx === i ? val : x)))
  const deleteDecision = i =>
    setEditedDecisions(d => d.filter((_, idx) => idx !== i))
  const addDecision = () => setEditedDecisions(d => [...d, ''])

  const updateAction = (i, field, val) =>
    setEditedActions(a => a.map((x, idx) => (idx === i ? { ...x, [field]: val } : x)))
  const deleteAction = i =>
    setEditedActions(a => a.filter((_, idx) => idx !== i))
  const addAction = () => setEditedActions(a => [...a, { task: '', assignee: null }])

  const showContent = status === STATUS.idle || status === STATUS.error

  return (
    <div className="bg-[#1a1a1c] border border-[#2a2a2e] rounded-xl p-4 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-[#4A154B] rounded-md flex items-center justify-center flex-shrink-0">
            <SlackIcon />
          </div>
          <span className="text-sm font-medium text-gray-300">Slack으로 공유</span>
        </div>
        {showContent && (
          <button onClick={() => setIsEditing(!isEditing)} className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
            {isEditing ? '수정 완료' : '내용 수정'}
          </button>
        )}
      </div>

      {showContent && !isEditing && (
        <p className="text-xs text-gray-600">회의록을 검토하고 Slack 채널로 전송합니다.</p>
      )}

      {/* Content preview / edit */}
      {showContent && (
        <div className="bg-[#111113] border border-[#2a2a2e] rounded-lg p-3.5 flex flex-col gap-3">
          {/* Summary */}
          <div>
            <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest mb-1.5">핵심 요약</p>
            {isEditing ? (
              <textarea
                value={editedSummary}
                onChange={e => setEditedSummary(e.target.value)}
                className="w-full text-xs text-gray-300 bg-[#1a1a1c] border border-[#2a2a2e] rounded-lg p-2 resize-none outline-none min-h-[64px] focus:border-indigo-700"
              />
            ) : (
              <p className="text-xs text-gray-400 leading-relaxed whitespace-pre-line">{editedSummary}</p>
            )}
          </div>

          {(editedDecisions.length > 0 || isEditing) && (
            <div>
              <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest mb-1.5">결정사항</p>
              <ul className="flex flex-col gap-1.5">
                {editedDecisions.map((d, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-indigo-600 shrink-0 mt-0.5 text-xs">•</span>
                    {isEditing ? (
                      <>
                        <input value={d} onChange={e => updateDecision(i, e.target.value)}
                          className="flex-1 text-xs text-gray-300 bg-[#1a1a1c] border border-[#2a2a2e] rounded px-2 py-0.5 outline-none focus:border-indigo-700" />
                        <button onClick={() => deleteDecision(i)} className="text-red-700 hover:text-red-500 text-xs shrink-0 leading-5">✕</button>
                      </>
                    ) : (
                      <span className="text-xs text-gray-400">{d}</span>
                    )}
                  </li>
                ))}
                {isEditing && (
                  <li><button onClick={addDecision} className="text-xs text-indigo-500 hover:text-indigo-400 mt-0.5">+ 항목 추가</button></li>
                )}
              </ul>
            </div>
          )}

          {(editedActions.length > 0 || isEditing) && (
            <div>
              <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest mb-1.5">액션아이템</p>
              <ul className="flex flex-col gap-2">
                {editedActions.map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-4 h-4 bg-indigo-950 border border-indigo-900 text-indigo-500 rounded text-[10px] flex items-center justify-center font-bold shrink-0 mt-0.5">{i + 1}</span>
                    {isEditing ? (
                      <div className="flex-1 flex flex-col gap-1">
                        <input value={item.task} onChange={e => updateAction(i, 'task', e.target.value)} placeholder="작업 내용"
                          className="text-xs text-gray-300 bg-[#1a1a1c] border border-[#2a2a2e] rounded px-2 py-0.5 outline-none focus:border-indigo-700 w-full" />
                        <input value={item.assignee || ''} onChange={e => updateAction(i, 'assignee', e.target.value || null)} placeholder="담당자 (선택)"
                          className="text-[11px] text-gray-500 bg-[#1a1a1c] border border-[#2a2a2e] rounded px-2 py-0.5 outline-none focus:border-indigo-700 w-full" />
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">
                        {item.task}
                        {item.assignee && <span className="text-indigo-500"> ({item.assignee})</span>}
                      </span>
                    )}
                    {isEditing && (
                      <button onClick={() => deleteAction(i)} className="text-red-700 hover:text-red-500 text-xs shrink-0 mt-1">✕</button>
                    )}
                  </li>
                ))}
                {isEditing && (
                  <li><button onClick={addAction} className="text-xs text-indigo-500 hover:text-indigo-400 mt-0.5">+ 항목 추가</button></li>
                )}
              </ul>
            </div>
          )}
        </div>
      )}

      {status === STATUS.loading && (
        <div className="flex items-center gap-2.5 py-1">
          <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
          <div>
            <p className="text-xs font-medium text-gray-300">Slack으로 공유 중...</p>
            <p className="text-[11px] text-gray-600">n8n 처리로 수 초 소요될 수 있습니다</p>
          </div>
        </div>
      )}

      {status === STATUS.success && (
        <div className="flex items-center gap-2.5 py-1.5 bg-emerald-950/30 border border-emerald-900/30 rounded-lg px-3">
          <span className="text-emerald-400 text-sm">✓</span>
          <p className="text-xs font-medium text-emerald-400">Slack 채널에 공유되었습니다</p>
        </div>
      )}

      {status === STATUS.error && (
        <div className="flex items-center justify-between bg-red-950/20 border border-red-900/30 rounded-lg px-3 py-2">
          <div className="flex items-center gap-2">
            <span className="text-red-500 text-xs">⚠</span>
            <p className="text-xs text-red-400">{errorMsg}</p>
          </div>
          <button onClick={() => setStatus(STATUS.idle)} className="text-xs text-gray-600 hover:text-gray-400 ml-2">다시 시도</button>
        </div>
      )}

      {showContent && (
        <button
          onClick={isEditing ? () => setIsEditing(false) : handleShare}
          className={`w-full py-2 rounded-lg font-medium text-xs transition-colors flex items-center justify-center gap-2 ${
            isEditing
              ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
              : 'bg-[#4A154B] hover:bg-[#3d1140] text-white'
          }`}
        >
          {isEditing ? '수정 완료' : <><SlackIcon />Slack으로 공유하기</>}
        </button>
      )}
    </div>
  )
}

function SlackIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 122.8 122.8" fill="none">
      <path d="M25.8 77.6c0 7.1-5.8 12.9-12.9 12.9S0 84.7 0 77.6s5.8-12.9 12.9-12.9h12.9v12.9z" fill="#E01E5A" />
      <path d="M32.3 77.6c0-7.1 5.8-12.9 12.9-12.9s12.9 5.8 12.9 12.9v32.3c0 7.1-5.8 12.9-12.9 12.9s-12.9-5.8-12.9-12.9V77.6z" fill="#E01E5A" />
      <path d="M45.2 25.8c-7.1 0-12.9-5.8-12.9-12.9S38.1 0 45.2 0s12.9 5.8 12.9 12.9v12.9H45.2z" fill="#36C5F0" />
      <path d="M45.2 32.3c7.1 0 12.9 5.8 12.9 12.9s-5.8 12.9-12.9 12.9H12.9C5.8 58.1 0 52.3 0 45.2s5.8-12.9 12.9-12.9h32.3z" fill="#36C5F0" />
      <path d="M97 45.2c0-7.1 5.8-12.9 12.9-12.9s12.9 5.8 12.9 12.9-5.8 12.9-12.9 12.9H97V45.2z" fill="#2EB67D" />
      <path d="M90.5 45.2c0 7.1-5.8 12.9-12.9 12.9s-12.9-5.8-12.9-12.9V12.9C64.7 5.8 70.5 0 77.6 0s12.9 5.8 12.9 12.9v32.3z" fill="#2EB67D" />
      <path d="M77.6 97c7.1 0 12.9 5.8 12.9 12.9s-5.8 12.9-12.9 12.9-12.9-5.8-12.9-12.9V97h12.9z" fill="#ECB22E" />
      <path d="M77.6 90.5c-7.1 0-12.9-5.8-12.9-12.9s5.8-12.9 12.9-12.9h32.3c7.1 0 12.9 5.8 12.9 12.9s-5.8 12.9-12.9 12.9H77.6z" fill="#ECB22E" />
    </svg>
  )
}
