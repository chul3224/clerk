import { useState } from 'react'
import { API_BASE } from '../api/client'
import { useLiveTranscription } from '../hooks/useLiveTranscription'

export default function LiveRecorder({ onResultReady }) {
  const { isRecording, finalLines, interim, error, start, stop, getFullTranscript } =
    useLiveTranscription()
  const [summarizing, setSummarizing] = useState(false)

  const handleSummarize = async () => {
    const transcript = getFullTranscript()
    if (!transcript.trim()) return
    setSummarizing(true)
    try {
      const res = await fetch(`${API_BASE}/api/summarize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript }),
      })
      const data = await res.json()
      onResultReady({
        transcript: finalLines.map((text) => ({
          start: 0, end: 0, speaker: 'SPEAKER_A', text,
        })),
        summaries: data.summaries,
      })
    } catch {
      // 오류는 무시하고 계속
    }
    setSummarizing(false)
  }

  return (
    <div className="flex flex-col items-center gap-6 py-8">
      {/* 녹음 버튼 */}
      <button
        onClick={isRecording ? stop : start}
        className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-semibold text-white text-lg transition-all shadow-lg
          ${isRecording
            ? 'bg-red-500 hover:bg-red-600'
            : 'bg-blue-600 hover:bg-blue-700'}`}
      >
        {isRecording ? (
          <>
            <span className="w-4 h-4 bg-white rounded-sm" />
            녹음 중지
          </>
        ) : (
          <>
            <span className="w-4 h-4 bg-white rounded-full" />
            실시간 녹음 시작
          </>
        )}
      </button>

      {isRecording && (
        <div className="flex items-center gap-2 text-sm text-red-500 font-medium">
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          실시간 음성 인식 중...
        </div>
      )}

      {/* 실시간 자막 */}
      {(finalLines.length > 0 || interim) && (
        <div className="w-full max-w-2xl bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-800">실시간 기록</h3>
            <span className="text-xs text-gray-400">{finalLines.length}문장 완성</span>
          </div>
          <div className="text-sm text-gray-700 leading-loose min-h-12">
            {finalLines.map((line, i) => (
              <span key={i}>{line} </span>
            ))}
            {interim && (
              <span className="text-gray-400 italic">{interim}</span>
            )}
          </div>
        </div>
      )}

      {/* AI 요약 버튼 */}
      {!isRecording && finalLines.length > 0 && (
        <button
          onClick={handleSummarize}
          disabled={summarizing}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {summarizing ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              AI 요약 생성 중...
            </>
          ) : (
            '✨ AI 요약 생성'
          )}
        </button>
      )}

      {error && (
        <p className="text-red-500 text-sm bg-red-50 px-4 py-2 rounded-lg">{error}</p>
      )}
    </div>
  )
}
