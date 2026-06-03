# Clerkai — AI 회의록 자동화 서비스

> 음성 하나로 STT · 화자 분리 · 3개 AI 모델 비교 요약까지 자동화하는 회의 어시스턴트

![Python](https://img.shields.io/badge/Python-3.11-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-green)
![React](https://img.shields.io/badge/React-18-61DAFB)
![Deepgram](https://img.shields.io/badge/Deepgram-nova--2-black)
![Groq](https://img.shields.io/badge/Groq-Llama_3.3_70B-orange)
![Gemini](https://img.shields.io/badge/Google-Gemini_2.5_Flash-blue)

---

## 데모

🔗 **라이브 서비스**: [clerk-nine-mu.vercel.app](https://clerk-nine-mu.vercel.app)  
🔧 **백엔드 API**: [clerk-3251.onrender.com](https://clerk-3251.onrender.com)

---

## 주요 기능

| 기능 | 설명 |
|------|------|
| 🎙️ 음성 입력 | 파일 업로드 (MP3/WAV/M4A/WebM) 또는 브라우저 실시간 녹음 |
| 🔤 STT + 화자 분리 | Deepgram nova-2 — 음성 인식과 화자 분리를 단일 API로 처리 |
| 👥 화자 이름 태깅 | SPEAKER_A/B → 실제 이름으로 수동 수정 |
| ✨ 3개 AI 모델 비교 | Llama 3.3 70B · Gemini 2.5 Flash · Gemini 3.1 Flash-Lite 동시 출력 |
| 📊 성능 비교 지표 | 응답 속도(ms) · 토큰 수 · 액션아이템 추출 개수 실시간 측정 |
| ⚡ 실시간 STT | WebSocket 기반 실시간 음성 인식 (말하는 즉시 텍스트 출력) |
| 💾 다운로드 | 대화록 `.txt` / 요약 `.md` 즉시 저장 |

---

## 기술 스택

### 프론트엔드
| 기술 | 용도 |
|------|------|
| React 18 + Vite | SPA 프레임워크 |
| Tailwind CSS | 스타일링 |
| Web Audio API + WebSocket | 실시간 녹음 및 스트리밍 |
| SSE (Server-Sent Events) | 처리 단계별 실시간 진행 표시 |
| **Vercel** | 배포 |

### 백엔드
| 기술 | 용도 |
|------|------|
| FastAPI (Python 3.11) | 비동기 REST API + WebSocket 서버 |
| Deepgram nova-2 | STT + 화자 분리 (단일 API) |
| Groq API | Llama 3.3 70B 요약 |
| Google Gemini API | Gemini 2.5 Flash · 3.1 Flash-Lite 요약 |
| **Render** | 배포 |

---

## 시스템 아키텍처

```
[브라우저]
    │ 파일 업로드 또는 실시간 녹음 (WebSocket)
    ▼
[Vercel — React 프론트엔드]
    │ POST /api/upload  →  SSE /api/process/{id}
    ▼
[Render — FastAPI 백엔드]
    │
    ├── Deepgram nova-2
    │     └── STT + 화자 분리 (단일 API 호출)
    │
    └── 3개 모델 병렬 요약
          ├── Llama 3.3 70B   (Groq)
          ├── Gemini 2.5 Flash      (Google)
          └── Gemini 3.1 Flash-Lite (Google)
    │
    ▼
[결과 화면]
    ├── 화자별 대화록 (이름 태깅)
    ├── 3개 모델 비교 카드 (속도 · 토큰 · 액션아이템)
    └── .txt / .md 다운로드
```

---

## 로컬 실행

### 사전 준비
- [Miniconda](https://docs.conda.io/en/latest/miniconda.html)
- Node.js 18+
- API 키: [Groq](https://console.groq.com/keys) · [Deepgram](https://deepgram.com) · [Google AI Studio](https://aistudio.google.com/apikey)

### 1. 환경 설치

```bash
git clone https://github.com/chul3224/clerk.git
cd clerk
bash setup_env.sh
```

### 2. 환경변수 설정

```bash
cp .env.example backend/.env
# backend/.env 파일에 API 키 입력
```

```env
GROQ_API_KEY=gsk_...
DEEPGRAM_API_KEY=...
GEMINI_API_KEY=...
```

### 3. 서버 실행

```bash
# 백엔드
conda activate clerk
cd backend && uvicorn main:app --reload

# 프론트엔드 (새 터미널)
cd frontend && npm run dev
```

**http://localhost:5173** 에서 접속

---

## 프로젝트 의의

단순 기능 구현을 넘어 **AX PM** 관점의 의사결정 근거를 데이터로 제시합니다.

- **비즈니스 문제 정의** — 회의 후 정리 시간 낭비라는 실무 Pain Point에서 출발
- **AI 파이프라인 설계** — STT → 화자분리 → LLM의 엔드투엔드 워크플로우
- **데이터 기반 의사결정** — 3개 AI 모델(Meta · Google)의 성능을 수치로 비교 검증
- **실전 배포 경험** — Railway 환경변수 버그, SDK 버전 충돌 등 실제 디버깅 이력
- **전 사이클 완수** — 기획 → 개발 → 배포 → 개선 직접 수행

---

## 개발자

**신우철** · [GitHub](https://github.com/chul3224)
