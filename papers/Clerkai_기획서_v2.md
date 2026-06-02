# Clerkai — AI 회의록 자동화 서비스 기획서 v2.0

**개발자:** 신우철  
**개발 기간:** 2026년 6월  
**라이브 서비스:** https://clerk-nine-mu.vercel.app  
**GitHub:** https://github.com/chul3224/clerk

---

## 1. 프로젝트 개요

음성 파일 하나로 STT 변환 → 화자 분리 → AI 요약까지 자동화하는 AI 회의록 서비스.  
두 가지 LLM 모델의 요약 품질과 속도를 실시간 비교하는 것이 핵심 차별화 포인트.

### 해결하는 문제

| # | Pain Point | 영향도 |
|---|-----------|--------|
| 1 | 회의 후 정리에 드는 시간 낭비 (평균 30분) | 상 |
| 2 | 메모하다 보면 대화에 집중 못함 | 상 |
| 3 | 누가 무슨 말을 했는지 추적 어려움 | 중 |
| 4 | 액션아이템이 흐지부지됨 | 중 |
| 5 | 요약 품질이 담당자마다 다름 | 중 |

---

## 2. 최종 기술 스택

### 프론트엔드

| 기술 | 용도 |
|------|------|
| React 18 + Vite | SPA 프레임워크 |
| Tailwind CSS | 스타일링 |
| Web Audio API | 브라우저 실시간 녹음 |
| SSE (Server-Sent Events) | 처리 단계 실시간 스트리밍 |
| **Vercel** | 배포 (clerk-nine-mu.vercel.app) |

### 백엔드

| 기술 | 용도 |
|------|------|
| FastAPI (Python 3.11) | 비동기 REST API 서버 |
| httpx | Deepgram REST 직접 호출 |
| python-dotenv | 환경변수 관리 |
| **Render** | 배포 (clerk-3251.onrender.com) |

### AI / 외부 API

| 서비스 | 용도 | 모델 |
|--------|------|------|
| Deepgram | STT + 화자 분리 | nova-2 (detect_language) |
| Groq | AI 요약 — 모델 A | Llama 3.1 8B Instant |
| Groq | AI 요약 — 모델 B | Llama 3.3 70B Versatile |

---

## 3. 시스템 아키텍처

```
[사용자 브라우저]
    │  음성 파일 업로드 또는 실시간 녹음
    ▼
[Vercel — React 프론트엔드]
    │  POST /api/upload  →  file_id 발급
    │  GET  /api/process/{file_id}  (SSE 스트림)
    ▼
[Render — FastAPI 백엔드]
    │
    ├── Deepgram API  →  STT + 화자 분리
    │
    └── Groq API (병렬 호출)
          ├── Llama 3.1 8B   →  요약 A + 응답시간 측정
          └── Llama 3.3 70B  →  요약 B + 응답시간 측정
    │
    ▼
[결과 화면]
    ├── 화자별 대화록 (이름 태깅 UI)
    ├── 모델 A / B 요약 비교 카드
    │     (속도 · 토큰 · 액션아이템 수)
    └── .txt / .md 다운로드
```

---

## 4. 핵심 기능 명세

### 4-1. 음성 입력
- 파일 업로드: MP3, WAV, M4A, WebM, OGG, FLAC (최대 25MB)
- 브라우저 실시간 녹음 (Web Audio API → MediaRecorder)
- 드래그앤드롭 UI

### 4-2. STT + 화자 분리 (Deepgram nova-2)
- 한국어 음성 인식 (언어 자동 감지)
- 파일 확장자 기반 Content-Type 자동 감지
- 화자별 발화 구간 자동 분리
- 화자 이름 수동 태깅 UI (SPEAKER_A → 실제 이름)

### 4-3. 듀얼 모델 AI 요약 (Groq)
- Llama 3.1 8B(초고속)와 Llama 3.3 70B(고성능) 동시 병렬 호출
- JSON 구조화 출력 — 핵심 요약 / 주요 결정사항 / 액션아이템(담당자 포함)
- 비교 지표: 응답속도(ms) · 토큰 수 · 액션아이템 추출 개수

### 4-4. 실시간 진행 표시 (SSE)
- 서버 준비 중 → STT 변환 → AI 요약 단계별 스트리밍
- Render 무료 서버 콜드 스타트 안내 (준비 중 경과 시간 표시)

### 4-5. 다운로드
- 대화록 `.txt` / 요약 `.md` 클라이언트 사이드 생성 및 다운로드

---

## 5. 개발 과정 — 기술 변경 이력

### Phase 1 — 초기 기획

| 항목 | 초기 계획 |
|------|----------|
| STT | OpenAI Whisper API |
| 화자 분리 | Pyannote.audio 3.0 (로컬 ML) |
| AI 요약 비교 | Llama 3.1 8B vs GPT-OSS 120B |
| 프론트 배포 | Cloudflare Pages |
| 백엔드 배포 | Railway |

---

### Phase 2 — 로컬 개발 중 변경

#### 변경 1: OpenAI Whisper → Groq Whisper
- **원인:** OpenAI API 키 401 오류 (키 무효)
- **해결:** Groq의 whisper-large-v3-turbo 모델로 교체
- **결과:** 동일한 Whisper 기반 STT, 더 낮은 비용

#### 변경 2: GPT-OSS 120B → Llama 3.3 70B
- **원인:** GPT-OSS 120B는 실제 존재하지 않는 모델명이었음
- **해결:** Groq에서 지원하는 Llama 3.3 70B Versatile로 교체

#### STT 정확도 개선
- **문제:** "Groq 요약" → "글록 유약", "화자 분리" → "화자불리" 오인식
- **해결:** Whisper `prompt` 파라미터에 기술 용어 힌트 목록 추가
- **결과:** 주요 기술 용어 인식률 개선

---

### Phase 3 — 배포 단계 이슈

#### 이슈 1: Railway 환경변수 미주입 버그
- **증상:** Variables 탭에 API 키 설정했으나 `os.getenv()` = None
- **디버깅:** `/debug-env` 엔드포인트 추가로 런타임 환경변수 확인
- **1차 시도:** `load_dotenv(override=True)` 제거 → 여전히 미주입
- **결론:** Railway 자체 환경변수 주입 버그 (재현 가능)
- **해결:** Render.com으로 백엔드 이전 → 즉시 정상 작동

#### 이슈 2: Cloudflare Pages Workers 설정 충돌
- **증상:** `npx wrangler deploy` 실행 시 Authentication error
- **원인:** Pages 프로젝트가 아닌 Workers 프로젝트로 잘못 생성됨
- **해결:** Vercel로 프론트엔드 이전 → 설정 없이 자동 감지 배포 성공

#### 이슈 3: Railpack 빌드 시스템 변경
- **원인:** Railway가 nixpacks → railpack으로 빌드 시스템 교체
- **증상:** nixpacks.toml 무시, 시작 명령어 미감지
- **해결:** railway.toml로 교체, 루트 디렉토리에 배치

---

### Phase 4 — 화자 분리 개선

#### 변경 3: Pyannote → Deepgram (STT + 화자분리 통합)
- **원인:** Pyannote는 GPU/고메모리 필요 → Render 무료 512MB 불가
- **AssemblyAI 시도:** 한국 네트워크에서 사이트 접속 불가
- **Deepgram 채택:** STT + 화자 분리 통합 API, 무료 크레딧 $200

#### Deepgram SDK 버전 충돌
- **문제:** `deepgram-sdk` ImportError (PrerecordedOptions 없음)
- **원인:** SDK 버전 간 import 경로 변경
- **해결:** SDK 제거, httpx로 Deepgram REST API 직접 호출

#### 화자 분리 정확도 개선
- **문제:** Content-Type 고정(`audio/mpeg`)으로 비WAV 파일 처리 오류
- **개선:** 파일 확장자 기반 Content-Type 자동 감지 적용
- **추가:** `detect_language: true` 적용 (언어 강제 지정 제거)

---

## 6. 테스트 결과

### STT 정확도

| 항목 | 결과 |
|------|------|
| 일반 한국어 문장 | ✅ 높음 (90%+) |
| 고유명사 (신우철) | ✅ 정확 |
| 기술 용어 (Groq, 화자 분리) | ✅ 힌트 추가 후 정확 |
| 유사 발음 (확정 / 확장) | ⚠️ 오인식 발생 |
| 영어 브랜드명 (Clerkai → Clock AI) | 🟡 의미는 통함 |

### 듀얼 모델 요약 비교 (실측)

| 항목 | Llama 3.1 8B | Llama 3.3 70B |
|------|-------------|--------------|
| 요약 길이 | 1문장 (짧음) | 4문장 (적절) |
| 액션아이템 | 5개 (2개 오분류) | 3개 (정확) |
| 해결된 이슈 구분 | ❌ 오분류 | ✅ 정확 |
| 응답 속도 | **1.2초** | 1.8초 |
| **종합 평가** | 속도 우위 | **품질 우위** |

**핵심 인사이트:** 짧은 요약이 필요한 상황엔 8B, 정확한 의사결정 추적엔 70B가 적합.  
두 모델을 나란히 비교함으로써 데이터 기반 모델 선택 근거를 제시.

---

## 7. 예산별 성능 개선 로드맵

### Tier 1 — 월 $20~50 (즉시 체감 개선)

| 항목 | 현재 | 개선 후 | 비용 |
|------|------|---------|------|
| 서버 응답 | 콜드 스타트 50초 | 즉시 응답 | Render $7/월 |
| 화자 분리 | ~50% 정확도 | 80%+ 정확도 | AssemblyAI $15/월 |

### Tier 2 — 월 $100~300 (품질 도약)

| 항목 | 현재 | 개선 후 | 비용 |
|------|------|---------|------|
| STT 정확도 | Deepgram nova-2 | OpenAI Whisper large-v3 | $0.006/분 |
| 화자 분리 | Deepgram 통합 | Pyannote 3.1 전용 | 서버 업그레이드 |
| AI 요약 | Llama 3.3 70B | Claude claude-opus-4-7 | $15/M 토큰 |

### Tier 3 — 월 $500+ (본격 서비스화)

| 기능 | 설명 |
|------|------|
| 실시간 STT | Deepgram 스트리밍 API — 회의 중 라이브 자막 |
| 데이터베이스 | PostgreSQL — 회의록 영구 저장 / 히스토리 / 검색 |
| Google Calendar 연동 | 회의 일정 자동 등록 |
| Slack / Notion 연동 | 요약 자동 포스팅 및 저장 |
| 감정 분석 | 발언 톤 분석 — 회의 분위기 지표 |
| 다국어 지원 | 영어 / 일본어 / 중국어 확장 |

---

## 8. 프로젝트 의의

이 프로젝트는 단순 기능 구현을 넘어 **AX PM으로서의 역량**을 실증합니다.

1. **비즈니스 문제 정의** — 실무 Pain Point에서 출발한 기획
2. **기술 선택과 트레이드오프** — 무료 vs 유료, 정확도 vs 속도 결정
3. **실제 배포 경험** — Railway 환경변수 버그, SDK 버전 충돌 등 실전 디버깅
4. **데이터 기반 의사결정** — 두 LLM 모델을 수치로 비교 검증
5. **전 사이클 완수** — 기획 → 개발 → 배포 → 개선 직접 수행

---

*작성일: 2026.06.02 | 개발자: 신우철 | GitHub: https://github.com/chul3224*
