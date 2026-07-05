export default function ModelResult({ summary }) {
  if (!summary) {
    return (
      <div className="flex items-center justify-center py-16 text-c-dim text-sm">
        모델 결과가 없습니다
      </div>
    )
  }

  const isError = summary.summary?.startsWith('오류') || summary.summary?.startsWith('API') || summary.summary?.startsWith('Gemini') || summary.summary?.startsWith('모델')

  return (
    <div className="flex flex-col gap-7 max-w-2xl">
      {/* Model badge */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-indigo-400" />
          <span className="text-sm font-semibold text-c">{summary.model}</span>
          <span className="text-xs text-c-faint">{summary.label}</span>
        </div>
        {summary.response_time_ms > 0 && (
          <span className="ml-auto text-xs text-c-dim">
            {summary.response_time_ms}ms · {summary.token_count?.toLocaleString()} tokens
          </span>
        )}
      </div>

      {isError ? (
        <div className="bg-red-500/5 border border-red-500/25 rounded-xl p-4">
          <p className="text-sm text-red-500 leading-relaxed">{summary.summary}</p>
        </div>
      ) : (
        <>
          {/* Summary */}
          <div>
            <p className="text-[11px] font-semibold text-c-dim uppercase tracking-widest mb-3">핵심 요약</p>
            <p className="text-sm text-c-soft leading-7 whitespace-pre-line">{summary.summary}</p>
          </div>

          {/* Key decisions */}
          {summary.key_decisions?.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold text-c-dim uppercase tracking-widest mb-3">주요 결정사항</p>
              <ul className="flex flex-col gap-2.5">
                {summary.key_decisions.map((d, i) => (
                  <li key={i} className="flex gap-3 items-start">
                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-2.5 flex-shrink-0" />
                    <span className="text-sm text-c-soft leading-6">{d}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Action items */}
          {summary.action_items?.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold text-c-dim uppercase tracking-widest mb-3">액션아이템</p>
              <ul className="flex flex-col gap-3">
                {summary.action_items.map((item, i) => (
                  <li key={i} className="flex gap-3 items-start">
                    <span className="w-5 h-5 bg-indigo-500/10 border border-indigo-500/30 text-indigo-500 rounded-md text-[11px] flex items-center justify-center font-bold flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-sm text-c-soft leading-6">{item.task}</p>
                      {item.assignee && (
                        <p className="text-xs text-indigo-500 mt-0.5">{item.assignee}</p>
                      )}
                    </div>
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
