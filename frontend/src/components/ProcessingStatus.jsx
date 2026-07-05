import { useEffect, useState } from 'react'
import { API_BASE, authToken } from '../api/client'

const STEPS = [
  { key: 'stt', label: 'STT 변환', desc: '음성을 텍스트로 변환합니다' },
  { key: 'diarization', label: '화자 분리', desc: '발화자를 구분합니다' },
  { key: 'summarization', label: 'AI 요약', desc: '3개 모델이 동시에 요약합니다' },
]

export default function ProcessingStatus({ fileId, onComplete, onError }) {
  const [stepStatus, setStepStatus] = useState({})
  const [messages, setMessages] = useState([])

  useEffect(() => {
    // EventSource는 헤더를 못 붙이므로 토큰을 쿼리스트링으로 전달
    const es = new EventSource(`${API_BASE}/api/process/${fileId}?token=${authToken()}`)

    es.onmessage = (event) => {
      const data = JSON.parse(event.data)

      if (data.step === 'complete') {
        es.close()
        onComplete(data.data)
        return
      }
      if (data.step === 'error') {
        es.close()
        onError(data.message)
        return
      }

      setStepStatus((prev) => ({
        ...prev,
        [data.step]: data.status,
      }))
      if (data.message) {
        setMessages((prev) => [...prev, data.message])
      }
    }

    es.onerror = () => {
      es.close()
      onError('처리 중 오류가 발생했습니다')
    }

    return () => es.close()
  }, [fileId, onComplete, onError])

  return (
    <div className="flex flex-col items-center gap-8 py-16 w-full max-w-md">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-c mb-1.5 tracking-tight">회의록 생성 중</h2>
        <p className="text-sm text-c-faint">잠시만 기다려 주세요</p>
      </div>

      <div className="w-full flex flex-col gap-2.5">
        {STEPS.map((step) => {
          const status = stepStatus[step.key]
          return (
            <div
              key={step.key}
              className={`flex items-center gap-4 px-4 py-3.5 rounded-xl border transition-all duration-300
                ${status === 'done' ? 'border-emerald-500/30 bg-emerald-500/5' :
                  status === 'processing' ? 'border-indigo-500/40 bg-indigo-500/5' :
                  'border-c bg-c-card opacity-50'}`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0
                ${status === 'done' ? 'bg-emerald-500/15 text-emerald-500' :
                  status === 'processing' ? 'bg-indigo-500/15 text-indigo-400' :
                  'bg-c-hover text-c-dim'}`}
              >
                {status === 'done' ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                ) : status === 'processing' ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span className="w-1.5 h-1.5 bg-current rounded-full" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${status ? 'text-c' : 'text-c-faint'}`}>{step.label}</p>
                <p className="text-xs text-c-faint mt-0.5">{step.desc}</p>
              </div>
            </div>
          )
        })}
      </div>

      {messages.length > 0 && (
        <p className="text-xs text-c-dim">{messages[messages.length - 1]}</p>
      )}
    </div>
  )
}
