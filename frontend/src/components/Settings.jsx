import { useState } from 'react'
import { API_BASE, authHeaders } from '../api/client'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'

const SECTIONS = [
  { id: 'appearance',    label: '모양' },
  { id: 'integrations',  label: '연동' },
  { id: 'account',       label: '계정' },
  { id: 'data',          label: '데이터' },
]

const THEME_OPTIONS = [
  {
    id: 'light',
    label: '밝음',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
        <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
      </svg>
    ),
  },
  {
    id: 'dark',
    label: '어두움',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
      </svg>
    ),
  },
  {
    id: 'system',
    label: '기기 설정',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    ),
  },
]

export default function Settings({ onClose }) {
  const { theme, setTheme } = useTheme()
  const { user, logout } = useAuth()
  const [section, setSection] = useState('appearance')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleteStatus, setDeleteStatus] = useState(null) // null | 'deleting' | 'done' | 'error'
  const [difyStatus, setDifyStatus]   = useState(null)  // null | {configured, dataset_id}
  const [difyPush, setDifyPush]       = useState(null)  // null | 'pushing' | {pushed,failed} | 'error'

  const checkDify = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/dify/status`, { headers: authHeaders() })
      if (res.ok) setDifyStatus(await res.json())
    } catch { setDifyStatus({ configured: false }) }
  }

  const handleDifyPushAll = async () => {
    setDifyPush('pushing')
    try {
      const res = await fetch(`${API_BASE}/api/dify/push-all`, {
        method: 'POST', headers: authHeaders(),
      })
      if (res.ok) setDifyPush(await res.json())
      else setDifyPush('error')
    } catch { setDifyPush('error') }
  }

  const handleDeleteAll = async () => {
    setDeleteStatus('deleting')
    try {
      const res = await fetch(`${API_BASE}/api/history`, {
        method: 'DELETE',
        headers: authHeaders(),
      })
      if (res.ok) {
        setDeleteStatus('done')
        setConfirmDelete(false)
      } else {
        setDeleteStatus('error')
      }
    } catch {
      setDeleteStatus('error')
    }
  }

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div
        className="relative z-10 flex w-full max-w-[540px] min-h-[400px] rounded-2xl overflow-hidden shadow-2xl border border-c"
        style={{ background: 'var(--c-panel)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Left nav ── */}
        <div
          className="w-[160px] flex-shrink-0 flex flex-col gap-0.5 p-3 border-r border-c"
          style={{ background: 'var(--c-bg)' }}
        >
          <div className="px-2 py-2 mb-1">
            <p className="text-xs font-semibold text-c-dim uppercase tracking-wider">설정</p>
          </div>
          {SECTIONS.map(s => (
            <button
              key={s.id}
              onClick={() => setSection(s.id)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                section === s.id
                  ? 'bg-c-active text-c font-medium'
                  : 'text-c-faint hover:bg-c-hover hover:text-c'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* ── Right content ── */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-c flex-shrink-0">
            <h2 className="text-sm font-semibold text-c">
              {SECTIONS.find(s => s.id === section)?.label}
            </h2>
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-md text-c-dim hover:text-c hover:bg-c-hover transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-5">

            {/* ── 모양 ── */}
            {section === 'appearance' && (
              <div className="space-y-6">
                <div>
                  <p className="text-xs font-semibold text-c-dim uppercase tracking-wider mb-3">테마</p>
                  <div className="flex gap-2">
                    {THEME_OPTIONS.map(opt => (
                      <button
                        key={opt.id}
                        onClick={() => setTheme(opt.id)}
                        className={`flex-1 flex flex-col items-center gap-2 py-4 rounded-xl border transition-all text-sm font-medium ${
                          theme === opt.id
                            ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400'
                            : 'border-c bg-c-card text-c-muted hover:border-c2 hover:text-c'
                        }`}
                      >
                        <span className={theme === opt.id ? 'text-indigo-400' : 'text-c-dim'}>
                          {opt.icon}
                        </span>
                        {opt.label}
                        {theme === opt.id && (
                          <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── 연동 ── */}
            {section === 'integrations' && (
              <div className="space-y-5">
                {/* Dify */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-semibold text-c-dim uppercase tracking-wider">Dify 지식베이스</p>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">RAG</span>
                  </div>
                  <p className="text-xs text-c-faint mb-4">
                    회의록을 Dify 지식베이스에 자동 적재합니다.<br />
                    Railway에 <code className="text-indigo-400 text-[11px]">DIFY_API_KEY</code> / <code className="text-indigo-400 text-[11px]">DIFY_DATASET_ID</code> 설정 필요.
                  </p>

                  {/* Status check */}
                  {!difyStatus ? (
                    <button
                      onClick={checkDify}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-c text-c-muted hover:bg-c-hover hover:text-c transition-colors"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0118.8-4.3M22 12.5a10 10 0 01-18.8 4.2"/>
                      </svg>
                      연결 상태 확인
                    </button>
                  ) : difyStatus.configured ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-emerald-900/20 border border-emerald-800/30 text-emerald-400 text-sm">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        연결됨 — 새 회의록은 자동으로 Dify에 적재됩니다
                      </div>
                      {typeof difyPush === 'object' && difyPush !== null ? (
                        <div className="text-xs text-c-muted px-1">
                          ✓ {difyPush.pushed}건 전송 완료{difyPush.failed > 0 && ` / ${difyPush.failed}건 실패`}
                        </div>
                      ) : (
                        <button
                          onClick={handleDifyPushAll}
                          disabled={difyPush === 'pushing'}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-indigo-500/40 text-indigo-400 hover:bg-indigo-500/10 disabled:opacity-50 transition-colors"
                        >
                          {difyPush === 'pushing' ? (
                            <><span className="w-3 h-3 border border-indigo-400 border-t-transparent rounded-full animate-spin" />전송 중...</>
                          ) : (
                            <>
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
                                <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3"/>
                              </svg>
                              기존 회의록 전체 Dify 전송
                            </>
                          )}
                        </button>
                      )}
                      {difyPush === 'error' && (
                        <p className="text-xs text-red-400 px-1">전송 중 오류가 발생했습니다.</p>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-amber-900/20 border border-amber-800/30 text-amber-400 text-sm">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                      </svg>
                      환경변수 미설정 — Railway에 API KEY를 추가하세요
                    </div>
                  )}
                </div>

                {/* n8n */}
                <div className="pt-4 border-t border-c">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-semibold text-c-dim uppercase tracking-wider">n8n 자동화</p>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">ACTIVE</span>
                  </div>
                  <p className="text-xs text-c-faint">
                    회의 완료 시 n8n Webhook으로 Slack·Notion·Gmail 자동 전송.<br/>
                    Railway <code className="text-indigo-400 text-[11px]">N8N_WEBHOOK_URL</code> 설정됨.
                  </p>
                </div>
              </div>
            )}

            {/* ── 계정 ── */}
            {section === 'account' && (
              <div className="space-y-5">
                {/* Profile card */}
                <div className="flex items-center gap-3.5 p-4 rounded-xl border border-c bg-c-card">
                  {user?.avatar_url ? (
                    <img src={user.avatar_url} alt={user.name} className="w-10 h-10 rounded-full flex-shrink-0" />
                  ) : (
                    <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-sm font-bold">{user?.name?.[0]?.toUpperCase()}</span>
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-c truncate">{user?.name}</p>
                    <p className="text-xs text-c-dim mt-0.5">Slack 계정 연동됨</p>
                  </div>
                </div>

                {/* Logout */}
                <div className="pt-1 border-t border-c">
                  <p className="text-xs text-c-dim mb-3 mt-3">로그아웃하면 Slack 인증이 해제됩니다.</p>
                  <button
                    onClick={() => { logout(); onClose() }}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-red-400 border border-red-900/40 hover:bg-red-900/20 hover:border-red-700/50 transition-colors"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    로그아웃
                  </button>
                </div>
              </div>
            )}

            {/* ── 데이터 ── */}
            {section === 'data' && (
              <div className="space-y-5">
                <div>
                  <p className="text-xs font-semibold text-c-dim uppercase tracking-wider mb-1">회의록 기록</p>
                  <p className="text-xs text-c-faint mb-4">저장된 모든 회의록 요약과 기록을 삭제합니다. 이 작업은 되돌릴 수 없습니다.</p>

                  {deleteStatus === 'done' ? (
                    <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-emerald-900/20 border border-emerald-800/30 text-emerald-400 text-sm">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      모든 회의록이 삭제되었습니다
                    </div>
                  ) : confirmDelete ? (
                    <div className="p-4 rounded-xl border border-red-900/40 bg-red-950/20">
                      <p className="text-sm text-red-300 font-medium mb-1">정말 삭제하시겠습니까?</p>
                      <p className="text-xs text-red-500/70 mb-4">모든 회의록이 영구적으로 삭제됩니다.</p>
                      <div className="flex gap-2">
                        <button
                          onClick={handleDeleteAll}
                          disabled={deleteStatus === 'deleting'}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white transition-colors"
                        >
                          {deleteStatus === 'deleting' ? (
                            <><span className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />삭제 중...</>
                          ) : '전체 삭제'}
                        </button>
                        <button
                          onClick={() => setConfirmDelete(false)}
                          className="px-4 py-2 rounded-lg text-sm text-c-muted border border-c hover:bg-c-hover transition-colors"
                        >
                          취소
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDelete(true)}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-red-400 border border-red-900/40 hover:bg-red-900/20 hover:border-red-700/50 transition-colors"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2" />
                      </svg>
                      전체 회의록 삭제
                    </button>
                  )}

                  {deleteStatus === 'error' && (
                    <p className="text-xs text-red-400 mt-2">오류가 발생했습니다. 다시 시도해주세요.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
