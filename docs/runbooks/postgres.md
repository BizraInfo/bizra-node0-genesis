# Runbook: PostgreSQL

## Endpoints & Access

- Port: 5432 (host)
- Container: `bizra-postgres`
- DSN: `postgresql://bizra_admin:${POSTGRES_PASSWORD}@localhost:5432/bizra_node0`

## Health

- Check: `docker exec bizra-postgres pg_isready -U bizra_admin -d bizra_node0`

## Logs

- `docker logs -f bizra-postgres`

## Metrics

- Exported to Prometheus via container metrics (node exporter optional)

## Backups

- Volume: `postgres_data`
- Snapshot: `BIZRA-TOOLS/scripts/backup-databases.sh`

## Common Issues

- Port in use: change mapping in `docker-compose.yml`
- Auth failure: verify `POSTGRES_PASSWORD`
- Slow queries: add indexes (`database/indexes.sql`)
