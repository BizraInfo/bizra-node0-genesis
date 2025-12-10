# WEEK 1 DAY 3 - EXECUTION PLAN

**Date:** October 20, 2025 (Tomorrow)
**Focus:** Data Organization & ARC-AGI Preparation
**Duration:** 3-4 hours
**Status:** PLANNED

---

## 🎯 Objectives

1. Organize BIZRA-DATA directory structure
2. Download ARC-AGI dataset
3. Set up data processing pipeline
4. Configure automated backups
5. Test complete system integration

---

## 📋 Tasks

### Task 1: Data Directory Organization (30 min)

**Create complete data structure:**

```bash
C:\BIZRA-NODE0\BIZRA-DATA\
├── arc-agi/
│   ├── evaluation/          # ARC-AGI evaluation set
│   ├── training/            # ARC-AGI training set
│   ├── test/                # ARC-AGI test set
│   └── submissions/         # Our solution submissions
├── models/
│   ├── deepseek-8b/         # DeepSeek strategic model
│   ├── qwen-4b/             # Qwen tactical model
│   ├── embeddings/          # Custom embedding models
│   └── checkpoints/         # Training checkpoints
├── datasets/
│   ├── training/            # Training data for fine-tuning
│   ├── validation/          # Validation datasets
│   └── benchmarks/          # Benchmark datasets
├── outputs/
│   ├── experiments/         # Experiment results
│   ├── reports/             # Generated reports
│   └── visualizations/      # Data visualizations
└── backups/
    ├── postgres/            # PostgreSQL backups
    ├── neo4j/               # Neo4j backups
    └── redis/               # Redis backups
```

**Commands:**

```bash
cd C:/BIZRA-NODE0/BIZRA-DATA
mkdir -p arc-agi/{evaluation,training,test,submissions}
mkdir -p models/{deepseek-8b,qwen-4b,embeddings,checkpoints}
mkdir -p datasets/{training,validation,benchmarks}
mkdir -p outputs/{experiments,reports,visualizations}
# backups already created
```

---

### Task 2: Download ARC-AGI Dataset (45 min)

**ARC-AGI Competition Data:**

- Source: https://github.com/fchollet/ARC-AGI
- Evaluation set: ~400 tasks
- Training set: ~400 tasks
- Test set: Private (for competition)

**Download Commands:**

```bash
cd C:/BIZRA-NODE0/BIZRA-DATA/arc-agi

# Clone ARC-AGI repository
git clone https://github.com/fchollet/ARC-AGI.git temp_arc
cd temp_arc

# Copy data files
cp -r data/evaluation ../evaluation/
cp -r data/training ../training/

# Download ARC Prize 2025 specific data
# (Check competition page for latest dataset)

cd ..
rm -rf temp_arc

echo "ARC-AGI dataset downloaded successfully"
```

**Verification:**

```bash
# Count tasks
find evaluation -name "*.json" | wc -l  # Should be ~400
find training -name "*.json" | wc -l    # Should be ~400
```

---

### Task 3: Data Processing Pipeline Setup (60 min)

**Create data processing scripts:**

**File:** `C:\BIZRA-NODE0\BIZRA-DATA\scripts\process_arc_tasks.py`

```python
#!/usr/bin/env python3
"""
ARC-AGI Task Processor
Loads, validates, and processes ARC tasks for BIZRA
"""
import json
import os
from pathlib import Path
from typing import Dict, List

def load_arc_task(task_path: Path) -> Dict:
    """Load and validate ARC task JSON"""
    with open(task_path, 'r') as f:
        task = json.load(f)
    return task

def process_dataset(dataset_dir: Path) -> List[Dict]:
    """Process all tasks in dataset directory"""
    tasks = []
    for task_file in dataset_dir.glob("*.json"):
        task = load_arc_task(task_file)
        tasks.append({
            'id': task_file.stem,
            'task': task,
            'path': str(task_file)
        })
    return tasks

if __name__ == "__main__":
    data_root = Path("C:/BIZRA-NODE0/BIZRA-DATA/arc-agi")

    # Process evaluation set
    eval_tasks = process_dataset(data_root / "evaluation")
    print(f"Processed {len(eval_tasks)} evaluation tasks")

    # Process training set
    train_tasks = process_dataset(data_root / "training")
    print(f"Processed {len(train_tasks)} training tasks")

    # Save metadata
    metadata = {
        'evaluation_count': len(eval_tasks),
        'training_count': len(train_tasks),
        'total_count': len(eval_tasks) + len(train_tasks)
    }

    with open(data_root / "metadata.json", 'w') as f:
        json.dump(metadata, f, indent=2)

    print(f"✅ Total tasks: {metadata['total_count']}")
```

**Create script:**

```bash
cd C:/BIZRA-NODE0/BIZRA-DATA
mkdir -p scripts
# Create process_arc_tasks.py with above content
chmod +x scripts/process_arc_tasks.py
python scripts/process_arc_tasks.py
```

---

### Task 4: Automated Backup Configuration (45 min)

**Create automated backup script:**

**File:** `C:\BIZRA-NODE0\BIZRA-TOOLS\scripts\auto-backup.sh`

```bash
#!/bin/bash
# BIZRA NODE0 - Automated Backup Script
# Runs daily backups of all databases

BACKUP_DIR="/c/BIZRA-NODE0/BIZRA-DATA/backups"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=7

echo "Starting automated backup - $DATE"

# Backup PostgreSQL
docker exec bizra-postgres pg_dump -U postgres bizra > "$BACKUP_DIR/postgres/bizra_$DATE.sql"
gzip "$BACKUP_DIR/postgres/bizra_$DATE.sql"
echo "✅ PostgreSQL backup complete"

# Backup Neo4j
docker exec bizra-neo4j neo4j-admin database dump neo4j --to-path=/backups/neo4j_$DATE.dump
docker cp bizra-neo4j:/backups/neo4j_$DATE.dump "$BACKUP_DIR/neo4j/"
echo "✅ Neo4j backup complete"

# Backup Redis (AOF enabled, just trigger BGSAVE)
docker exec bizra-redis redis-cli -a redis BGSAVE
echo "✅ Redis backup triggered"

# Cleanup old backups (keep last 7 days)
find "$BACKUP_DIR/postgres" -name "bizra_*.sql.gz" -mtime +$RETENTION_DAYS -delete
find "$BACKUP_DIR/neo4j" -name "neo4j_*.dump" -mtime +$RETENTION_DAYS -delete

echo "✅ Automated backup complete - $DATE"
```

**Windows Task Scheduler Setup (Alternative):**

```powershell
# Create scheduled task to run daily at 2 AM
$action = New-ScheduledTaskAction -Execute "bash" -Argument "C:/BIZRA-NODE0/BIZRA-TOOLS/scripts/auto-backup.sh"
$trigger = New-ScheduledTaskTrigger -Daily -At 2AM
Register-ScheduledTask -Action $action -Trigger $trigger -TaskName "BIZRA-Daily-Backup" -Description "Daily automated backup of BIZRA databases"
```

---

### Task 5: System Integration Testing (60 min)

**Test complete Node0 system:**

1. **Start all services:**

```bash
bash /c/BIZRA-NODE0/BIZRA-TOOLS/scripts/node0-startup.sh
```

2. **Run health check:**

```bash
bash /c/BIZRA-NODE0/BIZRA-TOOLS/scripts/health-check.sh
```

3. **Test data processing:**

```bash
cd C:/BIZRA-NODE0/BIZRA-DATA
python scripts/process_arc_tasks.py
```

4. **Test database connectivity:**

```bash
# PostgreSQL
docker exec bizra-postgres psql -U postgres -c "SELECT version();"

# Neo4j
docker exec bizra-neo4j cypher-shell -u neo4j -p password "RETURN 1"

# Redis
docker exec bizra-redis redis-cli -a redis PING
```

5. **Run automated backup:**

```bash
bash /c/BIZRA-NODE0/BIZRA-TOOLS/scripts/auto-backup.sh
```

6. **Verify backups created:**

```bash
ls -lh C:/BIZRA-NODE0/BIZRA-DATA/backups/postgres/
ls -lh C:/BIZRA-NODE0/BIZRA-DATA/backups/neo4j/
```

---

## 📊 Success Criteria

- [ ] All data directories created and organized
- [ ] ARC-AGI dataset downloaded (~800 tasks total)
- [ ] Data processing script operational
- [ ] Automated backup working
- [ ] All services healthy
- [ ] Complete system integration verified

---

## 🔥 Expected Outcomes

By end of Day 3:

- ✅ Complete data infrastructure ready
- ✅ ARC-AGI competition data available
- ✅ Automated daily backups configured
- ✅ Full system integration tested and verified
- ✅ Ready for Day 4 (Infrastructure code)

---

## ⏱️ Time Breakdown

| Task                        | Duration | Total |
| --------------------------- | -------- | ----- |
| Task 1: Data organization   | 30 min   | 0:30  |
| Task 2: Download ARC-AGI    | 45 min   | 1:15  |
| Task 3: Processing pipeline | 60 min   | 2:15  |
| Task 4: Backup automation   | 45 min   | 3:00  |
| Task 5: Integration testing | 60 min   | 4:00  |

**Total:** 4 hours

---

## 📝 Notes

- ARC-AGI dataset is critical for $700K Grand Prize competition
- Automated backups protect against data loss
- Complete system integration ensures all components work together
- This completes the foundation phase (Days 1-3)
- Week 1 Days 4-7 focus on infrastructure code and GitHub launch

---

**Status:** Ready to execute tomorrow
**Dependencies:** Days 1 & 2 complete ✅
**Next:** Day 4 - Infrastructure Code (Terraform, Kubernetes)
