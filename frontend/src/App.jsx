import { useState } from 'react'
import DownloadButtons from './components/DownloadButtons'
import LiveRecorder from './components/LiveRecorder'
import ModelComparison from './components/ModelComparison'
import ProcessingStatus from './components/ProcessingStatus'
import ServerWakeup from './components/ServerWakeup'
import TranscriptView from './components/TranscriptView'
import UploadZone from './components/UploadZone'

export default function App() {
  const [stage, setStage] = useState('wakeup') // wakeup | upload | processing | result | error
  const [mode, setMode] = useState('file') // file | live
  const [fileId, setFileId] = useState(null)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [speakerNames, setSpeakerNames] = useState({})

  const handleFileUploaded = (id) => {
    setFileId(id)
    setStage('processing')
  }

  const handleComplete = (data) => {
    const speakers = [...new Set(data.transcript.map((s) => s.speaker))].sort()
    const defaultNames = {}
    speakers.forEach((id, i) => {
      defaultNames[id] = `화자 ${String.fromCharCode(65 + i)}`
    })
    setSpeakerNames(defaultNames)
    setResult(data)
    setStage('result')
  }

  const handleError = (msg) => {
    setError(msg)
    setStage('error')
  }

  const reset = () => {
    setStage('upload')
    setFileId(null)
    setResult(null)
    setError(null)
    setSpeakerNames({})
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button onClick={reset} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">C</span>
            </div>
            <span className="text-xl font-bold text-gray-900">Clerkai</span>
          </button>
          {stage !== 'wakeup' && stage !== 'upload' && (
            <button onClick={reset} className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
              새 회의록 분석
            </button>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {stage === 'wakeup' && <ServerWakeup onReady={() => setStage('upload')} />}

        {stage === 'upload' && (
          <div className="flex flex-col gap-6">
            {/* 모드 탭 */}
            <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit mx-auto">
              <button
                onClick={() => setMode('file')}
                className={`px-5 py-2 rounded-lg text-sm font-medium transition-all
                  ${mode === 'file' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                📁 파일 업로드
              </button>
              <button
                onClick={() => setMode('live')}
                className={`px-5 py-2 rounded-lg text-sm font-medium transition-all
                  ${mode === 'live' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                🎙️ 실시간 녹음
              </button>
            </div>

            {mode === 'file' && <UploadZone onFileUploaded={handleFileUploaded} />}
            {mode === 'live' && <LiveRecorder onResultReady={handleComplete} />}
          </div>
        )}

        {stage === 'processing' && (
          <ProcessingStatus fileId={fileId} onComplete={handleComplete} onError={handleError} />
        )}

        {stage === 'error' && (
          <div className="flex flex-col items-center gap-6 py-16 text-center">
            <div className="text-5xl">⚠️</div>
            <div>
              <p className="text-xl font-bold text-gray-900 mb-2">처리 중 오류가 발생했습니다</p>
              <p className="text-gray-500 text-sm max-w-md">{error}</p>
            </div>
            <button onClick={reset} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium">
              다시 시도
            </button>
          </div>
        )}

        {stage === 'result' && result && (
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">분석 결과</h2>
              <span className="text-sm text-gray-400">
                {result.transcript.length}개 발화
              </span>
            </div>

            <TranscriptView
              transcript={result.transcript}
              speakerNames={speakerNames}
              onSpeakerNameChange={(id, name) =>
                setSpeakerNames((prev) => ({ ...prev, [id]: name }))
              }
            />

            <ModelComparison summaryA={result.summary_a} summaryB={result.summary_b} />

            <DownloadButtons
              transcript={result.transcript}
              speakerNames={speakerNames}
              summaryA={result.summary_a}
              summaryB={result.summary_b}
            />
          </div>
        )}
      </main>
    </div>
  )
}
