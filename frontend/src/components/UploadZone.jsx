import { useRef, useState } from 'react'
import { uploadAudio } from '../api/client'

export default function UploadZone({ onFileUploaded }) {
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)
  const inputRef = useRef(null)

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

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <div
        className={`w-full border border-dashed rounded-xl px-6 py-8 text-center cursor-pointer transition-colors
          ${dragging
            ? 'border-indigo-500 bg-indigo-500/5'
            : 'border-c2 bg-c-card hover:border-indigo-500/50 hover:bg-c-hover2'}`}
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
        {uploading ? (
          <div className="flex items-center justify-center gap-2.5">
            <span className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-indigo-400 font-medium">업로드 중...</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-c-soft font-medium mb-1">파일을 드래그하거나 클릭해서 업로드</p>
            <p className="text-xs text-c-dim">MP3 · WAV · M4A · WebM · OGG · FLAC (최대 25MB)</p>
          </>
        )}
      </div>

      {error && (
        <p className="text-red-500 text-xs bg-red-500/5 border border-red-500/20 px-3 py-1.5 rounded-lg">{error}</p>
      )}
    </div>
  )
}
