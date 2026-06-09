import { useEffect, useState } from 'react'
import { API_BASE } from '../api/client'

// phase: enter → loading → ready → exit
export default function ServerWakeup({ onReady }) {
  const [elapsed, setElapsed] = useState(0)
  const [phase, setPhase] = useState('enter')
  const [visible, setVisible] = useState(false)
  const [checkVisible, setCheckVisible] = useState(false)

  // Trigger enter fade-in on next frame
  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true))
    const t = setTimeout(() => setPhase('loading'), 500)
    return () => { cancelAnimationFrame(raf); clearTimeout(t) }
  }, [])

  // Elapsed counter
  useEffect(() => {
    const timer = setInterval(() => setElapsed(e => e + 1), 1000)
    return () => clearInterval(timer)
  }, [])

  // Server health ping
  useEffect(() => {
    let cancelled = false

    const ping = async () => {
      for (let i = 0; i < 20; i++) {
        if (cancelled) return
        try {
          const res = await fetch(`${API_BASE}/health`, { cache: 'no-store' })
          if (res.ok && !cancelled) {
            setPhase('ready')
            setTimeout(() => setCheckVisible(true), 60)
            setTimeout(() => { if (!cancelled) setPhase('exit') }, 1500)
            setTimeout(() => { if (!cancelled) onReady() }, 2200)
            return
          }
        } catch { /* server not yet awake */ }
        await new Promise(r => setTimeout(r, 3000))
      }
      if (!cancelled) setPhase('failed')
    }

    ping()
    return () => { cancelled = true }
  }, [onReady])

  const isExiting = phase === 'exit'
  const isReady   = phase === 'ready' || phase === 'exit'
  const isFailed  = phase === 'failed'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden"
      style={{
        background: 'radial-gradient(ellipse at center, #0f0f14 0%, #08080a 65%)',
        opacity: visible && !isExiting ? 1 : 0,
        transform: isExiting ? 'scale(1.05)' : visible ? 'scale(1)' : 'scale(0.97)',
        transition: isExiting
          ? 'opacity 0.7s cubic-bezier(0.4,0,1,1), transform 0.7s cubic-bezier(0.4,0,1,1)'
          : 'opacity 0.6s ease, transform 0.6s ease',
      }}
    >
      {/* Ambient glow behind logo */}
      <div
        className="absolute w-96 h-96 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -60%)',
        }}
      />

      {/* Main content */}
      <div
        className="relative flex flex-col items-center gap-10"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(12px)',
          transition: 'opacity 0.7s ease 0.1s, transform 0.7s ease 0.1s',
        }}
      >
        {/* Logo mark */}
        <div
          className="flex flex-col items-center gap-4"
          style={{ animation: visible ? 'subtleFloat 4s ease-in-out 1.5s infinite' : 'none' }}
        >
          <div className="relative">
            {/* Outer glow */}
            <div
              className="absolute inset-0 rounded-3xl blur-2xl"
              style={{
                background: 'rgba(99,102,241,0.35)',
                transform: 'scale(1.4)',
                transition: 'opacity 0.5s ease',
                opacity: isReady ? 0.15 : 0.35,
              }}
            />
            {/* Logo box */}
            <div
              className="relative w-20 h-20 rounded-3xl flex items-center justify-center"
              style={{
                background: isReady
                  ? 'linear-gradient(135deg, #059669 0%, #10b981 100%)'
                  : 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
                boxShadow: isReady
                  ? '0 0 40px rgba(16,185,129,0.3), inset 0 1px 0 rgba(255,255,255,0.1)'
                  : '0 0 40px rgba(99,102,241,0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
                transition: 'background 0.6s ease, box-shadow 0.6s ease',
              }}
            >
              {!isReady ? (
                <span className="text-white font-bold text-3xl tracking-tighter select-none">C</span>
              ) : (
                <svg
                  width="32" height="32" viewBox="0 0 24 24"
                  fill="none" stroke="white" strokeWidth="2.5"
                  strokeLinecap="round" strokeLinejoin="round"
                  style={{
                    animation: checkVisible ? 'scalePop 0.45s cubic-bezier(0.34,1.56,0.64,1) forwards' : 'none',
                    opacity: checkVisible ? 1 : 0,
                  }}
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </div>
          </div>

          {/* Brand text */}
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white tracking-tight">Clerkai</h1>
            <p
              className="text-xs tracking-widest uppercase mt-1"
              style={{ color: '#3a3a4a' }}
            >
              AI Meeting Assistant
            </p>
          </div>
        </div>

        {/* Status section */}
        <div
          className="flex flex-col items-center gap-4"
          style={{
            opacity: phase !== 'enter' ? 1 : 0,
            transition: 'opacity 0.6s ease',
          }}
        >
          {/* Spinner / ready indicator */}
          {!isReady && !isFailed && (
            <div className="relative w-8 h-8">
              <div
                className="absolute inset-0 rounded-full border-2"
                style={{ borderColor: '#1e1e28' }}
              />
              <div
                className="absolute inset-0 rounded-full border-2 border-transparent border-t-indigo-500 animate-spin"
              />
            </div>
          )}

          {/* Status text */}
          <div className="flex flex-col items-center gap-1.5 min-h-[40px] justify-center">
            {isFailed ? (
              <>
                <p className="text-sm font-medium text-red-400">서버 연결 실패</p>
                <p className="text-xs text-gray-600">잠시 후 새로고침 해주세요</p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-2 px-4 py-1.5 text-xs text-gray-400 border border-[#2a2a2e] rounded-lg hover:border-gray-600 hover:text-gray-200 transition-colors"
                >
                  새로고침
                </button>
              </>
            ) : isReady ? (
              <p
                className="text-sm font-semibold text-emerald-400"
                style={{
                  animation: 'scalePop 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards',
                  opacity: 0,
                  animationDelay: '0.2s',
                  animationFillMode: 'forwards',
                }}
              >
                서버 준비 완료
              </p>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium" style={{ color: '#6b6b7a' }}>
                    서버 구동 중
                  </p>
                  {/* Animated dots */}
                  <div className="flex gap-1 items-center">
                    {[0, 1, 2].map(i => (
                      <span
                        key={i}
                        className="block w-1 h-1 rounded-full bg-indigo-500"
                        style={{
                          animation: `dotPulse 1.4s ease-in-out ${i * 220}ms infinite`,
                        }}
                      />
                    ))}
                  </div>
                </div>
                <p
                  className="text-xs"
                  style={{ color: '#2e2e3a' }}
                >
                  {elapsed > 0 ? `${elapsed}초 경과` : '잠시만 기다려주세요'}
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
