# Clerkai — AI 회의록 자동화 서비스

> 음성 하나로 STT · 화자 분리 · AI 요약까지 자동화하는 회의 어시스턴트

![Python](https://img.shields.io/badge/Python-3.11-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-green)
![React](https://img.shields.io/badge/React-18-61DAFB)
![Groq](https://img.shields.io/badge/Groq-Llama_3.1_8B_·_3.3_70B-orange)

---

## 데모

🔗 **라이브 서비스**: [clerk-nine-mu.vercel.app](https://clerk-nine-mu.vercel.app)  
🔧 **백엔드 API**: [clerk-3251.onrender.com](https://clerk-3251.onrender.com)

---

## 주요 기능

| 기능 | 설명 |
|------|------|
| 🎙️ 음성 입력 | 파일 업로드 (MP3/WAV/M4A/WebM) 또는 브라우저 실시간 녹음 |
| 🔤 STT 변환 | Groq Whisper Large v3 Turbo — 한국어 고정밀 음성 인식 |
| 👥 화자 분리 | Pyannote 3.0 — 발화자 자동 분리 및 수동 이름 태깅 |
| ✨ 듀얼 AI 요약 | Llama 3.1 8B vs Llama 3.3 70B 동시 비교 출력 |
| 📊 성능 비교 | 응답 속도(ms) · 토큰 수 · 액션아이템 추출 개수 실시간 측정 |
| 💾 다운로드 | 대화록 `.txt` / 요약 `.md` 즉시 저장 |

---

## 기술 스택

### 백엔드
- **FastAPI** — 비동기 REST API + SSE(실시간 진행 스트리밍)
- **Groq API** — Whisper STT + Llama 듀얼 모델 요약
- **Pyannote.audio 3.0** — 화자 분리

### 프론트엔드
- **React 18 + Vite** — SPA
- **Tailwind CSS** — 스타일링
- **Web Audio API** — 브라우저 실시간 녹음

### 인프라
- **Cloudflare Pages** — 프론트엔드 배포
- **Railway** — 백엔드 배포

---

## 시스템 아키텍처

```
[브라우저]
    │ 음성 파일 업로드 / 실시간 녹음
    ▼
[React 프론트엔드] ──SSE 스트림──▶ 단계별 진행 표시
    │
    │ POST /api/upload
    ▼
[FastAPI 백엔드]
    ├── Groq Whisper  → 텍스트 + 타임스탬프
    ├── Pyannote      → 화자 구간 분리
    ├── 타임스탬프 매칭 → 화자별 대화록 생성
    └── Groq API 병렬 호출
            ├── Llama 3.1 8B  → 요약 A (초고속)
            └── Llama 3.3 70B → 요약 B (고성능)
    │
    ▼
[결과 화면]
    ├── 화자별 대화록 (이름 태깅 가능)
    ├── 모델 A / B 요약 비교
    └── .txt / .md 다운로드
```

---

## 로컬 실행

### 사전 준비
- [Miniconda](https://docs.conda.io/en/latest/miniconda.html)
- Node.js 18+
- API 키: [Groq](https://console.groq.com/keys) · [HuggingFace](https://hf.co/settings/tokens)

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
HF_TOKEN=hf_...
```

> HuggingFace 토큰은 [pyannote/speaker-diarization-3.0](https://huggingface.co/pyannote/speaker-diarization-3.0) 약관 동의 후 발급

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
- **데이터 기반 의사결정** — 두 모델의 성능(속도·품질)을 수치로 비교
- **확장성 고려** — 프로토타입 → 풀서비스 로드맵 제시

---

## 개발자

**신우철** · [GitHub](https://github.com/chul3224)
