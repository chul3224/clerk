function formatTime(secs) {
  const s = Math.floor(secs)
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

function downloadBlob(content, filename, type) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function buildTxt(transcript, speakerNames, summaryA, summaryB) {
  const lines = ['=== Clerkai 회의록 ===', '']
  lines.push('[ 대화록 ]')
  for (const seg of transcript) {
    const name = speakerNames[seg.speaker] || seg.speaker
    lines.push(`[${formatTime(seg.start)}] ${name}: ${seg.text}`)
  }
  lines.push('', '[ AI 요약 — 모델 A ]')
  lines.push(summaryA.summary)
  if (summaryA.action_items?.length) {
    lines.push('', '액션아이템:')
    summaryA.action_items.forEach((a, i) => lines.push(`  ${i + 1}. ${a.task}${a.assignee ? ` (${a.assignee})` : ''}`))
  }
  return lines.join('\n')
}

function buildMd(transcript, speakerNames, summaryA, summaryB) {
  const lines = ['# 회의록', '']
  lines.push('## 대화록', '')
  for (const seg of transcript) {
    const name = speakerNames[seg.speaker] || seg.speaker
    lines.push(`**[${formatTime(seg.start)}] ${name}**: ${seg.text}  `)
  }
  lines.push('', '## AI 요약 비교', '')

  for (const [label, summary] of [['A', summaryA], ['B', summaryB]]) {
    lines.push(`### 모델 ${label}: ${summary.model}`)
    lines.push(`> ${summary.summary}`, '')
    if (summary.key_decisions?.length) {
      lines.push('**주요 결정사항**')
      summary.key_decisions.forEach((d) => lines.push(`- ${d}`))
      lines.push('')
    }
    if (summary.action_items?.length) {
      lines.push('**액션아이템**')
      summary.action_items.forEach((a, i) =>
        lines.push(`${i + 1}. ${a.task}${a.assignee ? ` *(${a.assignee})*` : ''}`)
      )
      lines.push('')
    }
    lines.push(`*응답시간: ${summary.response_time_ms}ms | 토큰: ${summary.token_count}*`, '')
  }
  return lines.join('\n')
}

export default function DownloadButtons({ transcript, speakerNames, summaryA, summaryB }) {
  return (
    <div className="flex gap-3 justify-center">
      <button
        onClick={() => downloadBlob(buildTxt(transcript, speakerNames, summaryA, summaryB), 'meeting_transcript.txt', 'text/plain;charset=utf-8')}
        className="flex items-center gap-2 px-5 py-2.5 bg-gray-700 text-white rounded-xl hover:bg-gray-800 transition-colors font-medium"
      >
        <span>📄</span> 대화록 .txt
      </button>
      <button
        onClick={() => downloadBlob(buildMd(transcript, speakerNames, summaryA, summaryB), 'meeting_summary.md', 'text/markdown;charset=utf-8')}
        className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
      >
        <span>📝</span> 요약 .md
      </button>
    </div>
  )
}
