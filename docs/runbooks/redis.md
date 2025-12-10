# Runbook: Redis

## Endpoints & Access

- Port: 6379 (host)
- Container: `bizra-redis`
- URL: `redis://default:${REDIS_PASSWORD}@localhost:6379/0`

## Health

- Check: `docker exec bizra-redis redis-cli -a ${REDIS_PASSWORD} PING`

## Logs

- `docker logs -f bizra-redis`

## Metrics

- Keyspace hits/misses via `INFO`

## Common Issues

- AUTH errors: ensure `REDIS_PASSWORD` matches compose command
- Memory: adjust `--maxmemory`/policy in `docker-compose.yml`
