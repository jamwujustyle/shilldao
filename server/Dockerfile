# Multi-stage Dockerfile for Django backend
FROM python:3.11-alpine AS base

LABEL MAINTAINER="codeBuddha"

ENV PYTHONUNBUFFERED=1
ENV PYTHDONTWRITEBYTECODE=1

WORKDIR /app

RUN python -m venv /venv
ENV PATH="/venv/bin:$PATH"
COPY requirements.txt .
RUN apk add --no-cache postgresql-dev gcc musl-dev \
    && pip install --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt \
    && pip install gunicorn

FROM base AS development

COPY . .

RUN if [ -f wait-for-migrations.sh ]; then chmod +x wait-for-migrations.sh; fi
RUN if [ -f wait-for-db.sh ]; then chmod +x wait-for-db.sh; fi

RUN mkdir -p /app/media

RUN adduser -D -s /bin/sh appuser
RUN chown -R appuser:appuser /app
USER appuser

EXPOSE 8000

FROM base AS production

RUN adduser -D -s /bin/sh appuser
RUN mkdir -p /app/media \
    && chown -R appuser:appuser /app

# TODO: CONFIGURE GUNICORN FURTHER
RUN pip install gunicorn

USER appuser

COPY --chown=appuser:appuser . .

RUN if [ -f wait-for-migrations.sh ]; then chmod +x wait-for-migrations.sh; fi
RUN if [ -f wait-for-db.sh ]; then chmod +x wait-for-db.sh; fi

EXPOSE 8000