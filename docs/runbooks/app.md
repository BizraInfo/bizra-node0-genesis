# Runbook: App (BIZRA Backend API)

## Endpoints & Access

- Ports: 3000 (API), 9090 (metrics)
- Container: `bizra-app`
- Base URL: `http://localhost:3000`
- Health: `/health` | Readiness: `/ready`

## Logs

- `docker logs -f bizra-app`

## Metrics

- Prometheus scrape on `:9090`
- Custom SLO metrics (see `src/monitoring/*`)

## Config

- Env: see `src/config/app.config.ts`
- Fail-fast on invalid/missing env via Zod schema

## Common Issues

- 5xx spikes: check `slo-alerting` and `performance-metrics`
- DB/Redis timeouts: validate `DATABASE_URL`, `REDIS_URL`
