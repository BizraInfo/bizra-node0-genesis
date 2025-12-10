# Launch Checklist (Local Production Mode)

## Prereqs

- Docker Desktop running
- Ports free: 5432, 6379, 3000, 3001, 9090, 16686
- Env set: `POSTGRES_PASSWORD`, `REDIS_PASSWORD`, `JWT_SECRET`, `REFRESH_TOKEN_SECRET`, `DATABASE_URL`, `REDIS_URL`

## Start

- Compose: `docker-compose up -d`
- Or script: `./deploy-production.ps1 -Mode local`

## Verify

- API: `http://localhost:3000/health` → 200 OK
- Metrics: `http://localhost:3000/metrics` or scrape `:9090`
- Prometheus: `http://localhost:9090` targets healthy
- Grafana: `http://localhost:3001` login works
- Jaeger: `http://localhost:16686` traces visible
- DB: `psql` SELECT 1; Redis: `PING`

## Smoke Tests

- Auth flow (login/jwt issue/verify)
- Validation endpoint happy-path
- Error path returns 4xx with JSON body
- WebSocket connects and receives heartbeat

## SLO Gate (soft)

- Availability OK, Performance P95 < 100ms, Error rate < 0.1%

## Rollback

- `docker-compose logs` to triage
- `docker-compose down` to stop
- Restore DB from `BIZRA-TOOLS/scripts/backup-databases.sh` snapshot

## Notes

- Change ports in `docker-compose.yml` on conflicts
- Update secrets before real deployment
