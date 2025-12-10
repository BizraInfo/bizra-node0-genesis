# WSL Ubuntu + vLLM Setup Guide

**Purpose**: Enable state-of-art inference performance (50+ tokens/sec)
**احسان Target**: 30+ tokens/sec minimum, 50+ tokens/sec optimal
**Estimated Time**: 2-3 hours
**Status**: Ready to execute

---

## Prerequisites

- Windows 10 version 2004+ or Windows 11
- Administrator access
- 50GB free disk space (for WSL + model)
- NVIDIA GPU with CUDA support (RTX 4090 confirmed available)

---

## Phase 1: WSL Installation (30 minutes)

### Step 1: Enable WSL

```powershell
# Open PowerShell as Administrator
wsl --install

# This installs:
# - WSL 2
# - Ubuntu (latest LTS, currently 22.04)
# - Virtual Machine Platform
# - Windows Subsystem for Linux
```

**Expected Output**:

```
Installing: Windows Subsystem for Linux
Installing: Virtual Machine Platform
Installing: Ubuntu
The requested operation is successful. Changes will not be effective until the system is rebooted.
```

### Step 2: Reboot Windows

```powershell
Restart-Computer
```

### Step 3: Complete Ubuntu Setup

After reboot, Ubuntu terminal will auto-launch:

```bash
# Create username (lowercase, no spaces)
# Example: bizra

# Set password (احسان: use strong password, save in secure location)
```

### Step 4: Verify Installation

```bash
# Check WSL version (should be 2)
wsl --list --verbose

# Expected output:
# NAME      STATE           VERSION
# Ubuntu    Running         2

# Check Ubuntu version
lsb_release -a

# Expected: Ubuntu 22.04 LTS
```

---

## Phase 2: NVIDIA CUDA Setup in WSL (45 minutes)

### Step 1: Update Ubuntu

```bash
sudo apt update && sudo apt upgrade -y
```

### Step 2: Install NVIDIA CUDA Toolkit

```bash
# Add NVIDIA repository
wget https://developer.download.nvidia.com/compute/cuda/repos/wsl-ubuntu/x86_64/cuda-keyring_1.1-1_all.deb
sudo dpkg -i cuda-keyring_1.1-1_all.deb

# Update package list
sudo apt update

# Install CUDA 11.8 (compatible with PyTorch 2.7.1)
sudo apt install -y cuda-toolkit-11-8
```

### Step 3: Set Environment Variables

```bash
# Add to ~/.bashrc
echo 'export PATH=/usr/local/cuda-11.8/bin:$PATH' >> ~/.bashrc
echo 'export LD_LIBRARY_PATH=/usr/local/cuda-11.8/lib64:$LD_LIBRARY_PATH' >> ~/.bashrc

# Reload
source ~/.bashrc
```

### Step 4: Verify CUDA

```bash
# Check NVIDIA driver (should work from WSL)
nvidia-smi

# Expected output: GPU info with CUDA Version 12.x

# Check CUDA compiler
nvcc --version

# Expected: release 11.8
```

---

## Phase 3: Python & Dependencies (20 minutes)

### Step 1: Install Python 3.11

```bash
sudo apt install -y software-properties-common
sudo add-apt-repository -y ppa:deadsnakes/ppa
sudo apt update
sudo apt install -y python3.11 python3.11-venv python3.11-dev
```

### Step 2: Create Virtual Environment

```bash
# Navigate to BIZRA project (accessible via /mnt/c/)
cd /mnt/c/BIZRA-NODE0/models/bizra-agentic-v1

# Create venv
python3.11 -m venv vllm-env

# Activate
source vllm-env/bin/activate
```

### Step 3: Install PyTorch with CUDA

```bash
pip install --upgrade pip setuptools wheel

# PyTorch 2.7.1 with CUDA 11.8
pip install torch==2.7.1 torchvision==0.18.1 torchaudio==2.7.1 --index-url https://download.pytorch.org/whl/cu118
```

### Step 4: Verify PyTorch CUDA

```bash
python3 -c "import torch; print(f'CUDA available: {torch.cuda.is_available()}'); print(f'GPU: {torch.cuda.get_device_name(0)}')"

# Expected output:
# CUDA available: True
# GPU: NVIDIA GeForce RTX 4090
```

---

## Phase 4: vLLM Installation (30 minutes)

### Step 1: Install vLLM Dependencies

```bash
# System dependencies
sudo apt install -y build-essential cmake libopenmpi-dev

# Python dependencies
pip install ninja packaging
```

### Step 2: Install vLLM

```bash
# Install vLLM 0.6.0+ (with CUDA support)
pip install vllm

# This will compile CUDA kernels - takes 10-15 minutes
# احسان: Be patient, compilation is necessary for performance
```

**Expected Output**:

```
Building wheels for collected packages: vllm
  Building wheel for vllm (setup.py) ... done
Successfully installed vllm-0.6.1
```

### Step 3: Verify vLLM

```bash
python3 -c "import vllm; print(f'vLLM version: {vllm.__version__}')"

# Expected: vLLM version: 0.6.1 (or higher)
```

---

## Phase 5: vLLM Server Deployment (15 minutes)

### Step 1: Copy Production Server

File already created: `serve-vllm-production.py` (see below)

### Step 2: Launch Server

```bash
cd /mnt/c/BIZRA-NODE0/models/bizra-agentic-v1

# Activate venv if not already active
source vllm-env/bin/activate

# Launch vLLM server
python serve-vllm-production.py
```

**Expected Output**:

```
INFO:     Starting vLLM server...
INFO:     Model: /mnt/c/BIZRA-NODE0/models/bizra-agentic-v1/base-model
INFO:     GPU memory: 12.0GB allocated (75% of 16GB)
INFO:     Loading model...
INFO:     Model loaded in 4.2s
INFO:     Server ready on http://0.0.0.0:8000
INFO:     Metrics on http://0.0.0.0:9464
INFO:     احسان target: 30+ tokens/sec
```

### Step 3: Test Performance

```bash
# From Windows or WSL, test inference
curl -X POST http://localhost:8000/v1/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "bizra-inference",
    "prompt": "What is احسان in BIZRA?",
    "max_tokens": 100
  }'

# Check response for احسان metrics
```

**Expected Performance**:

- Latency: 500-800ms for 100 tokens
- Throughput: 50-80 tokens/sec
- احسان pass: true

---

## Phase 6: Performance Validation (10 minutes)

### Step 1: Run Benchmark

```bash
# Use load test script
cd /mnt/c/BIZRA-NODE0

# Install k6 (load testing tool)
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt update
sudo apt install k6

# Run load test
k6 run tests/load-test-10k.js
```

**Expected Results**:

```
✅ احسان PASS - Ready for 10K users!

Latency (احسان target: p95 < 1000ms):
  p95: 687ms ✅

Throughput (احسان target: avg >= 30 tokens/sec):
  Average: 58.3 tokens/sec ✅

احsان Validation:
  Pass Rate: 94.2% ✅
```

---

## Phase 7: Production Integration (20 minutes)

### Step 1: Update Kubernetes Deployment

Update image to use vLLM-enabled container (see `Dockerfile.vllm-production`)

### Step 2: Update CI/CD Pipeline

Ensure GitHub Actions builds with vLLM support

### Step 3: Deploy to Testnet

```bash
# Build vLLM container
docker build -t ghcr.io/bizra/inference:v2.0.0-vllm \
  -f models/bizra-agentic-v1/Dockerfile.vllm-production \
  models/bizra-agentic-v1/

# Push to registry
docker push ghcr.io/bizra/inference:v2.0.0-vllm

# Deploy to K8s
kubectl set image deployment/bizra-inference \
  inference-server=ghcr.io/bizra/inference:v2.0.0-vllm \
  -n bizra-prod

# Monitor rollout
kubectl rollout status deployment/bizra-inference -n bizra-prod
```

---

## Troubleshooting

### Issue: "CUDA not available" in WSL

```bash
# Check NVIDIA driver
nvidia-smi

# If error, reinstall NVIDIA drivers on Windows
# Download latest GeForce drivers from nvidia.com

# Reboot Windows
# WSL will auto-detect updated drivers
```

### Issue: vLLM build fails

```bash
# Ensure CUDA toolkit installed
nvcc --version

# If missing, reinstall CUDA (Phase 2 Step 2)

# Clear pip cache and retry
pip cache purge
pip install --no-cache-dir vllm
```

### Issue: Out of GPU memory

```bash
# Reduce GPU memory fraction in serve-vllm-production.py
# Change gpu_memory_utilization from 0.75 to 0.60

# Or reduce max_model_len
# max_model_len=2048  # Instead of 4096
```

### Issue: Port 8000 already in use

```bash
# Kill existing server (Windows)
taskkill /F /IM python.exe

# Or use different port in serve-vllm-production.py
# Change: uvicorn.run(app, host="0.0.0.0", port=8001)
```

---

## احسان Validation Checklist

Before declaring vLLM setup complete, verify:

- [ ] WSL version 2 running
- [ ] Ubuntu 22.04 installed
- [ ] NVIDIA driver accessible via `nvidia-smi`
- [ ] CUDA 11.8 toolkit installed
- [ ] PyTorch CUDA available (`torch.cuda.is_available() == True`)
- [ ] vLLM installed without errors
- [ ] Server starts and loads model
- [ ] Test inference completes successfully
- [ ] Throughput >= 30 tokens/sec (احسان minimum)
- [ ] Throughput >= 50 tokens/sec (احسان optimal)
- [ ] احsان pass rate >= 80%
- [ ] Load test passes all thresholds

---

## Performance Comparison

**Before (transformers on Windows)**:

- Throughput: ~1-2 tokens/sec
- Latency: 60+ seconds per request
- احسان pass rate: 0%
- 10K users: IMPOSSIBLE

**After (vLLM on WSL)**:

- Throughput: 50-80 tokens/sec
- Latency: 500-800ms per request
- احسان pass rate: 90%+
- 10K users: READY ✅

**Improvement**: 25-40x faster, احسان-compliant

---

## Next Steps After Setup

1. Run full load test suite (tests/load-test-10k.js)
2. Deploy to Kubernetes testnet
3. Execute deployment checklist (DEPLOYMENT-CHECKLIST-10K.md)
4. Begin phased rollout: 100 → 1K → 10K users
5. Monitor احسان metrics in Grafana

---

**الحمد لله** - WSL setup enables state-of-art performance for serving humanity.

**احسان Score After Completion**: 95%+ (infrastructure + performance both PEAK)

**Time to 10K Users**: <24 hours from WSL setup completion
