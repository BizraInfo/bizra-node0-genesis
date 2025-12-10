# BIZRA Node-0 - Horizontal Scalability Strategy

## Overview

This document defines the horizontal scalability approach for the BIZRA Node-0 Genesis Validation System, covering service scaling, data partitioning, load balancing, and performance optimization strategies to handle exponential growth.

## Scalability Objectives

### Target Metrics

| Metric                 | Current Target | 6-Month Target | 12-Month Target |
| ---------------------- | -------------- | -------------- | --------------- |
| Transactions/second    | 10,000         | 50,000         | 100,000         |
| Active Validators      | 500            | 5,000          | 10,000          |
| Block Time             | 6 seconds      | 4 seconds      | 3 seconds       |
| API Requests/second    | 50,000         | 250,000        | 500,000         |
| Concurrent Connections | 10,000         | 50,000         | 100,000         |
| P95 Latency            | < 200ms        | < 150ms        | < 100ms         |
| P99 Latency            | < 500ms        | < 300ms        | < 200ms         |
| Availability           | 99.95%         | 99.99%         | 99.995%         |

### Scalability Principles

1. **Stateless Services**: All application services are stateless for horizontal scaling
2. **Database Sharding**: Partition data horizontally across database instances
3. **Message Queue Partitioning**: Distribute load across Kafka partitions
4. **Load Balancing**: Intelligent request distribution across service instances
5. **Caching Strategy**: Multi-tier caching to reduce database load
6. **Asynchronous Processing**: Event-driven architecture for decoupling
7. **Auto-scaling**: Dynamic resource allocation based on demand

## 1. Service-Level Scaling Strategies

### 1.1 Validator Service Scaling

**Scaling Dimensions**:

- Horizontal: Scale pods based on request rate and CPU
- Vertical: Increase resources for memory-intensive operations

**Autoscaling Configuration**:

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: validator-service-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: validator-service
  minReplicas: 3
  maxReplicas: 50
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
    - type: Pods
      pods:
        metric:
          name: http_requests_per_second
        target:
          type: AverageValue
          averageValue: "5000"
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 0
      policies:
        - type: Percent
          value: 100 # Double pods immediately if needed
          periodSeconds: 15
        - type: Pods
          value: 4
          periodSeconds: 15
      selectPolicy: Max
    scaleDown:
      stabilizationWindowSeconds: 300 # Wait 5 min before scaling down
      policies:
        - type: Percent
          value: 10 # Remove 10% of pods
          periodSeconds: 60
```

**Scaling Triggers**:

- CPU > 70% for 30 seconds → Scale up
- Memory > 80% for 30 seconds → Scale up
- Request queue depth > 1000 → Scale up
- CPU < 30% for 5 minutes → Scale down

**Read Replica Strategy**:

```
┌──────────────────────────────────────────────────┐
│           Validator Service Pods                 │
│  ┌──────┐  ┌──────┐  ┌──────┐     ┌──────┐     │
│  │ Pod 1│  │ Pod 2│  │ Pod 3│ ... │ Pod N│     │
│  └───┬──┘  └───┬──┘  └───┬──┘     └───┬──┘     │
└──────┼─────────┼─────────┼─────────────┼────────┘
       │         │         │             │
       │ Write   │ Read    │ Read        │ Read
       │         │         │             │
       ▼         ▼         ▼             ▼
┌────────────┐ ┌────────────┐ ┌────────────┐
│ PostgreSQL │ │ PostgreSQL │ │ PostgreSQL │
│  Primary   │ │  Replica 1 │ │  Replica 2 │
└────────────┘ └────────────┘ └────────────┘
       │
       │ Streaming Replication
       └──────────────────────────────────►
```

**Load Distribution**:

- Writes: Always to primary
- Reads: Round-robin across replicas with health checks
- Critical reads: Primary (for strong consistency)

### 1.2 Block Service Scaling

**Scaling Strategy**: High throughput with partitioning

**Data Partitioning**:

```
Block Height Range Assignment
═══════════════════════════════

Instance 1: Heights 0 - 999,999
Instance 2: Heights 1,000,000 - 1,999,999
Instance 3: Heights 2,000,000 - 2,999,999
...

Current Height Tracking:
  Router → Consistent Hash → Active Instance
```

**Partitioning Logic**:

```go
func GetBlockServiceInstance(blockHeight uint64) string {
    partitionSize := 1_000_000
    partition := blockHeight / partitionSize

    // Consistent hashing to service instance
    instanceCount := getHealthyInstanceCount()
    instanceID := partition % instanceCount

    return fmt.Sprintf("block-service-%d", instanceID)
}
```

**Cassandra Partitioning**:

```cql
-- Partition by day for time-series queries
CREATE TABLE blocks_by_height (
    day text,              -- '2025-10-17'
    height bigint,
    block_hash text,
    proposer_id text,
    tx_count int,
    timestamp timestamp,
    PRIMARY KEY ((day), height)
) WITH CLUSTERING ORDER BY (height DESC);

-- Partition strategy: ~14,400 blocks/day (at 6s block time)
-- Each partition holds one day's blocks
-- Old partitions can be moved to cheaper storage
```

**Scaling Configuration**:

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: block-service-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: block-service
  minReplicas: 5
  maxReplicas: 100
  metrics:
    - type: Pods
      pods:
        metric:
          name: blocks_processed_per_second
        target:
          type: AverageValue
          averageValue: "1000"
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 75
```

### 1.3 Consensus Service Scaling

**Scaling Challenge**: Consensus requires coordination

**Strategy**: Shard by validator set

```
┌──────────────────────────────────────────────────┐
│        Consensus Coordinator (Leader)            │
└───────────────────┬──────────────────────────────┘
                    │
        ┌───────────┼───────────┬───────────┐
        │           │           │           │
        ▼           ▼           ▼           ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Consensus    │ │ Consensus    │ │ Consensus    │
│ Worker 1     │ │ Worker 2     │ │ Worker 3     │
│              │ │              │ │              │
│ Validators   │ │ Validators   │ │ Validators   │
│ 0-999        │ │ 1000-1999    │ │ 2000-2999    │
└──────────────┘ └──────────────┘ └──────────────┘
```

**Sharding Logic**:

```go
type ConsensusWorker struct {
    ValidatorRange ValidatorRange
    Workers        int
}

func AssignValidatorToWorker(validatorID string) int {
    hash := xxhash.Sum64String(validatorID)
    workerCount := getConsensusWorkerCount()
    return int(hash % uint64(workerCount))
}

// Each worker handles a subset of validators
// Aggregation happens at coordinator level
```

**Vertical Scaling Priority**:

- Consensus is CPU-bound (cryptographic operations)
- Prefer vertical scaling: c6i.8xlarge (32 vCPU, 64GB RAM)
- Horizontal scaling: Limited to 3-5 instances to avoid coordination overhead

### 1.4 Transaction Service Scaling

**Strategy**: Partition mempool by sender address

**Mempool Partitioning**:

```
┌──────────────────────────────────────────────────┐
│           Transaction Router                     │
└───────────────────┬──────────────────────────────┘
                    │
        ┌───────────┼───────────┬───────────┐
        │           │           │           │
        ▼           ▼           ▼           ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Mempool      │ │ Mempool      │ │ Mempool      │
│ Shard 0      │ │ Shard 1      │ │ Shard 2      │
│              │ │              │ │              │
│ Addresses:   │ │ Addresses:   │ │ Addresses:   │
│ 0x0..0x5     │ │ 0x6..0xA     │ │ 0xB..0xF     │
└──────────────┘ └──────────────┘ └──────────────┘
```

**Sharding Function**:

```go
func GetMempoolShard(senderAddress string) int {
    // Use first byte of address for sharding
    firstByte := senderAddress[2:4]  // After '0x'
    byteValue, _ := strconv.ParseInt(firstByte, 16, 64)
    shardCount := getMempoolShardCount()
    return int(byteValue) % shardCount
}

// Transaction ordering within shard by:
// 1. Gas price (descending)
// 2. Nonce (ascending)
// 3. Timestamp (ascending)
```

**Redis Cluster for Mempool**:

```
Redis Cluster (16 shards)
┌──────────────────────────────────────────────────┐
│  Shard 0-3  │  Shard 4-7  │  Shard 8-11  │ 12-15 │
│  Master + 2 │  Master + 2 │  Master + 2  │ M + 2 │
│  Replicas   │  Replicas   │  Replicas    │ Reps  │
└──────────────────────────────────────────────────┘

Hash Slots: 16384 total
  - Shard 0: 0-1023
  - Shard 1: 1024-2047
  ...
  - Shard 15: 15360-16383
```

### 1.5 Network Service Scaling

**Strategy**: Geo-distributed nodes with gossip protocol

**Topology**:

```
┌──────────────────────────────────────────────────┐
│              Global Network                      │
└──────────────────────────────────────────────────┘

Region: US-East                Region: EU-West
┌──────────────┐               ┌──────────────┐
│ Network      │◄─────────────►│ Network      │
│ Service      │   Gossip      │ Service      │
│ (10 nodes)   │   Protocol    │ (10 nodes)   │
└──────────────┘               └──────────────┘
       ▲                              ▲
       │                              │
       │ Peers                        │ Peers
       │                              │
┌──────▼──────┐               ┌──────▼──────┐
│ Validator   │               │ Validator   │
│ Nodes       │               │ Nodes       │
│ (200 nodes) │               │ (300 nodes) │
└─────────────┘               └─────────────┘

Region: Asia-Pacific
┌──────────────┐
│ Network      │
│ Service      │
│ (8 nodes)    │
└──────┬───────┘
       │ Peers
┌──────▼──────┐
│ Validator   │
│ Nodes       │
│ (200 nodes) │
└─────────────┘
```

**Gossip Fan-out**:

```go
type GossipConfig struct {
    FanOut         int           // Peers to forward to (default: 6)
    GossipInterval time.Duration // 100ms
    TTL            uint8         // Max hops (default: 6)
}

// Message reaches 99.9% of network in:
// log(totalNodes) / log(fanOut) * gossipInterval
// log(10000) / log(6) * 100ms ≈ 517ms
```

## 2. Database Scaling Strategies

### 2.1 PostgreSQL Horizontal Scaling

**Primary-Replica Configuration**:

```
┌────────────────────────────────────────────────────┐
│               PostgreSQL Cluster                   │
└────────────────────────────────────────────────────┘

                  ┌──────────────┐
                  │   Primary    │
                  │  (Writes)    │
                  └──────┬───────┘
                         │
         ┌───────────────┼───────────────┬───────────┐
         │ WAL           │ WAL           │ WAL       │
         │ Streaming     │ Streaming     │ Streaming │
         │               │               │           │
         ▼               ▼               ▼           ▼
   ┌──────────┐    ┌──────────┐    ┌──────────┐ ┌──────────┐
   │ Replica 1│    │ Replica 2│    │ Replica 3│ │ Replica 4│
   │ (Read)   │    │ (Read)   │    │ (Read)   │ │ (Analytics)
   └──────────┘    └──────────┘    └──────────┘ └──────────┘
```

**Read Routing Strategy**:

```go
type PostgresConnectionPool struct {
    Primary   *pgxpool.Pool
    Replicas  []*pgxpool.Pool
    ReplicaLB LoadBalancer
}

func (p *PostgresConnectionPool) Query(ctx context.Context, query string) (*pgx.Rows, error) {
    if isWriteQuery(query) || requiresStrongConsistency(ctx) {
        return p.Primary.Query(ctx, query)
    }

    // Read from replica with least connections
    replica := p.ReplicaLB.SelectReplica()
    return replica.Query(ctx, query)
}
```

**Sharding Strategy (Future)**:

```
Shard by Validator ID Prefix
════════════════════════════

Shard 0: ValidatorIDs starting with 0x0..0x3
Shard 1: ValidatorIDs starting with 0x4..0x7
Shard 2: ValidatorIDs starting with 0x8..0xB
Shard 3: ValidatorIDs starting with 0xC..0xF

Cross-Shard Queries:
  - Aggregate via application layer
  - Use read replicas for reporting
  - Consider Citus extension for distributed queries
```

### 2.2 Cassandra Scaling

**Linear Horizontal Scaling**:

```
Initial: 3 nodes (RF=3)
───────────────────────────
Node 1: Token Range 0 - 5.5e18
Node 2: Token Range 5.5e18 - 1.1e19
Node 3: Token Range 1.1e19 - 1.84e19

Scale to 6 nodes:
───────────────────────────
Node 1: Token Range 0 - 2.8e18
Node 2: Token Range 2.8e18 - 5.5e18
Node 3: Token Range 5.5e18 - 8.3e18
Node 4: Token Range 8.3e18 - 1.1e19
Node 5: Token Range 1.1e19 - 1.38e19
Node 6: Token Range 1.38e19 - 1.84e19

Rebalancing: Automatic (vnodes)
Downtime: Zero
```

**Scaling Operations**:

```bash
# Add new node (automatic rebalancing)
nodetool bootstrap --token auto

# Monitor rebalancing
nodetool netstats

# Verify data distribution
nodetool status
```

### 2.3 Redis Cluster Scaling

**Add Shards Dynamically**:

```bash
# Add new master-replica pair
redis-cli --cluster add-node new-master:6379 existing-node:6379

# Add replica for new master
redis-cli --cluster add-node new-replica:6379 new-master:6379 --cluster-slave

# Rebalance slots
redis-cli --cluster rebalance existing-node:6379 --cluster-use-empty-masters
```

**Scaling Impact**:

- Rebalancing: Automatic slot migration
- Downtime: Zero (redirects during migration)
- Time: ~1 minute per GB of data

## 3. Message Queue Scaling

### 3.1 Kafka Partition Scaling

**Partition Strategy**:

```
Topic: transaction.events
───────────────────────────
Partitions: 20 (initial) → 40 (scaled)

Partitioning Key: Transaction Sender Address
Message Ordering: Guaranteed per sender

Partition Assignment:
  - Consumer Group A: Partitions 0-9
  - Consumer Group B: Partitions 10-19
  - Consumer Group C: Partitions 20-29
  - Consumer Group D: Partitions 30-39
```

**Add Partitions**:

```bash
# Add partitions (cannot decrease)
kafka-topics --bootstrap-server localhost:9092 \
  --alter --topic transaction.events \
  --partitions 40

# Rebalance will happen automatically
# New messages will use all 40 partitions
# Existing messages stay in original partitions
```

**Consumer Scaling**:

```
1 Partition  → 1 Consumer  (optimal)
20 Partitions → 20 Consumers (max parallelism)

Rule: Consumers ≤ Partitions
  - More consumers than partitions = idle consumers
  - Fewer consumers than partitions = consumers handle multiple partitions
```

### 3.2 Kafka Broker Scaling

**Add Broker**:

```bash
# Start new broker with unique broker.id
./kafka-server-start.sh server.properties

# Reassign partitions to new broker
kafka-reassign-partitions --bootstrap-server localhost:9092 \
  --reassignment-json-file reassignment.json \
  --execute

# Monitor reassignment
kafka-reassign-partitions --bootstrap-server localhost:9092 \
  --reassignment-json-file reassignment.json \
  --verify
```

**Replication Scaling**:

```
Initial: 3 brokers, RF=3
Scaled: 6 brokers, RF=3

Before:
  Partition 0: [Broker 1, Broker 2, Broker 3]
  Partition 1: [Broker 2, Broker 3, Broker 1]
  Partition 2: [Broker 3, Broker 1, Broker 2]

After:
  Partition 0: [Broker 1, Broker 4, Broker 6]
  Partition 1: [Broker 2, Broker 5, Broker 1]
  Partition 2: [Broker 3, Broker 6, Broker 2]
  Partition 3: [Broker 4, Broker 1, Broker 3]
  Partition 4: [Broker 5, Broker 2, Broker 4]
  Partition 5: [Broker 6, Broker 3, Broker 5]
```

## 4. Load Balancing Strategies

### 4.1 API Gateway Load Balancing

**Kong Load Balancing Algorithms**:

1. **Round Robin** (default):

```lua
-- Distributes requests evenly
upstream validator-service {
  server validator-1:8080;
  server validator-2:8080;
  server validator-3:8080;
}
```

2. **Least Connections**:

```lua
-- Routes to instance with fewest active connections
upstream validator-service {
  least_conn;
  server validator-1:8080;
  server validator-2:8080;
  server validator-3:8080;
}
```

3. **Weighted Round Robin**:

```lua
-- Distribute based on capacity
upstream validator-service {
  server validator-1:8080 weight=3;  -- More powerful instance
  server validator-2:8080 weight=2;
  server validator-3:8080 weight=1;
}
```

4. **Consistent Hashing** (for sticky sessions):

```lua
-- Same client always goes to same backend
upstream validator-service {
  hash $request_uri consistent;
  server validator-1:8080;
  server validator-2:8080;
  server validator-3:8080;
}
```

### 4.2 Service Mesh Load Balancing

**Istio Destination Rule**:

```yaml
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: validator-service
spec:
  host: validator-service
  trafficPolicy:
    loadBalancer:
      consistentHash:
        httpHeaderName: x-user-id # Hash based on user ID
    connectionPool:
      tcp:
        maxConnections: 100
      http:
        http1MaxPendingRequests: 50
        http2MaxRequests: 100
        maxRequestsPerConnection: 2
    outlierDetection:
      consecutiveErrors: 5
      interval: 30s
      baseEjectionTime: 30s
      maxEjectionPercent: 50
      minHealthPercent: 50
```

### 4.3 Database Connection Pooling

**PgBouncer Configuration**:

```ini
[databases]
validator_db = host=postgres-primary port=5432 dbname=validator_db

[pgbouncer]
pool_mode = transaction  # Connection released after transaction
max_client_conn = 10000  # Max client connections
default_pool_size = 25   # Pool size per user/database
reserve_pool_size = 5    # Emergency connections
```

**Connection Routing**:

```
┌──────────────────────────────────────────────────┐
│           Application Pods (50)                  │
│     Each pod: 100 DB connection requests         │
│     Total: 5,000 potential connections           │
└───────────────────┬──────────────────────────────┘
                    │
                    ▼
┌──────────────────────────────────────────────────┐
│              PgBouncer                           │
│     Pool: 25 actual connections per pod          │
│     Total: 1,250 actual connections              │
└───────────────────┬──────────────────────────────┘
                    │
         ┌──────────┼──────────┐
         │ Write    │ Read     │ Read
         │          │          │
         ▼          ▼          ▼
   ┌─────────┐ ┌─────────┐ ┌─────────┐
   │ Primary │ │Replica 1│ │Replica 2│
   │ (400    │ │ (425    │ │ (425    │
   │  conns) │ │  conns) │ │  conns) │
   └─────────┘ └─────────┘ └─────────┘
```

## 5. Caching Strategies

### 5.1 Multi-Tier Caching

```
┌──────────────────────────────────────────────────┐
│                Request Flow                      │
└──────────────────────────────────────────────────┘

Client Request
     │
     ▼
┌─────────────┐
│ CDN Cache   │ (Edge caching for static content)
│ TTL: 1 hour │
└──────┬──────┘
       │ MISS
       ▼
┌─────────────┐
│ API Gateway │
│ Cache       │ (Kong response caching)
│ TTL: 5 min  │
└──────┬──────┘
       │ MISS
       ▼
┌─────────────┐
│ Application │
│ Local Cache │ (In-memory, per-pod)
│ TTL: 1 min  │
└──────┬──────┘
       │ MISS
       ▼
┌─────────────┐
│ Redis       │ (Distributed cache)
│ TTL: 15 min │
└──────┬──────┘
       │ MISS
       ▼
┌─────────────┐
│ Database    │ (Source of truth)
│ Read Replica│
└─────────────┘
```

### 5.2 Cache Warming Strategy

**Proactive Cache Warming**:

```go
// Warm cache before traffic spike
func WarmCache() {
    // Top 1000 validators
    validators := getTop Validators(1000)
    for _, v := range validators {
        cacheKey := fmt.Sprintf("validator:%s", v.ID)
        redis.Set(cacheKey, v, 15*time.Minute)
    }

    // Active validator set
    activeValidators := getActiveValidators()
    redis.Set("active_validators", activeValidators, 5*time.Minute)

    // Leaderboard
    leaderboard := getLeaderboard(100)
    redis.ZAdd("leaderboard", leaderboard...)
}

// Schedule warming every hour
cron.Schedule("@hourly", WarmCache)
```

### 5.3 Cache Invalidation

**Event-Driven Invalidation**:

```go
// Kafka consumer for cache invalidation
func HandleValidatorUpdatedEvent(event ValidatorUpdatedEvent) {
    // Invalidate specific validator
    redis.Del(fmt.Sprintf("validator:%s", event.ValidatorID))

    // Invalidate aggregates
    redis.Del("active_validators")
    redis.Del("leaderboard")

    // Optionally: Proactively refresh
    go refreshValidatorCache(event.ValidatorID)
}
```

## 6. Auto-Scaling Policies

### 6.1 Predictive Scaling

**Time-Based Scaling**:

```yaml
# CronHPA (Custom Resource)
apiVersion: autoscaling.alibabacloud.com/v1beta1
kind: CronHorizontalPodAutoscaler
metadata:
  name: validator-service-cron-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: validator-service
  jobs:
    - name: morning-scale-up
      schedule: "0 8 * * *" # 8 AM UTC
      targetSize: 30
      timezone: UTC
    - name: evening-scale-up
      schedule: "0 18 * * *" # 6 PM UTC
      targetSize: 40
    - name: night-scale-down
      schedule: "0 2 * * *" # 2 AM UTC
      targetSize: 10
```

### 6.2 Event-Driven Scaling (KEDA)

**Kafka-Based Scaling**:

```yaml
apiVersion: keda.sh/v1alpha1
kind: ScaledObject
metadata:
  name: transaction-processor-scaler
spec:
  scaleTargetRef:
    name: transaction-processor
  minReplicaCount: 5
  maxReplicaCount: 200
  triggers:
    - type: kafka
      metadata:
        bootstrapServers: kafka:9092
        consumerGroup: transaction-processor-group
        topic: transaction.events
        lagThreshold: "1000" # Scale up if lag > 1000 messages
        offsetResetPolicy: latest
```

### 6.3 Custom Metrics Scaling

**Prometheus-Based Scaling**:

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: block-service-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: block-service
  minReplicas: 5
  maxReplicas: 100
  metrics:
    - type: External
      external:
        metric:
          name: blocks_pending_validation
          selector:
            matchLabels:
              service: block-service
        target:
          type: AverageValue
          averageValue: "500"
```

## 7. Performance Optimization

### 7.1 Query Optimization

**Indexed Queries**:

```sql
-- Validator queries
CREATE INDEX idx_validators_status ON validators(status) WHERE status = 'active';
CREATE INDEX idx_validators_reputation ON validators(reputation DESC);
CREATE INDEX idx_validators_stake ON validators(stake DESC);

-- Block queries
CREATE INDEX idx_blocks_height ON blocks(height DESC);
CREATE INDEX idx_blocks_proposer ON blocks(proposer_id, height DESC);
CREATE INDEX idx_blocks_timestamp ON blocks(timestamp DESC);

-- Transaction queries
CREATE INDEX idx_transactions_sender ON transactions(sender, nonce);
CREATE INDEX idx_transactions_block ON transactions(block_hash);
```

**Materialized Views**:

```sql
-- Pre-computed leaderboard
CREATE MATERIALIZED VIEW validator_leaderboard AS
SELECT
    v.id,
    v.name,
    v.reputation,
    v.stake,
    COUNT(b.id) as blocks_proposed,
    RANK() OVER (ORDER BY v.reputation DESC) as rank
FROM validators v
LEFT JOIN blocks b ON v.id = b.proposer_id
WHERE v.status = 'active'
GROUP BY v.id, v.name, v.reputation, v.stake
ORDER BY v.reputation DESC;

-- Refresh every 5 minutes
CREATE INDEX ON validator_leaderboard(rank);
REFRESH MATERIALIZED VIEW CONCURRENTLY validator_leaderboard;
```

### 7.2 Connection Pooling

**Optimal Pool Sizes**:

```
Formula: connections = ((core_count * 2) + effective_spindle_count)

Example:
  - 16 CPU cores
  - SSD (effective_spindle_count ≈ 1)
  - Pool size = (16 * 2) + 1 = 33

Rule of Thumb:
  - Web services: 10-20 connections per pod
  - Background workers: 5-10 connections per pod
  - Read replicas: Can have higher pool sizes (40-50)
```

### 7.3 Batching Strategies

**Database Batch Inserts**:

```go
func BatchInsertTransactions(txs []Transaction) error {
    batchSize := 1000
    for i := 0; i < len(txs); i += batchSize {
        end := i + batchSize
        if end > len(txs) {
            end = len(txs)
        }
        batch := txs[i:end]

        // Single query with multiple values
        query := `INSERT INTO transactions (hash, sender, receiver, amount, nonce) VALUES `
        values := []interface{}{}
        for j, tx := range batch {
            query += fmt.Sprintf("($%d, $%d, $%d, $%d, $%d),", j*5+1, j*5+2, j*5+3, j*5+4, j*5+5)
            values = append(values, tx.Hash, tx.Sender, tx.Receiver, tx.Amount, tx.Nonce)
        }
        query = query[:len(query)-1]  // Remove trailing comma

        _, err := db.Exec(query, values...)
        if err != nil {
            return err
        }
    }
    return nil
}
```

**Event Batching**:

```go
func BatchPublishEvents(events []Event) error {
    // Kafka supports batching internally
    producer.ProduceBatch(events, kafka.ProducerOptions{
        BatchSize:        1000,
        LingerTime:       10 * time.Millisecond,
        CompressionCodec: kafka.CompressionLZ4,
    })
}
```

## 8. Disaster Recovery and Failover

### 8.1 Multi-Region Architecture

```
┌────────────────────────────────────────────────────────┐
│               Global Load Balancer                     │
│              (Route 53 / Cloud DNS)                    │
└─────────────────┬──────────────────────────────────────┘
                  │
      ┌───────────┼───────────┬───────────┐
      │           │           │           │
      ▼           ▼           ▼           ▼
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│ Region 1 │ │ Region 2 │ │ Region 3 │ │ Region 4 │
│ US-East  │ │ EU-West  │ │ Asia-    │ │ US-West  │
│ (Primary)│ │ (Active) │ │ Pacific  │ │ (DR)     │
│          │ │          │ │ (Active) │ │          │
└────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘
     │            │            │            │
     └────────────┴────────────┴────────────┘
                  │
          Data Replication
       (PostgreSQL, Kafka, Redis)
```

### 8.2 Automatic Failover

**Database Failover** (Patroni):

```yaml
# Patroni configuration
bootstrap:
  dcs:
    ttl: 30
    loop_wait: 10
    retry_timeout: 10
    maximum_lag_on_failover: 1048576 # 1MB
    postgresql:
      parameters:
        max_connections: 500
        shared_buffers: 8GB
# Automatic failover:
#   1. Primary fails
#   2. Patroni detects within 30s
#   3. Promotes replica with least lag
#   4. Updates DNS/load balancer
#   5. Downtime: < 60 seconds
```

**Service Mesh Failover** (Istio):

```yaml
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: validator-service
spec:
  host: validator-service
  trafficPolicy:
    outlierDetection:
      consecutiveErrors: 5
      interval: 10s
      baseEjectionTime: 30s
      maxEjectionPercent: 50
      minHealthPercent: 50
  subsets:
    - name: v1
      labels:
        version: v1
    - name: v2
      labels:
        version: v2
```

## 9. Cost Optimization

### 9.1 Right-Sizing

**Instance Type Selection**:

```
Workload Type → Optimal Instance Family

CPU-Intensive (Consensus, Block Processing):
  AWS: c6i, c6a, c7g
  GCP: c2, c2d
  Azure: Fsv2, Fx

Memory-Intensive (Caching, State Management):
  AWS: r6i, r6a, r7g
  GCP: m2, m1
  Azure: Ev5, Esv5

Balanced (API Services):
  AWS: m6i, m6a, m7g
  GCP: n2, n2d
  Azure: Dv5, Dsv5

Burstable (Low-Traffic Services):
  AWS: t3, t3a, t4g
  GCP: e2
  Azure: B-series
```

### 9.2 Spot Instances

**Spot Instance Strategy**:

```yaml
# Kubernetes cluster with spot instances
nodeGroups:
  - name: on-demand-core
    instanceType: c6i.4xlarge
    minSize: 5
    maxSize: 10
    desiredCapacity: 5
    labels:
      node-type: on-demand
    taints:
      - key: workload
        value: critical
        effect: NoSchedule

  - name: spot-workers
    instancesDistribution:
      instanceTypes:
        - c6i.4xlarge
        - c6a.4xlarge
        - c5.4xlarge
      onDemandBaseCapacity: 0
      onDemandPercentageAboveBaseCapacity: 0
      spotAllocationStrategy: capacity-optimized
    minSize: 10
    maxSize: 100
    desiredCapacity: 20
    labels:
      node-type: spot
```

**Graceful Spot Termination**:

```go
// Listen for spot instance termination notice
func HandleSpotTermination() {
    ticker := time.NewTicker(5 * time.Second)
    defer ticker.Stop()

    for range ticker.C {
        resp, _ := http.Get("http://169.254.169.254/latest/meta-data/spot/termination-time")
        if resp.StatusCode == 200 {
            log.Warn("Spot instance terminating in 2 minutes")

            // Drain node
            drainNode()

            // Wait for graceful shutdown
            time.Sleep(110 * time.Second)
            os.Exit(0)
        }
    }
}
```

### 9.3 Storage Optimization

**Tiered Storage**:

```
Hot Data (< 7 days):
  - SSD (gp3, io2)
  - High IOPS, low latency
  - Cost: $$$

Warm Data (7-90 days):
  - Standard SSD (gp2)
  - Medium IOPS
  - Cost: $$

Cold Data (> 90 days):
  - HDD (st1) or S3 Glacier
  - Archival, rare access
  - Cost: $
```

## Scalability Summary

### Key Scaling Patterns

1. **Horizontal Scaling**: All services scale out, not up
2. **Partitioning**: Data partitioned by key (validator ID, block height, address)
3. **Replication**: Databases replicated for read scaling
4. **Caching**: Multi-tier caching reduces database load by 80%+
5. **Async Processing**: Event-driven decouples services
6. **Load Balancing**: Intelligent distribution across instances
7. **Auto-Scaling**: Dynamic resource allocation based on metrics

### Scaling Limits

| Component            | Current | 6-Month | 12-Month | Theoretical Max |
| -------------------- | ------- | ------- | -------- | --------------- |
| Services (pods)      | 50      | 500     | 1000     | 10,000          |
| Database Connections | 1,000   | 5,000   | 10,000   | 50,000          |
| Redis Shards         | 6       | 16      | 32       | 1000            |
| Kafka Partitions     | 64      | 256     | 512      | 10,000          |
| Requests/sec         | 50k     | 250k    | 500k     | 5M              |

---

**Version**: 1.0
**Last Updated**: 2025-10-17
**Author**: BIZRA Architecture Team
**Status**: Draft for Review
