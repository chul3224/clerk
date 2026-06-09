const SPEAKER_COLORS = [
  { avatar: 'bg-blue-500',   bubble: 'bg-blue-950/50 border-blue-900/40',   name: 'text-blue-400'   },
  { avatar: 'bg-violet-500', bubble: 'bg-violet-950/50 border-violet-900/40', name: 'text-violet-400' },
  { avatar: 'bg-emerald-500',bubble: 'bg-emerald-950/50 border-emerald-900/40',name: 'text-emerald-400'},
  { avatar: 'bg-orange-500', bubble: 'bg-orange-950/50 border-orange-900/40', name: 'text-orange-400' },
  { avatar: 'bg-rose-500',   bubble: 'bg-rose-950/50 border-rose-900/40',   name: 'text-rose-400'   },
]

function formatTime(secs) {
  const s = Math.floor(secs)
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

export default function TranscriptView({ transcript, speakerNames, onSpeakerNameChange }) {
  const speakers = [...new Set(transcript.map(s => s.speaker))].sort()

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 h-10 flex items-center justify-between border-b border-[#2a2a2e] flex-shrink-0">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">대화록</span>
        <span className="text-[11px] text-gray-600">{transcript.length}개 발화</span>
      </div>

      {/* Speaker name tags */}
      <div className="px-4 py-2 border-b border-[#2a2a2e] flex flex-wrap gap-2 flex-shrink-0">
        {speakers.map((id, i) => {
          const c = SPEAKER_COLORS[i % SPEAKER_COLORS.length]
          return (
            <label key={id} className="flex items-center gap-1.5 cursor-text">
              <div className={`w-3.5 h-3.5 rounded-full ${c.avatar} flex items-center justify-center flex-shrink-0`}>
                <span className="text-white font-bold" style={{ fontSize: 7 }}>
                  {String.fromCharCode(65 + i)}
                </span>
              </div>
              <input
                className="bg-transparent text-xs text-gray-400 w-16 outline-none border-b border-transparent focus:border-gray-600 transition-colors placeholder-gray-700"
                value={speakerNames[id] || ''}
                placeholder={`화자 ${String.fromCharCode(65 + i)}`}
                onChange={e => onSpeakerNameChange(id, e.target.value)}
              />
            </label>
          )
        })}
      </div>

      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-1">
        {transcript.map((seg, i) => {
          const speakerIdx = speakers.indexOf(seg.speaker)
          const c = SPEAKER_COLORS[speakerIdx % SPEAKER_COLORS.length]
          const displayName = speakerNames[seg.speaker] || `화자 ${String.fromCharCode(65 + speakerIdx)}`
          const showHeader = i === 0 || transcript[i - 1].speaker !== seg.speaker

          return (
            <div key={i} className={`flex gap-2.5 ${showHeader ? 'mt-3' : 'mt-0.5'}`}>
              {showHeader ? (
                <div className={`w-7 h-7 rounded-full ${c.avatar} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                  <span className="text-white text-xs font-bold">
                    {String.fromCharCode(65 + speakerIdx)}
                  </span>
                </div>
              ) : (
                <div className="w-7 flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                {showHeader && (
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className={`text-xs font-semibold ${c.name}`}>{displayName}</span>
                    <span className="text-[10px] text-gray-700">{formatTime(seg.start)}</span>
                  </div>
                )}
                <div className={`px-3 py-2 rounded-2xl ${showHeader ? 'rounded-tl-sm' : ''} border ${c.bubble}`}>
                  <p className="text-xs text-gray-300 leading-relaxed">{seg.text}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
