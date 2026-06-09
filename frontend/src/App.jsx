import { useState, useRef, useCallback } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import DownloadButtons from './components/DownloadButtons'
import LiveRecordingView from './components/LiveRecordingView'
import MindmapView from './components/MindmapView'
import ModelComparison from './components/ModelComparison'
import ModelResult from './components/ModelResult'
import ProcessingStatus from './components/ProcessingStatus'
import ServerWakeup from './components/ServerWakeup'
import Settings from './components/Settings'
import Sidebar from './components/Sidebar'
import SlackShare from './components/SlackShare'
import TranscriptView from './components/TranscriptView'
import WelcomeScreen from './components/WelcomeScreen'

const TAB_OPTIONS = [
  { id: 'A',       label: '모델 A' },
  { id: 'B',       label: '모델 B' },
  { id: 'C',       label: '모델 C' },
  { id: 'compare', label: '비교 보기' },
  { id: 'mindmap', label: '마인드맵' },
]

export default function App() {
  const { user, loading, logout } = useAuth()

  const [stage, setStage] = useState('wakeup')
  const [mode, setMode] = useState('file')
  const [fileId, setFileId] = useState(null)
  const [result, setResult] = useState(null)
  const [historyView, setHistoryView] = useState(null)
  const [error, setError] = useState(null)
  const [speakerNames, setSpeakerNames] = useState({})
  const [openTabs, setOpenTabs] = useState(['A'])
  const [activeTab, setActiveTab] = useState('A')
  const [sidebarRefresh, setSidebarRefresh] = useState(0)
  const [showSettings, setShowSettings] = useState(false)
  const [splitPercent, setSplitPercent] = useState(62)
  const splitContainerRef = useRef(null)
  const isDragging = useRef(false)

  const handleDragStart = useCallback((e) => {
    e.preventDefault()
    isDragging.current = true
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'

    const onMove = (e) => {
      if (!isDragging.current || !splitContainerRef.current) return
      const rect = splitContainerRef.current.getBoundingClientRect()
      const pct = ((e.clientX - rect.left) / rect.width) * 100
      setSplitPercent(Math.min(Math.max(pct, 20), 78))
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

  if (loading) return (
    <div className="h-screen bg-c-bg flex items-center justify-center">
      <div className="w-7 h-7 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!user) return <Navigate to="/login" replace />

  if (stage === 'wakeup') return <ServerWakeup onReady={() => setStage('upload')} />

  /* ---- helpers ---- */

  const resetToUpload = () => {
    setStage('upload')
    setFileId(null)
    setResult(null)
    setHistoryView(null)
    setError(null)
    setSpeakerNames({})
    setOpenTabs(['A'])
    setActiveTab('A')
  }

  const handleFileUploaded = (id) => {
    setFileId(id)
    setHistoryView(null)
    setStage('processing')
  }

  const handleComplete = (data) => {
    const speakers = [...new Set(data.transcript.map(s => s.speaker))].sort()
    const names = {}
    speakers.forEach((id, i) => { names[id] = `화자 ${String.fromCharCode(65 + i)}` })
    setSpeakerNames(names)
    setResult(data)
    setHistoryView(null)
    setStage('result')
    setOpenTabs(['A'])
    setActiveTab('A')
    setSidebarRefresh(n => n + 1)
  }

  const handleError = (msg) => { setError(msg); setStage('error') }

  const handleSelectHistory = (record) => {
    setHistoryView(record)
    setResult(null)
    setSpeakerNames({})
    setStage('result')
    setOpenTabs(['A'])
    setActiveTab('A')
  }

  /* ---- tab management ---- */

  const openTab = (id) => {
    if (!openTabs.includes(id)) setOpenTabs(prev => [...prev, id])
    setActiveTab(id)
  }

  const closeTab = (id) => {
    const remaining = openTabs.filter(t => t !== id)
    if (!remaining.length) return
    setOpenTabs(remaining)
    if (activeTab === id) setActiveTab(remaining[remaining.length - 1])
  }

  /* ---- derived data ---- */

  const summaries = result?.summaries || (historyView ? [{
    model: 'Llama 3.3 70B',
    label: 'Meta · Groq',
    model_id: 'llama-3.3-70b-versatile',
    summary: historyView.summary,
    key_decisions: historyView.key_decisions || [],
    action_items: historyView.action_items || [],
    response_time_ms: 0,
    token_count: 0,
  }] : [])

  const availableTabs = result ? TAB_OPTIONS : historyView ? [TAB_OPTIONS[0]] : []
  const closedTabs = availableTabs.filter(t => !openTabs.includes(t.id))
  const modelAForSlack = summaries[0]
  const hasSlack = modelAForSlack && !modelAForSlack.summary?.startsWith('오류')

  /* ---- tab content renderer ---- */

  const renderTab = (tabId) => {
    if (tabId === 'compare') return <ModelComparison summaries={summaries} />
    if (tabId === 'mindmap') {
      const best = summaries[0]
      return best && !best.summary?.startsWith('오류') ? (
        <MindmapView summary={best.summary} keyDecisions={best.key_decisions} actionItems={best.action_items} />
      ) : (
        <p className="text-sm text-c-faint py-12 text-center">요약 데이터가 없습니다</p>
      )
    }
    const idx = { A: 0, B: 1, C: 2 }[tabId] ?? 0
    return <ModelResult summary={summaries[idx]} />
  }

  /* ---- render ---- */

  return (
    <div className="flex h-screen bg-c-bg text-c overflow-hidden">
      <Sidebar
        user={user}
        onLogout={logout}
        onNewMeeting={resetToUpload}
        onSelectRecord={handleSelectHistory}
        currentRecordId={historyView?.id}
        refreshTrigger={sidebarRefresh}
        onOpenSettings={() => setShowSettings(true)}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* ── upload (welcome screen) ── */}
        {stage === 'upload' && (
          <WelcomeScreen
            user={user}
            onStartRecording={() => setStage('live_recording')}
            onFileUploaded={handleFileUploaded}
          />
        )}

        {/* ── live recording ── */}
        {stage === 'live_recording' && (
          <LiveRecordingView
            onResultReady={handleComplete}
            onCancel={() => setStage('upload')}
          />
        )}

        {/* ── processing ── */}
        {stage === 'processing' && (
          <Centered>
            <ProcessingStatus fileId={fileId} onComplete={handleComplete} onError={handleError} />
          </Centered>
        )}

        {/* ── error ── */}
        {stage === 'error' && (
          <Centered>
            <div className="flex flex-col items-center gap-5 text-center">
              <div className="text-4xl">⚠️</div>
              <div>
                <p className="text-base font-semibold text-c mb-2">처리 중 오류가 발생했습니다</p>
                <p className="text-sm text-c-faint max-w-sm">{error}</p>
              </div>
              <button onClick={resetToUpload} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors">
                다시 시도
              </button>
            </div>
          </Centered>
        )}

        {/* ── result ── */}
        {stage === 'result' && (result || historyView) && (
          <div ref={splitContainerRef} className="flex flex-1 overflow-hidden">
            {/* Left: transcript (live only) */}
            {result?.transcript && (
              <>
                <div
                  style={{ width: `${splitPercent}%` }}
                  className="flex-shrink-0 overflow-hidden flex flex-col"
                >
                  <TranscriptView
                    transcript={result.transcript}
                    speakerNames={speakerNames}
                    onSpeakerNameChange={(id, name) =>
                      setSpeakerNames(prev => ({ ...prev, [id]: name }))
                    }
                  />
                </div>

                {/* Drag handle */}
                <div
                  onMouseDown={handleDragStart}
                  className="group w-1.5 flex-shrink-0 bg-c-border hover:bg-indigo-600/60 active:bg-indigo-500 cursor-col-resize transition-colors relative"
                  title="드래그해서 크기 조절"
                >
                  <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-px bg-c-border2 group-hover:bg-indigo-400 transition-colors" />
                </div>
              </>
            )}

            {/* Right: tabs */}
            <div className="flex-1 flex flex-col overflow-hidden min-w-0">
              {/* Model selector — only closed tabs shown */}
              {closedTabs.length > 0 && (
                <div className="px-4 py-2 border-b border-c flex items-center gap-2 flex-shrink-0 bg-c-bg">
                  <span className="text-[11px] text-c-ghost mr-1">열기</span>
                  {closedTabs.map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => openTab(tab.id)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-indigo-950/50 border border-indigo-800/40 text-indigo-400 hover:bg-indigo-900/50 hover:text-indigo-300 transition-colors"
                    >
                      <span className="text-indigo-600 text-[10px]">+</span>
                      {tab.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Cursor-style tab bar */}
              <div className="flex border-b border-c bg-c-bg overflow-x-auto flex-shrink-0">
                {openTabs.map(tabId => {
                  const tab = TAB_OPTIONS.find(t => t.id === tabId)
                  const isActive = activeTab === tabId
                  return (
                    <div
                      key={tabId}
                      onClick={() => setActiveTab(tabId)}
                      className={`flex items-center gap-2 px-4 py-2.5 text-xs cursor-pointer border-r border-c whitespace-nowrap select-none transition-colors ${
                        isActive
                          ? 'bg-c-card text-c border-b-2 border-b-indigo-500 -mb-px'
                          : 'text-c-dim hover:text-c-muted hover:bg-c-panel'
                      }`}
                    >
                      {isActive && <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full flex-shrink-0" />}
                      <span>{tab?.label}</span>
                      {openTabs.length > 1 && (
                        <button
                          onClick={e => { e.stopPropagation(); closeTab(tabId) }}
                          className="text-c-ghost hover:text-c-muted text-[11px] leading-none ml-0.5 flex-shrink-0"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Tab content */}
              <div className="flex-1 overflow-y-auto p-6">
                {renderTab(activeTab)}
              </div>

              {/* Bottom bar */}
              {(hasSlack || result) && (
                <div className="border-t border-c p-4 flex flex-col gap-3 flex-shrink-0">
                  {hasSlack && (
                    <SlackShare
                      summary={modelAForSlack.summary}
                      keyDecisions={modelAForSlack.key_decisions}
                      actionItems={modelAForSlack.action_items}
                      transcriptCount={result?.transcript.length || historyView?.transcript_count || 0}
                    />
                  )}
                  {result && (
                    <DownloadButtons
                      transcript={result.transcript}
                      speakerNames={speakerNames}
                      summaries={summaries}
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Settings modal */}
      {showSettings && <Settings onClose={() => setShowSettings(false)} />}
    </div>
  )
}

function Centered({ children }) {
  return (
    <div className="flex-1 flex items-center justify-center p-10 overflow-auto">
      {children}
    </div>
  )
}
