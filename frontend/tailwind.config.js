/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '"Pretendard Variable"', 'Pretendard', '-apple-system', 'BlinkMacSystemFont',
          'system-ui', 'Roboto', '"Helvetica Neue"', '"Segoe UI"',
          '"Apple SD Gothic Neo"', '"Noto Sans KR"', '"Malgun Gothic"', 'sans-serif',
        ],
        mono: [
          '"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo',
          'Consolas', '"Pretendard Variable"', 'monospace',
        ],
      },
    },
  },
  plugins: [],
}
