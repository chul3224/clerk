import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_BASE } from '../api/client'
import { useAuth } from '../contexts/AuthContext'

export default function AuthCallback() {
  const navigate = useNavigate()
  const { setUser } = useAuth()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    const error = params.get('error')

    if (error || !token) {
      navigate('/login?error=1', { replace: true })
      return
    }

    localStorage.setItem('auth_token', token)

    fetch(`${API_BASE}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((u) => {
        setUser(u)
        navigate('/', { replace: true })
      })
      .catch(() => navigate('/login?error=1', { replace: true }))
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-gray-500 text-sm">로그인 중...</p>
      </div>
    </div>
  )
}
