# Clerkai 개선 작업 내역 (2026-07-05)

## 🐛 버그 수정

### 1. 라이트/다크 테마 깨짐 (가장 큰 완성도 문제)
일부 컴포넌트가 테마 CSS 변수(`text-c`, `bg-c-card` 등) 대신 색을 하드코딩해서,
라이트 모드에서 글자가 안 보이거나 다크 모드에서 흰 박스가 튀는 문제.

수정된 파일:
- `ModelResult.jsx` — `text-gray-*` → 테마 변수 (라이트 모드에서 글자 안 보이던 문제)
- `UploadZone.jsx` — 흰 배경/파란색 하드코딩 제거 + 인디고 색으로 통일, 중복이던 제목/녹음 버튼 제거 (WelcomeScreen에 이미 있음)
- `ProcessingStatus.jsx` — 라이트 전용 색 → 테마 변수, 디자인도 카드형으로 재작업
- `ModelComparison.jsx`, `TranscriptView.jsx`, `MindmapView.jsx`, `SlackShare.jsx`, `DownloadButtons.jsx`, `LiveRecordingView.jsx` — 하드코딩 색 → 양쪽 테마에서 동작하는 `색상-500/10` 형태로 교체
- `Login.jsx`, `AuthCallback.jsx`, `History.jsx` — 라이트 전용 → 테마 변수

### 2. 히스토리에서 대화록이 사라지던 문제
DB에 요약 1개만 저장하고 있어서, 사이드바에서 이전 회의를 열면
대화록·모델 비교·마인드맵이 전부 안 보였음.

- `models.py` — `title`(AI 생성 제목), `transcript`(대화록 전체), `summaries`(3개 모델 요약 전체) 컬럼 추가
- `main.py` — 기존 DB에 새 컬럼을 자동 추가하는 간단 마이그레이션 (`_migrate()`)
- `process.py` — 처리 완료 시 전체 데이터 저장
- `history.py` — 새 필드 응답에 포함
- `App.jsx` — 히스토리 클릭 시 결과 화면 전체 복원

### 3. 보안: `/api/process/{file_id}` 인증 없음
UUID만 알면 누구나 남의 회의 처리 결과를 볼 수 있었음.
EventSource(SSE)는 Authorization 헤더를 못 붙이기 때문에 쿼리스트링 토큰 방식으로 해결.

- `auth_utils.py` — `verify_token()` 함수 추가
- `process.py` — `?token=` 검증, 업로드한 본인만 접근 가능
- `ProcessingStatus.jsx` — SSE URL에 토큰 전달

### 4. 보안: CORS 전체 개방
- `main.py` — `ALLOWED_ORIGINS` 환경변수로 허용 도메인 제한 가능
  - Railway 환경변수에 추가하세요: `ALLOWED_ORIGINS=https://clerk-nine-mu.vercel.app`
  - 설정 안 하면 기존처럼 전체 허용 (개발 편의)

### 5. 업로드 파일이 디스크에 계속 쌓이던 문제
- `process.py` — 처리가 끝나면(성공/실패 모두) 오디오 파일 자동 삭제

## 🎨 UI/UX 개선 (Claude Desktop 스타일)

- **회의 제목 자동 생성** — 요약 프롬프트에 `title` 필드 추가 (`groq_service.py`). 사이드바에 "요약 앞 40자" 대신 깔끔한 제목 표시
- **사이드바 검색** — 제목/요약 내용으로 실시간 필터
- **사이드바 접기** — 헤더의 패널 아이콘으로 아이콘 레일 모드 전환
- **회의록 삭제 버튼** — hover 시 휴지통 아이콘 (백엔드 delete API는 이미 있었는데 프론트에 버튼이 없었음)
- **빈 상태 디자인** — "회의록이 없습니다" 한 줄 → 아이콘 + 안내 문구
- **탭 라벨** — "모델 A/B/C" → 실제 모델명 (Llama 3.3 70B 등)
- **처리 중 화면** — 이모지 카드 → 단계별 상태 아이콘 카드

## 📦 적용 방법

이 폴더는 GitHub 저장소의 복사본에 수정을 가한 상태입니다. `.git`이 살아있으므로:

```bash
cd clerk
git diff            # 바뀐 내용 전부 확인
git add -A
git commit -m "fix: theme consistency, history persistence, SSE auth + UI polish"
git push origin main
```

배포 후 확인할 것:
1. Railway 환경변수에 `ALLOWED_ORIGINS`, `JWT_SECRET` 설정 (JWT_SECRET이 없으면 기본값이 쓰여서 위험)
2. 서버 첫 재시작 시 DB 컬럼이 자동 추가됨 (로그에 에러 없는지 확인)
3. 기존 회의록은 대화록이 없어서 요약만 보이고, **새로 만든 회의록부터** 전체 복원됨

## 🔜 다음 단계 제안 (이번에 안 건드린 것)

1. **회의록 채팅 (RAG)** — Dify에 이미 적재 중이니 "지난 회의에서 뭐 결정했지?" 질문 기능
2. **토스트 알림 시스템** — 에러 시 화면 전환 대신 우하단 토스트
3. **실시간 녹음 화자 분리** — 지금은 전부 SPEAKER_00 (Deepgram live `diarize=true`)
4. **모바일 반응형** — 사이드바 고정 260px
5. **PDF/DOCX 내보내기**
6. `LiveRecorder.jsx`, `pages/History.jsx`는 어디서도 안 쓰는 죽은 코드 — 삭제 권장
7. `frontend/node_modules`, `dist` 폴더가 빌드 테스트 중 생겼는데 지워도 됩니다 (git에는 안 올라감)
