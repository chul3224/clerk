#!/bin/bash
set -e

ENV_NAME="clerk"
PYTHON_VERSION="3.11"

echo "======================================"
echo "  Clerkai 환경 설정 시작"
echo "======================================"

# 1. 기존 환경 제거 후 재생성
if conda env list | grep -q "^${ENV_NAME} "; then
  echo "[1/5] 기존 '${ENV_NAME}' 환경 제거..."
  conda env remove -n "${ENV_NAME}" -y
fi

echo "[1/5] conda 환경 '${ENV_NAME}' 생성 (Python ${PYTHON_VERSION})..."
conda create -n "${ENV_NAME}" python="${PYTHON_VERSION}" -y

# 2. 환경 활성화 후 패키지 설치
echo "[2/5] Python 패키지 설치..."
conda run -n "${ENV_NAME}" pip install --upgrade pip
conda run -n "${ENV_NAME}" pip install -r requirements.txt

# 3. ffmpeg 설치 확인 (pydub 의존성)
echo "[3/5] ffmpeg 확인..."
if ! command -v ffmpeg &> /dev/null; then
  echo "  ffmpeg가 없습니다. conda로 설치합니다..."
  conda install -n "${ENV_NAME}" -c conda-forge ffmpeg -y
else
  echo "  ffmpeg 이미 설치됨 ✓"
fi

# 4. 프론트엔드 의존성 설치
echo "[4/5] 프론트엔드 npm 패키지 설치..."
if command -v npm &> /dev/null; then
  (cd frontend && npm install)
  echo "  npm install 완료 ✓"
else
  echo "  경고: npm이 없습니다. Node.js를 설치한 후 'cd frontend && npm install'을 실행하세요."
fi

# 5. .env 파일 생성
echo "[5/5] 환경변수 파일 설정..."
if [ ! -f backend/.env ]; then
  cp .env.example backend/.env
  echo "  backend/.env 파일을 생성했습니다."
  echo "  *** backend/.env 파일을 열어 API 키를 입력해주세요 ***"
else
  echo "  backend/.env 이미 존재함 ✓"
fi

echo ""
echo "======================================"
echo "  설정 완료!"
echo "======================================"
echo ""
echo "다음 단계:"
echo "  1. backend/.env 파일에 API 키 입력"
echo "  2. 백엔드 실행:  conda activate ${ENV_NAME} && cd backend && uvicorn main:app --reload"
echo "  3. 프론트엔드:   cd frontend && npm run dev"
echo ""
