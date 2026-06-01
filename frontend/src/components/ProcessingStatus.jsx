import { useEffect, useState } from 'react'
import { API_BASE } from '../api/client'

const STEPS = [
  { key: 'stt', label: 'STT 변환', icon: '🔤' },
  { key: 'diarization', label: '화자 분리', icon: '👥' },
  { key: 'summarization', label: 'AI 요약', icon: '✨' },
]

export default function ProcessingStatus({ fileId, onComplete, onError }) {
  const [stepStatus, setStepStatus] = useState({})
  const [messages, setMessages] = useState([])

  useEffect(() => {
    const es = new EventSource(`${API_BASE}/api/process/${fileId}`)

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
    <div className="flex flex-col items-center gap-8 py-16">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">처리 중...</h2>
        <p className="text-gray-500">잠시만 기다려 주세요</p>
      </div>

      <div className="w-full max-w-md flex flex-col gap-4">
        {STEPS.map((step, i) => {
          const status = stepStatus[step.key]
          return (
            <div
              key={step.key}
              className={`flex items-center gap-4 p-4 rounded-xl border transition-all
                ${status === 'done' ? 'border-green-200 bg-green-50' :
                  status === 'processing' ? 'border-blue-200 bg-blue-50' :
                  'border-gray-200 bg-white opacity-50'}`}
            >
              <span className="text-2xl">{step.icon}</span>
              <div className="flex-1">
                <p className={`font-medium ${status === 'done' ? 'text-green-700' : status === 'processing' ? 'text-blue-700' : 'text-gray-400'}`}>
                  {step.label}
                </p>
              </div>
              <div className="w-6 h-6 flex items-center justify-center">
                {status === 'done' && <span className="text-green-500 text-lg">✓</span>}
                {status === 'processing' && (
                  <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                )}
              </div>
            </div>
          )
        })}
      </div>

      {messages.length > 0 && (
        <p className="text-sm text-gray-400">{messages[messages.length - 1]}</p>
      )}
    </div>
  )
}
