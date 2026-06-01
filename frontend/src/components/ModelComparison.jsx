function MetricBadge({ label, value, highlight }) {
  return (
    <div className={`flex flex-col items-center px-3 py-2 rounded-lg ${highlight ? 'bg-blue-50' : 'bg-gray-50'}`}>
      <span className="text-xs text-gray-500">{label}</span>
      <span className={`text-sm font-bold ${highlight ? 'text-blue-600' : 'text-gray-700'}`}>{value}</span>
    </div>
  )
}

function SummaryCard({ summary, label, accentClass }) {
  return (
    <div className={`flex-1 bg-white rounded-2xl border-2 p-5 ${accentClass}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">모델 {label}</span>
        <span className="text-xs font-medium text-gray-700 bg-gray-100 px-2 py-1 rounded-full">
          {summary.model}
        </span>
      </div>

      <div className="flex gap-2 mb-4">
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

export default function ModelComparison({ summaryA, summaryB }) {
  const fasterModel = summaryA.response_time_ms <= summaryB.response_time_ms ? 'A' : 'B'

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <h3 className="text-lg font-bold text-gray-900">AI 요약 비교</h3>
        <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full font-medium">
          모델 {fasterModel}이 {Math.abs(summaryA.response_time_ms - summaryB.response_time_ms)}ms 더 빠름
        </span>
      </div>
      <div className="flex gap-4">
        <SummaryCard summary={summaryA} label="A" accentClass="border-blue-200" />
        <SummaryCard summary={summaryB} label="B" accentClass="border-purple-200" />
      </div>
    </div>
  )
}
