# Process microservice

Consumes agent events, stores them in MongoDB, matches rules, and serves report APIs backed by Redis.

```bash
cp .env.example .env
npm install
npm run start:dev
```

See the root [README](../../README.md) for API examples and Docker Compose usage.
