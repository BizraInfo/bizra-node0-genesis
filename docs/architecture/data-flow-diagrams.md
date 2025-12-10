# BIZRA Node-0 - Data Flow Diagrams and Integration Patterns

## Overview

This document illustrates the data flow, message patterns, and integration strategies for the BIZRA Node-0 Genesis Validation System. It covers synchronous and asynchronous communication patterns, event-driven workflows, and CQRS data flows.

## 1. High-Level Data Flow Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                      External Request Flow                        │
└──────────────────────────────────────────────────────────────────┘

Client Request
     │
     ▼
┌─────────────────────┐
│   API Gateway       │  (1) Authentication, Rate Limiting, Routing
│   (Kong/Traefik)    │
└──────────┬──────────┘
           │
           │ (2) Authenticated Request
           │
     ┌─────┴─────┬──────────┬──────────┬──────────┐
     │           │          │          │          │
     ▼           ▼          ▼          ▼          ▼
┌─────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
│Validator│ │ Block  │ │Consensus│ │  Txn   │ │Network │
│ Service │ │Service │ │ Service │ │Service │ │Service │
└────┬────┘ └───┬────┘ └────┬───┘ └───┬────┘ └───┬────┘
     │          │           │          │          │
     │ (3) Synchronous Response                   │
     │          │           │          │          │
     └──────────┴───────────┴──────────┴──────────┘
                            │
                            │ (4) Async Events
                            │
                ┌───────────▼───────────┐
                │    Event Bus          │
                │    (Apache Kafka)     │
                └───────────┬───────────┘
                            │
         ┌──────────────────┼──────────────────┐
         │                  │                  │
         ▼                  ▼                  ▼
    ┌─────────┐       ┌──────────┐      ┌──────────┐
    │Monitoring│      │Blockchain│      │Event Store│
    │ Service  │      │ Service  │      │  Service  │
    └─────────┘       └──────────┘      └──────────┘
```

## 2. Transaction Submission Flow

### 2.1 End-to-End Transaction Processing

```
┌─────────┐                                         ┌──────────────┐
│  Client │                                         │ Transaction  │
│   App   │                                         │   Service    │
└────┬────┘                                         └──────┬───────┘
     │                                                     │
     │ (1) POST /api/v2/transactions                      │
     │     { from, to, amount, signature }                │
     ├────────────────────────────────────────────────────►
     │                                                     │
     │                   (2) Validate Transaction          │
     │                       - Signature verification      │
     │                       - Nonce check                 │
     │                       - Balance check               │
     │                       ┌─────────────┐              │
     │                       │  PostgreSQL  │◄─────────────┤
     │                       │  (tx table)  │              │
     │                       └─────────────┘              │
     │                                                     │
     │                   (3) Add to Mempool                │
     │                       ┌─────────────┐              │
     │                       │    Redis     │◄─────────────┤
     │                       │  (mempool)   │              │
     │                       └─────────────┘              │
     │                                                     │
     │ (4) Response: { txHash, status: "pending" }        │
     │◄────────────────────────────────────────────────────┤
     │                                                     │
     │                   (5) Publish Event                 │
     │                       ┌─────────────┐              │
     │                       │    Kafka     │◄─────────────┤
     │                       │ (tx.events)  │              │
     │                       └──────┬──────┘              │
     │                              │                      │
     │                              │ (6) Event: TransactionSubmitted
     │                              │                      │
     │                              ▼                      │
     │                       ┌─────────────┐              │
     │                       │   Block     │              │
     │                       │   Service   │              │
     │                       └──────┬──────┘              │
     │                              │                      │
     │                   (7) Fetch Pending Transactions    │
     │                              │                      │
     │                              ├─────────────────────►│
     │                              │                      │
     │                              │ (8) Return txs       │
     │                              │◄─────────────────────┤
     │                              │                      │
     │                   (9) Create Block                  │
     │                       ┌─────────────┐              │
     │                       │  PostgreSQL  │              │
     │                       │ (blocks)     │◄─────┐       │
     │                       └─────────────┘      │       │
     │                              │              │       │
     │                   (10) Publish Event        │       │
     │                       ┌─────────────┐      │       │
     │                       │    Kafka     │◄─────┘       │
     │                       │(block.events)│              │
     │                       └──────┬──────┘              │
     │                              │                      │
     │                              │ (11) Event: BlockCreated
     │                              │                      │
     │                              ▼                      │
     │                       ┌─────────────┐              │
     │                       │  Validator  │              │
     │                       │   Service   │              │
     │                       └──────┬──────┘              │
     │                              │                      │
     │                   (12) Validate Block               │
     │                              │                      │
     │                              │ (13) Event: BlockValidated
     │                              │                      │
     │                              ▼                      │
     │                       ┌─────────────┐              │
     │                       │  Consensus  │              │
     │                       │   Service   │              │
     │                       └──────┬──────┘              │
     │                              │                      │
     │                   (14) Aggregate Votes              │
     │                              │                      │
     │                              │ (15) Event: ConsensusReached
     │                              │                      │
     │                              ▼                      │
     │                       ┌─────────────┐              │
     │                       │ Blockchain  │              │
     │                       │   Service   │              │
     │                       └──────┬──────┘              │
     │                              │                      │
     │                   (16) Finalize Block               │
     │                              │                      │
     │                              │ (17) Event: BlockFinalized
     │                              │                      │
     │                              ▼                      │
     │                       ┌─────────────┐              │
     │                       │    Kafka     │              │
     │                       │(block.events)│              │
     │                       └──────┬──────┘              │
     │                              │                      │
     │                   (18) Update Transaction Status    │
     │                              │                      │
     │                              ├─────────────────────►│
     │                              │                      │
     │                       ┌─────────────┐              │
     │                       │  PostgreSQL  │◄─────────────┤
     │                       │(tx_receipts) │              │
     │                       └─────────────┘              │
     │                                                     │
     │ (19) WebSocket Update:                              │
     │      { txHash, status: "finalized", blockHash }     │
     │◄────────────────────────────────────────────────────┤
     │                                                     │
```

### 2.2 Transaction Data Flow Metrics

| Stage          | Latency Target | Throughput     | Consistency   |
| -------------- | -------------- | -------------- | ------------- |
| Submission     | < 50ms         | 5,000 tx/s     | Strong (ACID) |
| Validation     | < 100ms        | 3,000 tx/s     | Strong        |
| Mempool        | < 10ms         | 10,000 tx/s    | Eventual      |
| Block Creation | < 2s           | Batch 2,000 tx | Eventual      |
| Consensus      | < 6s           | N/A            | Strong (BFT)  |
| Finalization   | < 8s total     | N/A            | Strong        |

## 3. Block Validation and Consensus Flow

### 3.1 Consensus Protocol Data Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                 Consensus Round Lifecycle                         │
└──────────────────────────────────────────────────────────────────┘

Time: T0                      T1                 T2                T3
│                             │                  │                 │
│ (1) Start Round             │                  │                 │
│                             │                  │                 │
▼                             │                  │                 │
┌─────────────────┐           │                  │                 │
│ Consensus       │           │                  │                 │
│ Service         │           │                  │                 │
└────────┬────────┘           │                  │                 │
         │                    │                  │                 │
         │ (2) Query Validator Set              │                 │
         │                    │                  │                 │
         ▼                    │                  │                 │
┌─────────────────┐           │                  │                 │
│ Validator       │           │                  │                 │
│ Service         │           │                  │                 │
└────────┬────────┘           │                  │                 │
         │                    │                  │                 │
         │ (3) Return Active Validators          │                 │
         │        (weighted by stake)            │                 │
         │                    │                  │                 │
         ▼                    │                  │                 │
┌─────────────────┐           │                  │                 │
│ Consensus       │           │                  │                 │
│ Service         │           │                  │                 │
└────────┬────────┘           │                  │                 │
         │                    │                  │                 │
         │ (4) Select Leader (deterministic)     │                 │
         │                    │                  │                 │
         ▼                    ▼                  │                 │
┌─────────────────┐    ┌─────────────────┐      │                 │
│ Leader Node     │    │  Network        │      │                 │
│ (Validator)     │    │  Service        │      │                 │
└────────┬────────┘    └────────┬────────┘      │                 │
         │                      │                │                 │
         │ (5) Request Block    │                │                 │
         │                      │                │                 │
         ▼                      │                │                 │
┌─────────────────┐             │                │                 │
│ Block Service   │             │                │                 │
└────────┬────────┘             │                │                 │
         │                      │                │                 │
         │ (6) Create Block     │                │                 │
         │                      │                │                 │
         ▼                      │                │                 │
┌─────────────────┐             │                │                 │
│ Block Proposal  │             │                │                 │
│ { height: N,    │             │                │                 │
│   txs: [...]    │             │                │                 │
│   prevHash }    │             │                │                 │
└────────┬────────┘             │                │                 │
         │                      │                │                 │
         │ (7) Sign Proposal    │                │                 │
         │                      │                │                 │
         ▼                      │                │                 │
┌─────────────────┐             │                │                 │
│ Signed Proposal │             │                │                 │
└────────┬────────┘             │                │                 │
         │                      │                │                 │
         │ (8) Broadcast via Gossip              │                 │
         │                      │                │                 │
         └─────────────────────►│                │                 │
                                │                │                 │
                                │ (9) Gossip to All Validators     │
                                │                ▼                 │
                                │         ┌─────────────────┐      │
                                │         │ All Validators  │      │
                                │         │  (50-500 nodes) │      │
                                │         └────────┬────────┘      │
                                │                  │                │
                                │                  │ (10) Validate Proposal
                                │                  │                │
                                │                  ▼                │
                                │         ┌─────────────────┐      │
                                │         │ Block Service   │      │
                                │         └────────┬────────┘      │
                                │                  │                │
                                │                  │ (11) Valid?   │
                                │                  │                │
                                │                  ▼                ▼
                                │         ┌─────────────────┐
                                │         │ Prevote         │
                                │         │ { blockHash,    │
                                │         │   voterID,      │
                                │         │   signature }   │
                                │         └────────┬────────┘
                                │                  │
                                │                  │ (12) Broadcast Vote
                                │                  │
                                │◄─────────────────┘
                                │
                                │ (13) Collect Votes (via gossip)
                                │                                   ▼
                                ▼                         ┌─────────────────┐
                       ┌─────────────────┐               │ Consensus       │
                       │ Consensus       │               │ Service         │
                       │ Service         │               └────────┬────────┘
                       └────────┬────────┘                        │
                                │                                  │
                                │ (14) Aggregate Votes             │
                                │      Calculate Voting Power      │
                                │                                  │
                                ▼                                  │
                       ┌─────────────────┐                        │
                       │ Quorum Check:   │                        │
                       │ votingPower >=  │                        │
                       │ 2/3 totalStake? │                        │
                       └────────┬────────┘                        │
                                │                                  │
                                │ YES                              │
                                │                                  │
                                ▼                                  │
                       ┌─────────────────┐                        │
                       │ Precommit Phase │                        │
                       │ (same process)  │                        │
                       └────────┬────────┘                        │
                                │                                  │
                                │ (15) Quorum on Precommit         │
                                │                                  │
                                ▼                                  ▼
                       ┌─────────────────┐              ┌─────────────────┐
                       │ Finality        │              │  Event: Kafka   │
                       │ Achieved        │─────────────►│ ConsensusReached│
                       └────────┬────────┘              └─────────────────┘
                                │
                                │ (16) Update Blockchain
                                │
                                ▼
                       ┌─────────────────┐
                       │ Blockchain      │
                       │ Service         │
                       └────────┬────────┘
                                │
                                │ (17) Apply Block
                                │      Update State Root
                                │
                                ▼
                       ┌─────────────────┐
                       │ Block Finalized │
                       │ Height: N       │
                       │ StateRoot: 0x.. │
                       └─────────────────┘
```

### 3.2 Consensus Timing Diagram

```
Round Start        Leader Proposal    Prevote    Precommit    Finalize
    │                    │               │           │           │
    │◄─────────────────► │               │           │           │
    │    1s              │               │           │           │
    │                    │◄────────────► │           │           │
    │                    │     2s        │           │           │
    │                    │               │◄────────► │           │
    │                    │               │    2s     │           │
    │                    │               │           │◄────────► │
    │                    │               │           │    1s     │
    │                                                             │
    │◄──────────────────────────────────────────────────────────►│
                           Total: ~6 seconds
```

## 4. CQRS Data Flow Patterns

### 4.1 Command Side (Write Model)

```
┌─────────────────────────────────────────────────────────────────┐
│                    Command Processing Flow                       │
└─────────────────────────────────────────────────────────────────┘

Client
  │
  │ (1) POST /api/v2/validators/register
  │     Command: RegisterValidator
  │
  ▼
┌──────────────────┐
│  API Gateway     │
│  (Auth/Validate) │
└────────┬─────────┘
         │
         │ (2) Route to Command Handler
         │
         ▼
┌──────────────────┐
│ Command Handler  │
│ (Validator Svc)  │
└────────┬─────────┘
         │
         │ (3) Load Aggregate
         │     (if exists)
         │
         ▼
┌──────────────────┐
│  Write Database  │
│   (PostgreSQL)   │
│  validators table│
└────────┬─────────┘
         │
         │ (4) Return Aggregate or New
         │
         ▼
┌──────────────────┐
│ Validator        │
│ Aggregate        │
│ (Domain Model)   │
└────────┬─────────┘
         │
         │ (5) Execute Business Logic
         │     validator.register(...)
         │     - Validate stake amount
         │     - Check uniqueness
         │     - Apply domain rules
         │
         ▼
┌──────────────────┐
│ Domain Events    │
│ Generated        │
│ - ValidatorRegistered
│ - StakeDeposited │
└────────┬─────────┘
         │
         │ (6) Persist Aggregate State
         │
         ▼
┌──────────────────┐
│  Write Database  │
│   (PostgreSQL)   │
│ BEGIN TRANSACTION│
│  UPDATE validators
│  INSERT events   │
│ COMMIT           │
└────────┬─────────┘
         │
         │ (7) Publish Domain Events
         │
         ▼
┌──────────────────┐
│   Event Bus      │
│   (Kafka Topic:  │
│  validator.events)│
└────────┬─────────┘
         │
         │ (8) Response
         │
         ▼
┌──────────────────┐
│  201 Created     │
│  { validatorID,  │
│    status }      │
└──────────────────┘
```

### 4.2 Query Side (Read Model)

```
┌─────────────────────────────────────────────────────────────────┐
│                    Query Processing Flow                         │
└─────────────────────────────────────────────────────────────────┘

Client
  │
  │ (1) GET /api/v2/validators/active
  │     Query: GetActiveValidators
  │
  ▼
┌──────────────────┐
│  API Gateway     │
└────────┬─────────┘
         │
         │ (2) Route to Query Handler
         │
         ▼
┌──────────────────┐
│ Query Handler    │
│ (Validator Svc)  │
└────────┬─────────┘
         │
         │ (3) Query Read Model
         │     (Optimized for reads)
         │
         ▼
┌──────────────────┐      ┌──────────────────┐
│  Read Database   │  OR  │   Redis Cache    │
│  (PostgreSQL)    │      │  (Denormalized)  │
│ active_validators│      │ key: active_vals │
│  (Materialized   │      │ TTL: 60s         │
│   View)          │      └──────────────────┘
└────────┬─────────┘
         │
         │ (4) Return Denormalized Data
         │     (No joins, pre-computed)
         │
         ▼
┌──────────────────┐
│  200 OK          │
│  [ {id, name,    │
│     stake, rank} │
│     ... ]        │
└──────────────────┘


Parallel: Event-Driven Read Model Updates
═══════════════════════════════════════════

┌──────────────────┐
│   Event Bus      │
│  (Kafka Topic:   │
│ validator.events)│
└────────┬─────────┘
         │
         │ (A) Subscribe to Events
         │
         ▼
┌──────────────────┐
│ Event Handler    │
│ (Read Model      │
│  Projector)      │
└────────┬─────────┘
         │
         │ (B) On ValidatorRegistered:
         │     - Insert into active_validators
         │     - Update leaderboard
         │     - Invalidate cache
         │
         ▼
┌──────────────────┐      ┌──────────────────┐
│  Read Database   │      │   Redis Cache    │
│  UPDATE active_  │      │   DEL active_vals│
│  validators      │      └──────────────────┘
└──────────────────┘
```

### 4.3 CQRS Read Model Projections

```
┌─────────────────────────────────────────────────────────────────┐
│              Event-Driven Projection Updates                     │
└─────────────────────────────────────────────────────────────────┘

Event Stream (Kafka)
     │
     ├─────────────────────────────────────────────────────────┐
     │                                                          │
     ▼                                                          ▼
┌──────────────────┐                                  ┌──────────────────┐
│ Projection 1:    │                                  │ Projection 2:    │
│ Active Validators│                                  │ Reputation       │
│ Leaderboard      │                                  │ Rankings         │
└────────┬─────────┘                                  └────────┬─────────┘
         │                                                     │
         │ (1) Consume Events:                                │
         │     - ValidatorRegistered                          │
         │     - ValidatorActivated                           │
         │     - ValidatorDeactivated                         │
         │                                                     │
         ▼                                                     ▼
┌──────────────────┐                                  ┌──────────────────┐
│ PostgreSQL       │                                  │ Redis Sorted Set │
│ CREATE MATERIALIZED VIEW active_validators AS      │ ZADD reputation  │
│ SELECT v.id, v.name, v.stake,                      │  score validatorID│
│        SUM(d.amount) as total_stake                 └──────────────────┘
│ FROM validators v                                            │
│ LEFT JOIN delegations d ON v.id = d.validator_id            │
│ WHERE v.status = 'active'                                    │
│ GROUP BY v.id, v.name, v.stake;                             │
└──────────────────┘                                           │
                                                               │
Event: ReputationScoreChanged ─────────────────────────────────┘
```

## 5. Event-Driven Integration Patterns

### 5.1 Event Sourcing Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                 Event Sourcing Architecture                      │
└─────────────────────────────────────────────────────────────────┘

Command
  │
  ▼
┌──────────────────┐
│ Aggregate        │
│ (In Memory)      │
│                  │
│ load(id):        │
│   events = repo  │
│   .getEvents(id) │
│   replay(events) │
└────────┬─────────┘
         │
         │ (1) Load Events from Event Store
         │
         ▼
┌──────────────────┐
│ Event Store      │
│ (PostgreSQL)     │
│                  │
│ events table:    │
│ - aggregate_id   │
│ - event_type     │
│ - event_data     │
│ - version        │
│ - timestamp      │
└────────┬─────────┘
         │
         │ (2) Return Events [e1, e2, e3, ...]
         │
         ▼
┌──────────────────┐
│ Aggregate        │
│ Replay Events:   │
│                  │
│ state = {}       │
│ for event in events:
│   state = apply(│
│     state, event)│
└────────┬─────────┘
         │
         │ (3) Execute Command
         │     aggregate.processCommand(cmd)
         │
         ▼
┌──────────────────┐
│ New Events       │
│ Generated        │
│ [e4, e5]         │
└────────┬─────────┘
         │
         │ (4) Append to Event Store
         │     (Optimistic Concurrency Check)
         │
         ▼
┌──────────────────┐
│ Event Store      │
│                  │
│ INSERT INTO events
│ VALUES (agg_id,  │
│   'EventType',   │
│   {...},         │
│   version + 1,   │
│   NOW())         │
│ WHERE version =  │
│   expected_version
└────────┬─────────┘
         │
         │ (5) Publish to Event Bus
         │
         ▼
┌──────────────────┐
│ Event Bus        │
│ (Kafka)          │
│                  │
│ Subscribers:     │
│ - Read Models    │
│ - Other Services │
│ - Monitoring     │
└──────────────────┘
```

### 5.2 Event Replay for Recovery

```
Disaster Recovery Scenario
═══════════════════════════

┌──────────────────┐
│ Event Store      │
│ (Source of Truth)│
│                  │
│ All events since │
│ genesis block    │
│ (append-only)    │
└────────┬─────────┘
         │
         │ (1) Initiate Replay
         │
         ▼
┌──────────────────┐
│ Replay Engine    │
│                  │
│ 1. Load events   │
│    in order      │
│ 2. Apply to      │
│    projections   │
│ 3. Rebuild state │
└────────┬─────────┘
         │
         │ (2) Parallel Projection Rebuild
         │
    ┌────┴────┬────────────┬────────────┐
    │         │            │            │
    ▼         ▼            ▼            ▼
┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
│Read    │ │Read    │ │Read    │ │Read    │
│Model 1 │ │Model 2 │ │Model 3 │ │Model N │
└────────┘ └────────┘ └────────┘ └────────┘

Result: Full system state reconstructed from events
```

### 5.3 Saga Pattern for Distributed Transactions

```
┌─────────────────────────────────────────────────────────────────┐
│            Saga: Validator Registration with Stake               │
└─────────────────────────────────────────────────────────────────┘

Orchestrator: Validator Registration Saga
═══════════════════════════════════════════

Step 1: Reserve Stake
  │
  │ (1) Command: ReserveStake
  │
  ▼
┌──────────────────┐
│ Transaction      │
│ Service          │
│                  │
│ Success: Stake   │
│ Reserved         │
└────────┬─────────┘
         │
         │ (2) Event: StakeReserved
         │
         ▼
Orchestrator
         │
Step 2: Register Validator
         │
         │ (3) Command: RegisterValidator
         │
         ▼
┌──────────────────┐
│ Validator        │
│ Service          │
│                  │
│ Success: Validator
│ Registered       │
└────────┬─────────┘
         │
         │ (4) Event: ValidatorRegistered
         │
         ▼
Orchestrator
         │
Step 3: Activate Validator
         │
         │ (5) Command: ActivateValidator
         │
         ▼
┌──────────────────┐
│ Consensus        │
│ Service          │
│                  │
│ Success: Added to│
│ Validator Set    │
└────────┬─────────┘
         │
         │ (6) Event: ValidatorActivated
         │
         ▼
┌──────────────────┐
│ Saga Completed   │
└──────────────────┘


Failure Scenario: Compensating Transactions
═══════════════════════════════════════════

Step 2 Fails (e.g., duplicate validator ID)
         │
         ▼
Orchestrator
         │
         │ (C1) Compensating Action: ReleaseStake
         │
         ▼
┌──────────────────┐
│ Transaction      │
│ Service          │
│                  │
│ Stake Released   │
└────────┬─────────┘
         │
         │ (C2) Event: StakeReleased
         │
         ▼
┌──────────────────┐
│ Saga Failed      │
│ (Rolled Back)    │
└──────────────────┘
```

## 6. API Gateway Request Routing

```
┌─────────────────────────────────────────────────────────────────┐
│                API Gateway Request Flow                          │
└─────────────────────────────────────────────────────────────────┘

Client Request: GET /api/v2/validators/top?limit=10
                     │
                     ▼
            ┌────────────────┐
            │  API Gateway   │
            │  (Kong/Traefik)│
            └────────┬───────┘
                     │
         ┌───────────┼───────────┐
         │           │           │
         ▼           ▼           ▼
    ┌────────┐ ┌────────┐ ┌────────┐
    │ Auth   │ │ Rate   │ │ Cache  │
    │ Plugin │ │ Limit  │ │ Plugin │
    └───┬────┘ └───┬────┘ └───┬────┘
        │          │          │
        │ JWT      │ Check    │ Check
        │ Valid?   │ Quota    │ Cache
        │          │          │
        │ YES      │ OK       │ MISS
        │          │          │
        └──────────┴──────────┘
                     │
                     │ (Route Resolution)
                     │
                     ▼
            ┌────────────────┐
            │ Service        │
            │ Discovery      │
            │ (Consul)       │
            └────────┬───────┘
                     │
                     │ (Healthy Instances)
                     │
                     ▼
            ┌────────────────┐
            │ Load Balancer  │
            │ (Round Robin)  │
            └────────┬───────┘
                     │
         ┌───────────┼───────────┐
         │           │           │
         ▼           ▼           ▼
    ┌────────┐ ┌────────┐ ┌────────┐
    │Validator│Validator│Validator│
    │Service │Service │Service │
    │Pod 1   │Pod 2   │Pod 3   │
    └───┬────┘ └────────┘ └────────┘
        │
        │ (Selected)
        │
        ▼
┌────────────────┐
│ Response:      │
│ 200 OK         │
│ [validator list]│
│ X-Cache: MISS  │
│ X-RateLimit: 99│
└────────────────┘
```

## 7. Service Mesh Communication

```
┌─────────────────────────────────────────────────────────────────┐
│            Service Mesh (Istio) Request Flow                     │
└─────────────────────────────────────────────────────────────────┘

Service A                          Service B
┌──────────────┐                  ┌──────────────┐
│  Container   │                  │  Container   │
│  (App Code)  │                  │  (App Code)  │
└──────┬───────┘                  └──────┬───────┘
       │                                 ▲
       │ (1) HTTP Call                   │
       │     service-b:8080/api          │
       │                                 │
       ▼                                 │
┌──────────────┐                  ┌──────────────┐
│ Envoy Sidecar│                  │ Envoy Sidecar│
│  Proxy       │                  │  Proxy       │
└──────┬───────┘                  └──────┬───────┘
       │                                 ▲
       │ (2) Intercept                   │
       │     Apply Policies:             │
       │     - mTLS encryption           │
       │     - Circuit Breaking          │
       │     - Retry Logic               │
       │     - Timeout (3s)              │
       │                                 │
       │ (3) Service Discovery           │
       │     Query: service-b endpoints  │
       │                                 │
       ▼                                 │
┌──────────────┐                        │
│ Istio Pilot  │                        │
│ (Control     │                        │
│  Plane)      │                        │
└──────┬───────┘                        │
       │                                 │
       │ (4) Return Endpoints            │
       │     [pod-1, pod-2, pod-3]       │
       │                                 │
       └─────────────────────────────────┘
                                         │
       (5) Forward with mTLS             │
       ──────────────────────────────────┘

Telemetry Flow (Parallel):
═══════════════════════════

Envoy Sidecar
     │
     │ (T1) Send Traces
     │
     ▼
┌──────────────┐
│ Jaeger       │
│ (Tracing)    │
└──────────────┘

     │ (T2) Send Metrics
     │
     ▼
┌──────────────┐
│ Prometheus   │
│ (Metrics)    │
└──────────────┘

     │ (T3) Send Logs
     │
     ▼
┌──────────────┐
│ FluentD      │
│ (Logging)    │
└──────────────┘
```

## 8. Data Replication Flow

```
┌─────────────────────────────────────────────────────────────────┐
│          Database Replication (PostgreSQL Streaming)            │
└─────────────────────────────────────────────────────────────────┘

Write Request
     │
     ▼
┌──────────────┐
│  Primary DB  │
│  (Master)    │
│              │
│ - Write WAL  │
│ - Commit     │
└──────┬───────┘
       │
       │ (1) WAL Streaming
       │     (Synchronous or Async)
       │
   ┌───┴────┬────────┬────────┐
   │        │        │        │
   ▼        ▼        ▼        ▼
┌────────┐┌────────┐┌────────┐┌────────┐
│Replica ││Replica ││Replica ││Replica │
│  1     ││  2     ││  3     ││  4     │
│(Read)  ││(Read)  ││(Read)  ││(Backup)│
└────────┘└────────┘└────────┘└────────┘

Replication Lag Monitoring:
═══════════════════════════

┌──────────────┐
│ Monitoring   │
│ Service      │
│              │
│ Query:       │
│ pg_stat_     │
│ replication  │
└──────┬───────┘
       │
       │ (Alert if lag > 1s)
       │
       ▼
┌──────────────┐
│ Alertmanager │
└──────────────┘
```

## 9. Cache Invalidation Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                Cache Invalidation Pattern                        │
└─────────────────────────────────────────────────────────────────┘

Write Operation (Command)
     │
     ▼
┌──────────────┐
│ Validator    │
│ Service      │
│              │
│ UPDATE       │
│ validator    │
│ SET stake=...│
└──────┬───────┘
       │
       │ (1) Commit to DB
       │
       ▼
┌──────────────┐
│ PostgreSQL   │
└──────┬───────┘
       │
       │ (2) Publish Event
       │
       ▼
┌──────────────┐
│ Event Bus    │
│ (Kafka)      │
└──────┬───────┘
       │
       │ (3) Event: ValidatorUpdated
       │
   ┌───┴────┬────────────┐
   │        │            │
   ▼        ▼            ▼
┌────────┐┌────────┐┌────────┐
│Read    ││Cache   ││Other   │
│Model   ││Invalidation│Services│
│Updater ││Service ││        │
└────────┘└───┬────┘└────────┘
              │
              │ (4) Invalidate Keys
              │
              ▼
         ┌──────────────┐
         │ Redis        │
         │              │
         │ DEL validator:123
         │ DEL active_validators
         │ DEL leaderboard
         └──────────────┘

Next Read Request:
═══════════════════

Client → API Gateway → Validator Service
                           │
                           │ (5) Cache Miss
                           │
                           ▼
                      ┌──────────────┐
                      │ Redis        │
                      │ (MISS)       │
                      └──────────────┘
                           │
                           │ (6) Query DB
                           │
                           ▼
                      ┌──────────────┐
                      │ PostgreSQL   │
                      │ (Read Replica)│
                      └──────┬───────┘
                             │
                             │ (7) Return Data
                             │
                             ▼
                      ┌──────────────┐
                      │ Cache Result │
                      │ SET validator:123
                      │ TTL: 300s    │
                      └──────────────┘
```

## 10. Monitoring and Observability Flow

```
┌─────────────────────────────────────────────────────────────────┐
│              Observability Data Flow                             │
└─────────────────────────────────────────────────────────────────┘

All Services (Instrumented)
     │
     ├─────────────┬─────────────┬─────────────┐
     │             │             │             │
     │ Metrics     │ Logs        │ Traces      │
     │             │             │             │
     ▼             ▼             ▼
┌──────────┐ ┌──────────┐ ┌──────────┐
│Prometheus│ │ FluentD  │ │  Jaeger  │
│  :9090   │ │  :24224  │ │  :14268  │
└─────┬────┘ └─────┬────┘ └─────┬────┘
      │            │            │
      │            │            │
      │            ▼            │
      │      ┌──────────┐      │
      │      │Elasticsearch     │
      │      │  :9200   │      │
      │      └─────┬────┘      │
      │            │            │
      │            ▼            │
      │      ┌──────────┐      │
      │      │  Kibana  │      │
      │      │  :5601   │      │
      │      └──────────┘      │
      │                        │
      └────────┬───────────────┘
               │
               ▼
         ┌──────────┐
         │ Grafana  │
         │  :3000   │
         │          │
         │ Unified  │
         │ Dashboard│
         └─────┬────┘
               │
               │ (Alerting Rules)
               │
               ▼
         ┌──────────┐
         │Alertmanager
         │  :9093   │
         └─────┬────┘
               │
               │ (Notifications)
               │
       ┌───────┼───────┐
       │       │       │
       ▼       ▼       ▼
   ┌──────┐┌──────┐┌──────┐
   │PagerDuty││Slack ││Email │
   └──────┘└──────┘└──────┘
```

## Data Flow Summary

### Key Patterns Implemented

1. **Event-Driven Architecture**: Loose coupling via message queues
2. **CQRS**: Separated read/write models for performance
3. **Event Sourcing**: Append-only event store as source of truth
4. **Saga Pattern**: Distributed transaction coordination
5. **API Gateway**: Single entry point with cross-cutting concerns
6. **Service Mesh**: Transparent service-to-service communication
7. **Cache-Aside**: Read-through caching with event-driven invalidation
8. **Database per Service**: Data ownership and autonomy
9. **Streaming Replication**: High availability and read scaling
10. **Distributed Tracing**: End-to-end request observability

### Performance Characteristics

| Pattern             | Latency    | Throughput   | Consistency  |
| ------------------- | ---------- | ------------ | ------------ |
| Synchronous API     | 10-100ms   | 1k-10k req/s | Strong       |
| Asynchronous Events | 100-1000ms | 100k+ msg/s  | Eventual     |
| CQRS Reads          | 1-10ms     | 50k+ req/s   | Eventual     |
| CQRS Writes         | 50-200ms   | 5k req/s     | Strong       |
| Cache Hits          | < 1ms      | 100k+ req/s  | Eventual     |
| Consensus           | 4-6s       | 10k tx/s     | Strong (BFT) |

---

**Version**: 1.0
**Last Updated**: 2025-10-17
**Author**: BIZRA Architecture Team
**Status**: Draft for Review
