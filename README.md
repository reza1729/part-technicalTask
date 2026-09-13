# Agent & Process Microservices

Two NestJS microservices for agent-generated sensor events, rule matching, and fast reporting.

## Architecture

| Service | Role |
|---------|------|
| **Agent** | Generates fake sensor events (~5/sec) and publishes them to RabbitMQ. No database. |
| **Process** | Consumes events, stores them in MongoDB, matches active rules, maintains Redis counters, exposes Rules CRUD + Reports APIs. |

Supporting infra: **MongoDB**, **Redis**, **RabbitMQ**.

## Quick start

```bash
docker compose up --build
```

- Process HTTP API: http://localhost:3000
- RabbitMQ management: http://localhost:15672 (guest/guest)
- MongoDB: `localhost:27017`
- Redis: `localhost:6379`

Three agent instances run with `AGENT_ID` = `agent-1`, `agent-2`, `agent-3`.

## Agent

Env vars:

| Variable | Default | Description |
|----------|---------|-------------|
| `AGENT_ID` | `agent-1` | Unique agent identifier |
| `RABBITMQ_URL` | `amqp://guest:guest@localhost:5672` | Broker URL |
| `RABBITMQ_QUEUE` | `events_queue` | Queue name |
| `EVENT_INTERVAL_MS` | `200` | Emit interval (~5 events/sec) |

Event payload: `{ agentId, name, value, occurredAt }`.

Local run:

```bash
cd apps/agent
cp .env.example .env
npm install
npm run start:dev
```

## Process

Env vars:

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | HTTP port |
| `MONGO_URI` | `mongodb://localhost:27017/part_process` | MongoDB |
| `REDIS_URL` | `redis://localhost:6379` | Redis |
| `RABBITMQ_URL` | `amqp://guest:guest@localhost:5672` | Broker |
| `RABBITMQ_QUEUE` | `events_queue` | Queue |

Local run (infra must be up):

```bash
docker compose up -d mongo redis rabbitmq
cd apps/process
cp .env.example .env
npm install
npm run start:dev
```

### Rules CRUD

```bash
# Create a rule: temperature greater than 80
curl -s -X POST http://localhost:3000/rules \
  -H 'Content-Type: application/json' \
  -d '{"name":"hot","eventName":"temperature","operator":"gt","threshold":80}'

# List rules (paginated)
curl -s 'http://localhost:3000/rules?page=1&limit=10'

# Get / update / soft-delete
curl -s http://localhost:3000/rules/<id>
curl -s -X PATCH http://localhost:3000/rules/<id> \
  -H 'Content-Type: application/json' \
  -d '{"threshold":75}'
curl -s -X DELETE http://localhost:3000/rules/<id>
```

Operators: `lt`, `lte`, `gt`, `gte`, `eq`.

### Reports

```bash
# Agents ranked by match count for a rule in a time window (max 24h)
curl -s 'http://localhost:3000/reports/rules/<ruleId>/agents?from=2026-09-13T00:00:00.000Z&to=2026-09-13T23:59:59.999Z'

# All-time ranking for a rule
curl -s http://localhost:3000/reports/rules/<ruleId>/agents/all-time
```

Response shape:

```json
[{ "agentId": "agent-1", "count": 42 }]
```

## Design notes

- Every event is always stored in the `events` collection (independent of rules).
- One event may match multiple rules; each match is stored in `matches` with `ruleId`, `agentId`, `eventId`.
- New/updated rules only apply to **future** events (no backfill).
- Soft-deleted rules stop matching, but historical `matches` and Redis counters remain so reports stay correct.
- All-time reports use Redis sorted sets; time-window reports use per-minute Redis hash buckets (Mongo aggregation fallback).
- Inter-service transport is **RabbitMQ** (not HTTP/WebSocket).

## Project layout

```
apps/agent/      # Event generator + RMQ publisher
apps/process/    # Consumer, rules, matcher, reports
docker-compose.yml
```
