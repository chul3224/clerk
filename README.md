# Clerkai — AI 회의록 자동화 서비스

> 음성 하나로 실시간 STT · 3개 AI 모델 비교 요약 · Slack 공유까지 자동화하는 회의 어시스턴트

![Python](https://img.shields.io/badge/Python-3.11-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-green)
![React](https://img.shields.io/badge/React-18-61DAFB)
![Deepgram](https://img.shields.io/badge/Deepgram-nova--2-black)
![Groq](https://img.shields.io/badge/Groq-Llama_·_Qwen-orange)
![Slack](https://img.shields.io/badge/Slack-OAuth_v2-4A154B)

---

## 라이브 데모

🔗 **서비스**: [clerk-nine-mu.vercel.app](https://clerk-nine-mu.vercel.app)  
🔧 **백엔드 API**: [clerk-production-9869.up.railway.app](https://clerk-production-9869.up.railway.app)

---

## 주요 기능

| 기능 | 설명 |
|------|------|
| 🎙️ 실시간 녹음 | WebSocket 기반 실시간 STT — 말하는 즉시 텍스트 출력 |
| 📁 파일 업로드 | MP3 · WAV · M4A · WebM 지원 |
| 🔤 STT | Deepgram nova-2 — 한국어 특화 음성 인식 |
| ✨ 3개 AI 모델 비교 | Llama 3.3 70B · Llama 4 Scout · Qwen3 32B 동시 요약 |
| 📊 성능 지표 비교 | 응답 속도(ms) · 토큰 수 · 액션아이템 수 실시간 측정 |
| 🗂️ 탭 뷰 | Cursor 스타일 모델별 탭 전환 + 3모델 비교 보기 |
| 🗺️ 마인드맵 | 회의 내용 자동 시각화 |
| 💬 Slack 공유 | 요약 편집 후 Slack 채널로 즉시 전송 |
| 🔐 Slack OAuth | Slack 계정으로 1-click 로그인 |
| 🌗 테마 전환 | 밝음 / 어두움 / 기기 설정 — 설정 패널에서 변경 |
| 📜 히스토리 | 사이드바에서 이전 회의록 모두 조회 |
| 💾 다운로드 | 대화록 `.txt` · 요약 `.md` 즉시 저장 |

---

## 기술 스택

### 프론트엔드
| 기술 | 용도 |
|------|------|
| React 18 + Vite | SPA 프레임워크 |
| Tailwind CSS | 다크/라이트 CSS 변수 테마 시스템 |
| Web Audio API + WebSocket | 실시간 녹음 및 스트리밍 |
| React Flow | 마인드맵 시각화 |
| SSE (Server-Sent Events) | 처리 단계별 실시간 진행 표시 |
| Vercel | 프론트엔드 배포 |

### 백엔드
| 기술 | 용도 |
|------|------|
| FastAPI (Python 3.11) | 비동기 REST API + WebSocket 서버 |
| SQLAlchemy + SQLite/PostgreSQL | 회의록 히스토리 DB |
| Deepgram nova-2 | 실시간 STT (한국어) |
| Groq API | Llama 3.3 70B · Llama 4 Scout · Qwen3 32B 요약 |
| python-jose | JWT 인증 |
| Railway | 백엔드 배포 (Docker) |

### 인프라 / 연동
| 기술 | 용도 |
|------|------|
| Slack OAuth v2 | 사용자 인증 |
| n8n Cloud | Slack 웹훅 자동화 워크플로우 |
| Docker | Railway 컨테이너 빌드 |

---

## 시스템 아키텍처

```
[브라우저]
    │  실시간 녹음 (WebSocket) 또는 파일 업로드
    ▼
[Vercel — React 프론트엔드]
    │  POST /api/upload  →  SSE /api/process/{id}
    │  WS  /api/ws/transcribe
    ▼
[Railway — FastAPI 백엔드]
    │
    ├── Deepgram nova-2 (WebSocket)
    │     └── 실시간 STT + 한국어 구두점 처리
    │
    ├── 3개 모델 병렬 요약 (Groq)
    │     ├── Llama 3.3 70B   — 범용 고성능
    │     ├── Llama 4 Scout   — 멀티모달 최신
    │     └── Qwen3 32B       — 한·중·영 다국어
    │
    └── SQLite / PostgreSQL
          └── 회의록 히스토리 저장
    │
    ▼
[n8n Cloud]  →  Slack 채널 전송
```

---

## 로컬 실행

### 사전 준비
- Node.js 18+
- Python 3.11+
- API 키: [Groq](https://console.groq.com/keys) · [Deepgram](https://deepgram.com) · [Slack App](https://api.slack.com/apps)

### 1. 클론 및 환경변수 설정

```bash
git clone https://github.com/chul3224/clerk.git
cd clerk
```

```bash
# backend/.env 생성
GROQ_API_KEY=gsk_...
DEEPGRAM_API_KEY=...
SLACK_CLIENT_ID=...
SLACK_CLIENT_SECRET=...
SLACK_REDIRECT_URI=http://localhost:8000/api/auth/slack/callback
FRONTEND_URL=http://localhost:5173
JWT_SECRET=your-random-secret
N8N_WEBHOOK_URL=https://...
```

### 2. 백엔드 실행

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

### 3. 프론트엔드 실행

```bash
cd frontend
npm install
npm run dev
```

→ **http://localhost:5173** 접속

---

## 확장 로드맵

### 🌏 다국어 · 글로벌 확장

해외 진출 시나리오를 고려한 다국어 지원 계획입니다.

| 단계 | 내용 |
|------|------|
| **Phase 1** | UI 다국어화 — 한국어 · 영어 (i18n 적용) |
| **Phase 2** | STT 다국어 확장 — 영어 · 일본어 · 중국어 · 스페인어 |
| **Phase 3** | 회의 언어 자동 감지 → 해당 언어로 요약 + 한국어 병렬 번역 |
| **Phase 4** | 다자간 다국어 회의 — 참여자별 언어 설정, 실시간 자막 |

### 🏢 엔터프라이즈 기능

대기업·빅테크 도입 사례 기반 확장 방향입니다.

| 기능 | 설명 | 참고 사례 |
|------|------|------|
| **SSO 연동** | Google Workspace · Microsoft Azure AD 로그인 | Notion, Confluence |
| **관리자 대시보드** | 팀별 회의 통계 · 액션아이템 이행률 추적 | Asana, Monday.com |
| **온프레미스 배포** | 보안 민감 기업을 위한 자체 서버 설치 옵션 | Slack Enterprise Grid |
| **GDPR 컴플라이언스** | EU 진출 대비 데이터 보존 기간 · 삭제권 보장 | Zoom, Teams |
| **회의 분석 리포트** | 발언 비율 · 결정 속도 · 반복 안건 탐지 | Gong, Otter.ai |

### 🔗 협업 도구 연동

| 연동 | 기능 |
|------|------|
| **Notion** | 회의록 페이지 자동 생성 |
| **Confluence** | 프로젝트 위키에 회의록 자동 업로드 |
| **Jira / Linear** | 액션아이템 → 티켓 자동 생성 |
| **Google Calendar** | 캘린더 일정에서 회의록 자동 연결 |
| **Microsoft Teams** | Teams 회의 녹음 직접 연동 |

### 🤖 AI 고도화

| 기능 | 설명 |
|------|------|
| **도메인 파인튜닝** | 업계 전문용어(법률·의료·IT) 최적화 모델 |
| **회의 품질 분석** | 결론 없이 끝난 회의 탐지, 개선 제안 |
| **후속 회의 자동 감지** | 이전 액션아이템 완료 여부 자동 체크인 |
| **음성 요약 (TTS)** | 회의록을 음성으로 변환 — 이동 중 청취 |

---

## 프로젝트 의의

**AX PM** 관점의 의사결정 근거를 데이터로 제시합니다.

- **비즈니스 문제 정의** — 회의 후 정리 시간 낭비라는 실무 Pain Point에서 출발
- **AI 파이프라인 설계** — 실시간 STT → LLM 병렬 요약의 엔드투엔드 워크플로우
- **모델 선택 근거** — 3개 모델(Meta · Alibaba)의 속도·품질을 수치로 비교 검증
- **실전 배포 경험** — Docker, Railway, Vercel, Slack OAuth, WebSocket 전 스택 직접 구축
- **전 사이클 완수** — 기획 → 개발 → 배포 → 운영 직접 수행

---

## 개발자

**신우철** · [GitHub](https://github.com/chul3224)
