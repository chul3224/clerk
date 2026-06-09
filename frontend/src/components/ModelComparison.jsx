const ACCENT = [
  { border: 'border-blue-800/40',   badge: 'bg-blue-950/50 text-blue-400'   },
  { border: 'border-violet-800/40', badge: 'bg-violet-950/50 text-violet-400'},
  { border: 'border-emerald-800/40',badge: 'bg-emerald-950/50 text-emerald-400'},
]

function MetricBadge({ label, value, accent }) {
  return (
    <div className={`flex flex-col items-center px-3 py-2 rounded-lg ${accent}`}>
      <span className="text-[10px] text-gray-500">{label}</span>
      <span className="text-xs font-bold text-gray-300 mt-0.5">{value}</span>
    </div>
  )
}

function SummaryCard({ summary, index }) {
  const acc = ACCENT[index % ACCENT.length]
  const isError = summary.summary?.startsWith('오류') || summary.summary?.startsWith('API')

  return (
    <div className={`bg-[#1a1a1c] rounded-2xl border ${acc.border} p-5 shrink-0 w-80 flex flex-col gap-4`}>
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-gray-600 uppercase tracking-widest">모델 {String.fromCharCode(65 + index)}</span>
        <div className="text-right">
          <p className="text-xs font-semibold text-gray-300">{summary.model}</p>
          <p className="text-[11px] text-gray-600">{summary.label}</p>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        <MetricBadge label="응답시간" value={`${summary.response_time_ms}ms`} accent={acc.badge} />
        <MetricBadge label="토큰 수" value={summary.token_count?.toLocaleString() || 0} accent={acc.badge} />
        <MetricBadge label="액션아이템" value={`${summary.action_items?.length || 0}개`} accent={acc.badge} />
      </div>

      {isError ? (
        <div className="bg-red-950/20 border border-red-900/30 rounded-xl p-3">
          <p className="text-xs text-red-400 leading-relaxed">{summary.summary}</p>
        </div>
      ) : (
        <>
          <div>
            <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest mb-2">핵심 요약</p>
            <p className="text-xs text-gray-300 leading-relaxed">{summary.summary}</p>
          </div>

          {summary.key_decisions?.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest mb-2">결정사항</p>
              <ul className="flex flex-col gap-1.5">
                {summary.key_decisions.map((d, i) => (
                  <li key={i} className="flex gap-2 items-start">
                    <span className="w-1 h-1 bg-indigo-500 rounded-full mt-1.5 flex-shrink-0" />
                    <span className="text-xs text-gray-400">{d}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {summary.action_items?.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest mb-2">액션아이템</p>
              <ul className="flex flex-col gap-2">
                {summary.action_items.map((item, i) => (
                  <li key={i} className="flex gap-2 items-start">
                    <span className="w-4 h-4 bg-indigo-950 border border-indigo-800 text-indigo-400 rounded text-[10px] flex items-center justify-center font-bold flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span className="text-xs text-gray-400">
                      {item.task}
                      {item.assignee && <span className="text-indigo-400"> ({item.assignee})</span>}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default function ModelComparison({ summaries }) {
  if (!summaries?.length) return null

  const valid = summaries.filter(s => s.response_time_ms > 0)
  const fastest = valid.length
    ? valid.reduce((a, b) => a.response_time_ms <= b.response_time_ms ? a : b)
    : null

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <h3 className="text-sm font-semibold text-gray-300">3개 모델 비교</h3>
        {fastest && (
          <span className="text-xs bg-yellow-950/50 border border-yellow-800/30 text-yellow-500 px-2 py-0.5 rounded-full">
            {fastest.model} 가장 빠름 ({fastest.response_time_ms}ms)
          </span>
        )}
      </div>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {summaries.map((s, i) => (
          <SummaryCard key={i} summary={s} index={i} />
        ))}
      </div>
    </div>
  )
}
