import { useState } from 'react'

function formatTime(secs) {
  const s = Math.floor(secs)
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

const COLORS = [
  'bg-blue-100 text-blue-800',
  'bg-purple-100 text-purple-800',
  'bg-green-100 text-green-800',
  'bg-orange-100 text-orange-800',
]

export default function TranscriptView({ transcript, speakerNames, onSpeakerNameChange }) {
  const speakers = [...new Set(transcript.map((s) => s.speaker))].sort()

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900">대화록</h3>
        <span className="text-sm text-gray-400">{transcript.length}개 발화</span>
      </div>

      {/* 화자 이름 편집 */}
      <div className="flex flex-wrap gap-2 mb-5 pb-5 border-b border-gray-100">
        {speakers.map((id, i) => (
          <div key={id} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${COLORS[i % COLORS.length]}`}>
            <span className="text-xs font-medium opacity-60">{id}</span>
            <span className="text-xs">→</span>
            <input
              className="bg-transparent text-xs font-semibold w-20 outline-none border-b border-current"
              value={speakerNames[id] || ''}
              placeholder="이름 입력"
              onChange={(e) => onSpeakerNameChange(id, e.target.value)}
            />
          </div>
        ))}
      </div>

      {/* 대화 내용 */}
      <div className="flex flex-col gap-3 pr-1">
        {transcript.map((seg, i) => {
          const colorIdx = speakers.indexOf(seg.speaker) % COLORS.length
          const displayName = speakerNames[seg.speaker] || seg.speaker
          return (
            <div key={i} className="flex gap-3">
              <span className="text-xs text-gray-400 pt-1 shrink-0 w-10">{formatTime(seg.start)}</span>
              <div className="flex-1">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded mr-2 ${COLORS[colorIdx]}`}>
                  {displayName}
                </span>
                <span className="text-gray-800 text-sm">{seg.text}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
