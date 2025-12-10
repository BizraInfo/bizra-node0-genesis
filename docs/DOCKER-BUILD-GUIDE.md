# BIZRA Node v2.2.0-RC1 - Docker Build Guide

**احسان Standard:** Professional container engineering with security scanning and supply chain validation

**Status:** Production Dockerfile ready, awaiting Docker Desktop startup for build execution

## Prerequisites

1. **Docker Desktop** must be running
   - Start Docker Desktop from Windows Start Menu
   - Wait for "Docker Desktop is running" notification
   - Verify with: `docker ps`

2. **Build Environment**
   - Git commit: `e6720c8bf8633480aecf072ff8c84e68423aec33`
   - Build date: `2025-10-19T04:26:48.974Z`
   - Rust workspace: 3 crates (consensus, poi, bizra_node)
   - Node.js: v20-alpine base image

## Build Commands

### Step 1: Start Docker Desktop

```bash
# Windows: Start Docker Desktop
# Then verify it's running:
docker ps
```

### Step 2: Build Production Image

```bash
# Full build with metadata
docker build -t bizra-node:v2.2.0-rc1 \
  --build-arg BIZRA_USE_RUST=true \
  --build-arg GIT_COMMIT=e6720c8bf8633480aecf072ff8c84e68423aec33 \
  --build-arg BUILD_DATE=2025-10-19T04:26:48.974Z \
  --target production \
  --progress=plain \
  . 2>&1 | tee artifacts/docker-build.log
```

### Step 3: Verify Build

```bash
# Check image exists
docker images bizra-node:v2.2.0-rc1

# Verify Rust binary included
docker run --rm bizra-node:v2.2.0-rc1 ls -lh /app/node_modules/@bizra/native

# Test startup
docker run --rm -e BIZRA_USE_RUST=true bizra-node:v2.2.0-rc1 node -e "console.log('Startup OK')"
```

### Step 4: Security Scanning

```bash
# Install Trivy (if not installed)
# Windows: choco install trivy
# Or download from: https://github.com/aquasecurity/trivy/releases

# Run security scan
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
  aquasec/trivy image bizra-node:v2.2.0-rc1 \
  --severity HIGH,CRITICAL \
  --format json \
  --output artifacts/trivy-scan.json

# Human-readable report
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
  aquasec/trivy image bizra-node:v2.2.0-rc1 \
  --severity HIGH,CRITICAL
```

### Step 5: Tag for Registry

```bash
# Tag for GitHub Container Registry
docker tag bizra-node:v2.2.0-rc1 ghcr.io/bizra/node:v2.2.0-rc1
docker tag bizra-node:v2.2.0-rc1 ghcr.io/bizra/node:latest-rc

# Tag for Docker Hub (optional)
docker tag bizra-node:v2.2.0-rc1 bizra/node:v2.2.0-rc1
docker tag bizra-node:v2.2.0-rc1 bizra/node:latest-rc
```

### Step 6: Image Inspection

```bash
# Get image SHA256
docker inspect bizra-node:v2.2.0-rc1 --format='{{.Id}}'

# Get image size
docker inspect bizra-node:v2.2.0-rc1 --format='{{.Size}}' | awk '{print $1/1024/1024 " MB"}'

# View layers
docker history bizra-node:v2.2.0-rc1 --no-trunc

# Export metadata
docker inspect bizra-node:v2.2.0-rc1 > artifacts/docker-image-metadata.json
```

## Multi-Stage Build Architecture

### Stage 1: Rust Builder

- Base: `rust:1.75-alpine`
- Compiles 3 Rust crates: consensus, poi, bizra_node
- Output: Release binaries in `/rust/target/release/`

### Stage 2: Node.js Builder

- Base: `node:20-alpine`
- Installs Node.js dependencies
- Builds TypeScript (if applicable)
- Prunes dev dependencies

### Stage 3: Dashboard Builder

- Base: `node:20-alpine`
- Builds React dashboard with Vite
- Output: Static assets in `/app/dist`

### Stage 4: Production Runtime

- Base: `node:20-alpine`
- Non-root user: `bizra:bizra` (uid/gid 1001)
- Minimal runtime dependencies
- Rust binaries copied to `node_modules/@bizra/native/`
- Health check on port 3000
- Metrics endpoint on port 9464

## Security Features

1. **Non-root User:** Application runs as `bizra` user (uid 1001)
2. **Minimal Base Image:** Alpine Linux (~5MB base)
3. **Multi-stage Build:** Build dependencies not in final image
4. **Health Checks:** Automated container health monitoring
5. **Metadata Labels:** OCI-compliant image labels
6. **dumb-init:** Proper signal handling and zombie reaping

## احسان Quality Gates

- ✅ Multi-stage build separates build/runtime
- ✅ Rust compilation in dedicated stage
- ✅ Non-root user for security
- ✅ Health check endpoint configured
- ✅ Proper layer caching for fast rebuilds
- ✅ BIZRA_USE_RUST environment variable set
- ⏳ Security scan (0 CRITICAL vulnerabilities)
- ⏳ Image size optimization (<500MB target)
- ⏳ Rust binary verification
- ⏳ Startup test validation

## Expected Build Output

```
[+] Building 420.3s (45/45) FINISHED
 => [rust-builder 1/5] FROM rust:1.75-alpine
 => [node-builder 1/8] FROM node:20-alpine
 => [rust-builder 5/5] RUN cargo build --release --workspace
 => [production 1/1] COPY --from=rust-builder /rust/target/release/libbizra_node.so
 => exporting to image
 => => naming to bizra-node:v2.2.0-rc1
```

## Image Size Targets

- **Target:** <500MB (optimized)
- **Expected:** 300-400MB with Rust binaries
- **Breakdown:**
  - Alpine base: ~5MB
  - Node.js runtime: ~100MB
  - Dependencies: ~150MB
  - Rust binaries: ~50MB
  - Application code: ~50MB

## Troubleshooting

### Docker Desktop Not Running

```
Error: error during connect: ... dockerDesktopLinuxEngine: The system cannot find the file specified.
```

**Solution:** Start Docker Desktop and wait for initialization

### Rust Build Fails

```
Error: cargo build failed
```

**Solution:** Run `npm run rust:check` locally first to verify Rust workspace

### Missing Dependencies

```
Error: npm ci failed
```

**Solution:** Ensure `package-lock.json` is committed and up-to-date

### Large Image Size

```
Image size: >500MB
```

**Solution:** Review layer sizes with `docker history`, consider .dockerignore optimization

## Next Steps

1. **Start Docker Desktop**
2. **Run build command** (Step 2 above)
3. **Execute security scan** (Step 4 above)
4. **Verify Rust binaries** (Step 3 above)
5. **Push to registry** (requires authentication)

## Registry Push (Post-Build)

```bash
# GitHub Container Registry
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin
docker push ghcr.io/bizra/node:v2.2.0-rc1
docker push ghcr.io/bizra/node:latest-rc

# Docker Hub (optional)
echo $DOCKER_PASSWORD | docker login -u USERNAME --password-stdin
docker push bizra/node:v2.2.0-rc1
docker push bizra/node:latest-rc
```

## احسان Commitment

This Docker build follows professional engineering standards:

- Contract-first design (Dockerfile is the contract)
- Evidence-gated execution (security scan required)
- Reproducible builds (pinned versions, build args)
- Security-first approach (non-root user, minimal attack surface)
- Observable runtime (health checks, metrics endpoint)

---

**Build Status:** Ready for execution pending Docker Desktop startup
**Dockerfile Location:** `C:\BIZRA-NODE0\Dockerfile`
**Created:** 2025-10-19
**احسان Level:** Production-grade
