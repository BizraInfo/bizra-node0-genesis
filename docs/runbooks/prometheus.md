# Runbook: Prometheus

## Endpoints & Access

- Port: 9090 (host)
- Container: `bizra-prometheus`
- UI: `http://localhost:9090`

## Config

- `monitoring/prometheus.yml`
- Alert rules: `monitoring/alerts/*.yml`

## Logs

- `docker logs -f bizra-prometheus`

## Common Issues

- Empty targets: verify scrape endpoints (app:9090)
- Alerting: confirm rule groups loaded and timeseries present
