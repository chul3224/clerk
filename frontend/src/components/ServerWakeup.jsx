import { useEffect, useState } from 'react'
import { API_BASE } from '../api/client'

export default function ServerWakeup({ onReady }) {
  const [elapsed, setElapsed] = useState(0)
  const [status, setStatus] = useState('waking') // waking | ready | failed

  useEffect(() => {
    let cancelled = false
    const timer = setInterval(() => setElapsed((e) => e + 1), 1000)

    const ping = async () => {
      for (let i = 0; i < 20; i++) {
        if (cancelled) return
        try {
          const res = await fetch(`${API_BASE}/health`, { cache: 'no-store' })
          if (res.ok) {
            if (!cancelled) {
              setStatus('ready')
              clearInterval(timer)
              setTimeout(onReady, 800)
            }
            return
          }
        } catch {
          // 아직 준비 중
        }
        await new Promise((r) => setTimeout(r, 3000))
      }
      if (!cancelled) setStatus('failed')
    }

    ping()
    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [onReady])

  if (status === 'ready') {
    return (
      <div className="flex flex-col items-center gap-4 py-24 text-center">
        <div className="text-4xl">✅</div>
        <p className="text-lg font-semibold text-green-600">서버 준비 완료!</p>
      </div>
    )
  }

  if (status === 'failed') {
    return (
      <div className="flex flex-col items-center gap-4 py-24 text-center">
        <div className="text-4xl">⚠️</div>
        <p className="text-lg font-bold text-gray-800">서버 연결 실패</p>
        <p className="text-sm text-gray-500">잠시 후 새로고침 해주세요</p>
        <button
          onClick={() => window.location.reload()}
          className="px-5 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700"
        >
          새로고침
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-6 py-24 text-center">
      <div className="relative w-16 h-16">
        <div className="w-16 h-16 border-4 border-blue-100 rounded-full" />
        <div className="absolute inset-0 w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
      <div>
        <p className="text-xl font-bold text-gray-900 mb-1">서버 준비 중...</p>
        <p className="text-sm text-gray-500">
          무료 서버가 잠에서 깨어나고 있습니다 ({elapsed}초)
        </p>
        <p className="text-xs text-gray-400 mt-1">보통 30~50초 소요됩니다</p>
      </div>
    </div>
  )
}
