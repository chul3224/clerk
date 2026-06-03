import { useCallback, useRef, useState } from 'react'
import { API_BASE } from '../api/client'

export function useLiveTranscription() {
  const [isRecording, setIsRecording] = useState(false)
  const [finalLines, setFinalLines] = useState([])
  const [interim, setInterim] = useState('')
  const [error, setError] = useState(null)

  const wsRef = useRef(null)
  const audioCtxRef = useRef(null)
  const processorRef = useRef(null)
  const sourceRef = useRef(null)
  const streamRef = useRef(null)

  const start = useCallback(async () => {
    setError(null)
    setFinalLines([])
    setInterim('')

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    streamRef.current = stream

    const wsBase = API_BASE
      ? API_BASE.replace(/^http/, 'ws')
      : `ws://${window.location.host}`
    const ws = new WebSocket(`${wsBase}/api/ws/transcribe`)
    wsRef.current = ws

    ws.onmessage = (e) => {
      const data = JSON.parse(e.data)
      if (data.error) { setError(data.error); return }
      if (data.is_final && data.transcript) {
        setFinalLines((prev) => [...prev, data.transcript])
        setInterim('')
      } else if (!data.is_final) {
        setInterim(data.transcript || '')
      }
    }

    ws.onerror = () => setError('서버 연결 오류가 발생했습니다')

    ws.onopen = () => {
      const audioCtx = new AudioContext({ sampleRate: 16000 })
      audioCtxRef.current = audioCtx

      const source = audioCtx.createMediaStreamSource(stream)
      sourceRef.current = source

      // eslint-disable-next-line no-undef
      const processor = audioCtx.createScriptProcessor(4096, 1, 1)
      processorRef.current = processor

      processor.onaudioprocess = (e) => {
        if (ws.readyState !== WebSocket.OPEN) return
        const float32 = e.inputBuffer.getChannelData(0)
        const int16 = new Int16Array(float32.length)
        for (let i = 0; i < float32.length; i++) {
          int16[i] = Math.max(-32768, Math.min(32767, Math.round(float32[i] * 32768)))
        }
        ws.send(int16.buffer)
      }

      source.connect(processor)
      processor.connect(audioCtx.destination)
      setIsRecording(true)
    }
  }, [])

  const stop = useCallback(() => {
    processorRef.current?.disconnect()
    sourceRef.current?.disconnect()
    audioCtxRef.current?.close()
    wsRef.current?.close()
    streamRef.current?.getTracks().forEach((t) => t.stop())
    setIsRecording(false)
    setInterim('')
  }, [])

  const getFullTranscript = useCallback(
    () => finalLines.join(' '),
    [finalLines]
  )

  return { isRecording, finalLines, interim, error, start, stop, getFullTranscript }
}
