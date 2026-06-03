const ACCENT_CLASSES = [
  'border-blue-200',
  'border-green-200',
  'border-purple-200',
]

function MetricBadge({ label, value, highlight }) {
  return (
    <div className={`flex flex-col items-center px-3 py-2 rounded-lg ${highlight ? 'bg-blue-50' : 'bg-gray-50'}`}>
      <span className="text-xs text-gray-500">{label}</span>
      <span className={`text-sm font-bold ${highlight ? 'text-blue-600' : 'text-gray-700'}`}>{value}</span>
    </div>
  )
}

function SummaryCard({ summary, index }) {
  return (
    <div className={`bg-white rounded-2xl border-2 p-5 shrink-0 w-80 ${ACCENT_CLASSES[index % ACCENT_CLASSES.length]}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">모델 {String.fromCharCode(65 + index)}</span>
        <div className="text-right">
          <p className="text-xs font-semibold text-gray-700">{summary.model}</p>
          <p className="text-xs text-gray-400">{summary.label}</p>
        </div>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        <MetricBadge label="응답시간" value={`${summary.response_time_ms}ms`} />
        <MetricBadge label="토큰 수" value={summary.token_count} />
        <MetricBadge label="액션아이템" value={`${summary.action_items?.length || 0}개`} highlight />
      </div>

      <div className="mb-4">
        <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">핵심 요약</h4>
        <p className="text-sm text-gray-800 leading-relaxed">{summary.summary}</p>
      </div>

      {summary.key_decisions?.length > 0 && (
        <div className="mb-4">
          <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">주요 결정사항</h4>
          <ul className="flex flex-col gap-1">
            {summary.key_decisions.map((d, i) => (
              <li key={i} className="text-sm text-gray-700 flex gap-2">
                <span className="text-blue-400 shrink-0">•</span>{d}
              </li>
            ))}
          </ul>
        </div>
      )}

      {summary.action_items?.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">액션아이템</h4>
          <ul className="flex flex-col gap-1.5">
            {summary.action_items.map((item, i) => (
              <li key={i} className="text-sm flex gap-2 items-start">
                <span className="w-5 h-5 bg-blue-100 text-blue-600 rounded text-xs flex items-center justify-center font-bold shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <span className="text-gray-700">
                  {item.task}
                  {item.assignee && <span className="text-blue-600 font-medium"> ({item.assignee})</span>}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default function ModelComparison({ summaries }) {
  if (!summaries?.length) return null

  const fastest = summaries.reduce((a, b) =>
    a.response_time_ms <= b.response_time_ms ? a : b
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <h3 className="text-lg font-bold text-gray-900">AI 요약 비교 ({summaries.length}개 모델)</h3>
        <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full font-medium">
          {fastest.model}이 가장 빠름 ({fastest.response_time_ms}ms)
        </span>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {summaries.map((s, i) => (
          <SummaryCard key={i} summary={s} index={i} />
        ))}
      </div>
    </div>
  )
}
