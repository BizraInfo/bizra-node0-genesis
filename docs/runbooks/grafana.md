# Runbook: Grafana

## Endpoints & Access

- Port: 3001 (host → container 3000)
- Container: `bizra-grafana`
- UI: `http://localhost:3001` (admin/admin default)

## Provisioning

- Dashboards: `monitoring/grafana/dashboards`
- Data sources: env or file provisioning

## Logs

- `docker logs -f bizra-grafana`

## Common Issues

- Login loop: clear cookies or reset admin password
- Missing dashboards: check provisioning paths
