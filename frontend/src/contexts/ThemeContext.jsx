import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext()

function applyTheme(theme) {
  const root = document.documentElement
  if (theme === 'light') {
    root.classList.add('light')
  } else if (theme === 'dark') {
    root.classList.remove('light')
  } else {
    // system
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    prefersDark ? root.classList.remove('light') : root.classList.add('light')
  }
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => localStorage.getItem('theme') || 'dark')

  const setTheme = (t) => {
    setThemeState(t)
    localStorage.setItem('theme', t)
    applyTheme(t)
  }

  // Apply theme on mount
  useEffect(() => { applyTheme(theme) }, [])

  // Track system preference changes when theme === 'system'
  useEffect(() => {
    if (theme !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e) => {
      document.documentElement.classList.toggle('light', !e.matches)
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
