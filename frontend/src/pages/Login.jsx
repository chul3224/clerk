import { useSearchParams } from 'react-router-dom'
import { API_BASE } from '../api/client'

export default function Login() {
  const [params] = useSearchParams()
  const hasError = params.get('error')

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 w-full max-w-sm text-center">
        <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
          <span className="text-white font-bold text-xl">C</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Clerkai</h1>
        <p className="text-gray-500 text-sm mb-8">AI 회의록 자동화 서비스</p>

        {hasError && (
          <p className="text-red-500 text-xs mb-4 bg-red-50 rounded-lg px-3 py-2">
            로그인에 실패했습니다. 다시 시도해주세요.
          </p>
        )}

        <a
          href={`${API_BASE}/api/auth/slack`}
          className="flex items-center justify-center gap-3 w-full py-3 px-4 bg-[#4A154B] hover:bg-[#3d1140] text-white rounded-xl font-medium transition-colors"
        >
          <SlackIcon />
          Slack으로 로그인
        </a>
        <p className="text-xs text-gray-400 mt-4">사내 Slack 계정으로만 접근 가능합니다</p>
      </div>
    </div>
  )
}

function SlackIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 122.8 122.8" fill="none">
      <path d="M25.8 77.6c0 7.1-5.8 12.9-12.9 12.9S0 84.7 0 77.6s5.8-12.9 12.9-12.9h12.9v12.9z" fill="#E01E5A" />
      <path d="M32.3 77.6c0-7.1 5.8-12.9 12.9-12.9s12.9 5.8 12.9 12.9v32.3c0 7.1-5.8 12.9-12.9 12.9s-12.9-5.8-12.9-12.9V77.6z" fill="#E01E5A" />
      <path d="M45.2 25.8c-7.1 0-12.9-5.8-12.9-12.9S38.1 0 45.2 0s12.9 5.8 12.9 12.9v12.9H45.2z" fill="#36C5F0" />
      <path d="M45.2 32.3c7.1 0 12.9 5.8 12.9 12.9s-5.8 12.9-12.9 12.9H12.9C5.8 58.1 0 52.3 0 45.2s5.8-12.9 12.9-12.9h32.3z" fill="#36C5F0" />
      <path d="M97 45.2c0-7.1 5.8-12.9 12.9-12.9s12.9 5.8 12.9 12.9-5.8 12.9-12.9 12.9H97V45.2z" fill="#2EB67D" />
      <path d="M90.5 45.2c0 7.1-5.8 12.9-12.9 12.9s-12.9-5.8-12.9-12.9V12.9C64.7 5.8 70.5 0 77.6 0s12.9 5.8 12.9 12.9v32.3z" fill="#2EB67D" />
      <path d="M77.6 97c7.1 0 12.9 5.8 12.9 12.9s-5.8 12.9-12.9 12.9-12.9-5.8-12.9-12.9V97h12.9z" fill="#ECB22E" />
      <path d="M77.6 90.5c-7.1 0-12.9-5.8-12.9-12.9s5.8-12.9 12.9-12.9h32.3c7.1 0 12.9 5.8 12.9 12.9s-5.8 12.9-12.9 12.9H77.6z" fill="#ECB22E" />
    </svg>
  )
}
