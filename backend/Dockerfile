FROM python:3.11-slim

WORKDIR /app

# System dependencies for psycopg2
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Build context is the repo root, so reference backend/ explicitly
COPY backend/requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy backend source into /app
COPY backend/ .

CMD uvicorn main:app --host 0.0.0.0 --port $PORT
