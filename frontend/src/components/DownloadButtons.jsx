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

function buildTxt(transcript, speakerNames, summaries) {
  const lines = ['=== Clerkai 회의록 ===', '']
  lines.push('[ 대화록 ]')
  for (const seg of transcript) {
    const name = speakerNames[seg.speaker] || seg.speaker
    lines.push(`[${formatTime(seg.start)}] ${name}: ${seg.text}`)
  }
  if (summaries?.[0]) {
    lines.push('', `[ AI 요약 — ${summaries[0].model} ]`)
    lines.push(summaries[0].summary)
    if (summaries[0].action_items?.length) {
      lines.push('', '액션아이템:')
      summaries[0].action_items.forEach((a, i) =>
        lines.push(`  ${i + 1}. ${a.task}${a.assignee ? ` (${a.assignee})` : ''}`)
      )
    }
  }
  return lines.join('\n')
}

function buildMd(transcript, speakerNames, summaries) {
  const lines = ['# 회의록', '']
  lines.push('## 대화록', '')
  for (const seg of transcript) {
    const name = speakerNames[seg.speaker] || seg.speaker
    lines.push(`**[${formatTime(seg.start)}] ${name}**: ${seg.text}  `)
  }
  lines.push('', '## AI 요약 비교', '')

  summaries?.forEach((summary, i) => {
    const label = String.fromCharCode(65 + i)
    lines.push(`### 모델 ${label}: ${summary.model} (${summary.label})`)
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
  })
  return lines.join('\n')
}

export default function DownloadButtons({ transcript, speakerNames, summaries }) {
  return (
    <div className="flex gap-3 justify-center">
      <button
        onClick={() => downloadBlob(buildTxt(transcript, speakerNames, summaries), 'meeting_transcript.txt', 'text/plain;charset=utf-8')}
        className="flex items-center gap-2 px-4 py-2 bg-c-card border border-c2 text-c-soft rounded-lg hover:bg-c-hover text-sm font-medium transition-colors"
      >
        <span>📄</span> 대화록 .txt
      </button>
      <button
        onClick={() => downloadBlob(buildMd(transcript, speakerNames, summaries), 'meeting_summary.md', 'text/markdown;charset=utf-8')}
        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
      >
        <span>📝</span> 요약 .md
      </button>
    </div>
  )
}
