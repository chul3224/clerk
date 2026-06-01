import { useRef, useState } from 'react'
import { uploadAudio } from '../api/client'
import { useRecorder } from '../hooks/useRecorder'

export default function UploadZone({ onFileUploaded }) {
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)
  const inputRef = useRef(null)
  const { isRecording, duration, formatDuration, startRecording, stopRecording } = useRecorder()

  const handleFile = async (file) => {
    setError(null)
    setUploading(true)
    try {
      const { file_id } = await uploadAudio(file)
      onFileUploaded(file_id)
    } catch (e) {
      setError(e.message)
    } finally {
      setUploading(false)
    }
  }

  const onDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const onInputChange = (e) => {
    const file = e.target.files[0]
    if (file) handleFile(file)
  }

  const handleRecordToggle = async () => {
    if (isRecording) {
      const blob = await stopRecording()
      const file = new File([blob], 'recording.webm', { type: 'audio/webm' })
      handleFile(file)
    } else {
      await startRecording()
    }
  }

  return (
    <div className="flex flex-col items-center gap-8 py-16">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-3">
          회의록을 <span className="text-blue-600">자동으로</span>
        </h1>
        <p className="text-lg text-gray-500">음성 파일 하나로 STT · 화자 분리 · AI 요약까지</p>
      </div>

      <div
        className={`w-full max-w-lg border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-colors
          ${dragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-white hover:border-blue-400'}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".mp3,.wav,.m4a,.webm,.ogg,.flac"
          className="hidden"
          onChange={onInputChange}
        />
        <div className="text-5xl mb-4">🎙️</div>
        {uploading ? (
          <p className="text-blue-600 font-medium">업로드 중...</p>
        ) : (
          <>
            <p className="text-gray-700 font-medium mb-1">파일을 드래그하거나 클릭해서 업로드</p>
            <p className="text-sm text-gray-400">MP3 · WAV · M4A · WebM · OGG · FLAC (최대 25MB)</p>
          </>
        )}
      </div>

      <div className="flex items-center gap-4 text-gray-400 text-sm w-full max-w-lg">
        <div className="flex-1 h-px bg-gray-200" />
        <span>또는</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      <button
        onClick={handleRecordToggle}
        className={`flex items-center gap-3 px-6 py-3 rounded-xl font-medium text-white transition-colors
          ${isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-600 hover:bg-blue-700'}`}
      >
        {isRecording ? (
          <>
            <span className="w-3 h-3 bg-white rounded-sm" />
            녹음 중지 {formatDuration(duration)}
          </>
        ) : (
          <>
            <span className="w-3 h-3 bg-white rounded-full" />
            실시간 녹음 시작
          </>
        )}
      </button>

      {error && (
        <p className="text-red-500 text-sm bg-red-50 px-4 py-2 rounded-lg">{error}</p>
      )}
    </div>
  )
}
