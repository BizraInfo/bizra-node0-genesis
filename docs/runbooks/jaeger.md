# Runbook: Jaeger

## Endpoints & Access

- Port: 16686 (UI)
- Container: `bizra-jaeger`
- UI: `http://localhost:16686`

## Ingestion

- Zipkin compatible port: 9411
- OTLP collector auto-enabled in all-in-one

## Logs

- `docker logs -f bizra-jaeger`

## Common Issues

- No traces: ensure app tracer is initialized (`src/observability/tracer.ts`)
- Cross-origin: open Jaeger UI directly on localhost
