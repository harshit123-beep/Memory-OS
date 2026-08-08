# Multi-stage Dockerfile for Google Cloud Run deployment
FROM python:3.12-slim AS builder

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies into a wheelhouse
COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# Final runner stage
FROM python:3.12-slim AS runner

WORKDIR /app

# Copy installed dependencies from builder
COPY --from=builder /root/.local /root/.local
ENV PATH=/root/.local/bin:$PATH

# Copy backend source code
COPY . .

# Expose default API port
EXPOSE 8000

# Set environment defaults for Cloud Run
ENV PORT=8000
ENV API_PORT=8000
ENV LOG_LEVEL=INFO

# Launch API server mapping to Cloud Run's dynamic PORT environment variable
CMD uvicorn app.main:app --host 0.0.0.0 --port $PORT
