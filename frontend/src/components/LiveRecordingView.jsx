import { useEffect, useRef, useState, useCallback } from 'react'
import { API_BASE, authHeaders } from '../api/client'
import { useLiveTranscription } from '../hooks/useLiveTranscription'

export default function LiveRecordingView({ onResultReady, onCancel }) {
  const { isRecording, finalLines, interim, error, start, stop, getFullTranscript } =
    useLiveTranscription()
  const [memo, setMemo] = useState('')
  const [summarizing, setSummarizing] = useState(false)
  const [splitPercent, setSplitPercent] = useState(60)
  const chatEndRef = useRef(null)
  const containerRef = useRef(null)
  const isDragging = useRef(false)

  useEffect(() => {
    start()
    return () => { stop() }
  }, [])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [finalLines, interim])

  const handleDragStart = useCallback((e) => {
    e.preventDefault()
    isDragging.current = true
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'

    const onMove = (e) => {
      if (!isDragging.current || !containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const pct = ((e.clientX - rect.left) / rect.width) * 100
      setSplitPercent(Math.min(Math.max(pct, 25), 78))
    }

    const onUp = () => {
      isDragging.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [])

  const handleStop = () => { stop() }

  const handleSummarize = async () => {
    const transcript = getFullTranscript()
    if (!transcript.trim()) return
    setSummarizing(true)
    try {
      const res = await fetch(`${API_BASE}/api/summarize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ transcript }),
      })
      const data = await res.json()
      onResultReady({
        transcript: finalLines.map((text, i) => ({
          start: i * 5,
          end: (i + 1) * 5,
          speaker: 'SPEAKER_00',
          text,
        })),
        summaries: data.summaries,
      })
    } catch {
      setSummarizing(false)
    }
  }

  const copyMemo = () => navigator.clipboard.writeText(memo).catch(() => {})

  return (
    <div ref={containerRef} className="flex flex-1 overflow-hidden">
      {/* ── Left: real-time transcript ── */}
      <div
        style={{ width: `${splitPercent}%` }}
        className="flex-shrink-0 flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="px-4 h-10 flex items-center justify-between border-b border-c flex-shrink-0">
          <div className="flex items-center gap-2">
            {isRecording && (
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse flex-shrink-0" />
            )}
            <span className="text-xs font-semibold text-c-muted uppercase tracking-wider">
              {isRecording ? '실시간 대화록' : '대화록'}
            </span>
          </div>
          <span className="text-[11px] text-c-dim">{finalLines.length}문장</span>
        </div>

        {/* Chat area */}
        <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-2">
          {finalLines.length === 0 && !interim && (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center">
              {isRecording ? (
                <>
                  <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                    <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                  </div>
                  <p className="text-sm text-c-faint">말씀해주세요</p>
                  <p className="text-xs text-c-dim">음성이 감지되면 자동으로 기록됩니다</p>
                </>
              ) : (
                <p className="text-sm text-c-dim">마이크 연결 중...</p>
              )}
            </div>
          )}

          {finalLines.map((line, i) => (
            <div key={i} className="flex gap-2.5 mt-1">
              <div className="w-6 h-6 rounded-full bg-blue-500/80 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="white">
                  <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="bg-blue-950/40 border border-blue-900/30 rounded-2xl rounded-tl-sm px-3 py-2">
                  <p className="text-xs text-c-soft leading-relaxed">{line}</p>
                </div>
              </div>
            </div>
          ))}

          {interim && (
            <div className="flex gap-2.5 mt-1 opacity-60">
              <div className="w-6 h-6 rounded-full bg-blue-500/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="white">
                  <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-xs text-c-faint italic px-1 py-1">{interim}…</p>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {error && (
          <div className="mx-4 mb-2 px-3 py-2 bg-red-950/30 border border-red-900/30 rounded-lg">
            <p className="text-xs text-red-400">{error}</p>
          </div>
        )}

        {/* Bottom controls */}
        <div className="border-t border-c px-4 py-3 flex items-center justify-between flex-shrink-0">
          {isRecording ? (
            <>
              <div className="flex items-center gap-2 text-xs text-red-400 font-medium">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                녹음 중
              </div>
              <button
                onClick={handleStop}
                className="flex items-center gap-2 px-4 py-1.5 bg-c-card border border-c2 hover:border-c-muted text-c-soft rounded-lg text-xs font-medium transition-colors"
              >
                <span className="w-3 h-3 bg-c-muted rounded-sm flex-shrink-0" />
                녹음 중지
              </button>
            </>
          ) : finalLines.length > 0 ? (
            <>
              <span className="text-xs text-c-faint">녹음 완료 · {finalLines.length}문장</span>
              <button
                onClick={handleSummarize}
                disabled={summarizing}
                className="flex items-center gap-2 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-medium transition-colors"
              >
                {summarizing ? (
                  <>
                    <span className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin flex-shrink-0" />
                    AI 요약 생성 중...
                  </>
                ) : '✨ AI 요약 생성'}
              </button>
            </>
          ) : (
            <button onClick={onCancel} className="text-xs text-c-faint hover:text-c-muted transition-colors">
              ← 돌아가기
            </button>
          )}
        </div>
      </div>

      {/* ── Drag handle ── */}
      <div
        onMouseDown={handleDragStart}
        className="group w-1.5 flex-shrink-0 bg-c-border hover:bg-indigo-600/60 cursor-col-resize transition-colors relative"
      >
        <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-px bg-c-border2 group-hover:bg-indigo-400 transition-colors" />
      </div>

      {/* ── Right: memo pad ── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <div className="px-4 h-10 flex items-center justify-between border-b border-c flex-shrink-0">
          <span className="text-xs font-semibold text-c-muted uppercase tracking-wider">메모</span>
          <button
            onClick={copyMemo}
            className="text-[11px] text-c-dim hover:text-c-muted transition-colors flex items-center gap-1"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
            </svg>
            복사
          </button>
        </div>
        <textarea
          value={memo}
          onChange={e => setMemo(e.target.value)}
          placeholder="회의 중 메모를 자유롭게 작성하세요&#10;&#10;— 결정사항&#10;— 액션아이템&#10;— 기타 메모"
          className="flex-1 bg-transparent text-sm text-c p-4 resize-none outline-none leading-7 font-mono"
          style={{ color: 'var(--c-text)', caretColor: 'var(--c-accent)' }}
          spellCheck={false}
        />
        {memo && (
          <div className="px-4 py-2 border-t border-c flex-shrink-0">
            <p className="text-[11px] text-c-ghost">{memo.length}자 · {memo.split('\n').filter(Boolean).length}줄</p>
          </div>
        )}
      </div>
    </div>
  )
}
