import { useState } from 'react'
import UploadZone from './UploadZone'

export default function WelcomeScreen({ user, onStartRecording, onFileUploaded }) {
  const [showUpload, setShowUpload] = useState(false)
  const firstName = user?.name?.split(' ')[0] || user?.name || '사용자'

  return (
    <div className="flex flex-col items-center justify-center h-full gap-10 select-none">
      {/* Greeting */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-c mb-3 tracking-tight">
          안녕하세요, {firstName}님
        </h1>
        <p className="text-c-faint text-base leading-relaxed">
          회의를 시작하면 AI가 실시간으로 기록하고<br />
          자동으로 회의록을 정리해드립니다
        </p>
      </div>

      {/* Record button */}
      <button
        onClick={onStartRecording}
        className="group relative flex items-center justify-center"
        aria-label="회의 녹음 시작"
      >
        <span className="absolute w-36 h-36 rounded-full bg-red-500/10 group-hover:bg-red-500/20 transition-all duration-500 animate-pulse" />
        <span className="absolute w-28 h-28 rounded-full border border-red-500/20 group-hover:border-red-500/40 transition-all duration-300" />
        <span className="relative w-20 h-20 rounded-full bg-red-500 group-hover:bg-red-400 flex items-center justify-center shadow-2xl shadow-red-500/40 group-hover:shadow-red-500/60 group-hover:scale-105 transition-all duration-300">
          <MicIcon />
        </span>
      </button>

      <p className="text-sm font-medium text-c-muted -mt-4">
        클릭해서 회의 녹음 시작
      </p>

      {/* Divider */}
      <div className="flex items-center gap-4 w-56">
        <div className="flex-1 h-px bg-c-border" />
        <span className="text-xs text-c-dim font-medium">또는</span>
        <div className="flex-1 h-px bg-c-border" />
      </div>

      {/* File upload (secondary) */}
      {!showUpload ? (
        <button
          onClick={() => setShowUpload(true)}
          className="flex items-center gap-2 text-sm text-c-dim hover:text-c-muted transition-colors -mt-4"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          녹음 파일 업로드
        </button>
      ) : (
        <div className="w-full max-w-md -mt-4">
          <UploadZone onFileUploaded={onFileUploaded} />
        </div>
      )}
    </div>
  )
}

function MicIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" fill="white" stroke="none" />
      <path d="M19 10v2a7 7 0 01-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  )
}
