FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 PIP_NO_CACHE_DIR=1 \
    NETWORK_FILE=/app/shared/network.json
WORKDIR /app/backend

COPY backend/requirements.txt .
RUN pip install -r requirements.txt

COPY shared /app/shared
COPY backend /app/backend

EXPOSE 8000
# Apply migrations, then serve. PORT is set by hosts such as Render and Railway.
CMD ["sh", "-c", "alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} --proxy-headers --forwarded-allow-ips='*'"]
