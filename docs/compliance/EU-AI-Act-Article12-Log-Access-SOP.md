# EU AI Act — Article 12 Record-Keeping & Authority Access (SOP)

**Regulation**: EU 2024/1689 (Artificial Intelligence Act)
**Article**: Article 12 - Record-keeping
**Organization**: BIZRA (بِذْرَة)
**Scope**: High-risk AI functions only
**Effective Date**: October 25, 2025
**Version**: 1.0.0
**Owner**: Data Protection Officer (DPO) + Chief Information Security Officer (CISO)

---

## Purpose

This Standard Operating Procedure (SOP) implements **Article 12 of the EU AI Act** (Regulation 2024/1689), which mandates automatic record-keeping for high-risk AI systems and lawful access by competent authorities.

**Official Journal Reference**: [Regulation (EU) 2024/1689 - EUR-Lex](https://eur-lex.europa.eu/eli/reg/2024/1689/oj/eng)

**Article 12 Navigator**: [euaiact.com - Article 12](https://www.euaiact.com/article/12)

---

## Scope Definition

### What Qualifies as "High-Risk" AI (Article 6)

BIZRA's AI systems are assessed against **Annex I** (high-risk use cases):

- ✅ **Critical infrastructure** - Validation nodes for blockchain PoI
- ✅ **Credit scoring** - Economic balancing algorithms (SAT: economic_balancer)
- ⚠️ **Biometric identification** - NOT applicable (BIZRA does not process biometric data)

**Classification Result**: BIZRA operates **high-risk AI systems** under Article 6(2) and must comply with Article 12.

---

## 1. Automatic Logging (Article 12.1)

### Logged Fields (Mandatory)

Per Article 12.1, logs MUST automatically record:

1. **Timestamps** - ISO 8601 format with timezone
2. **Request/Response Digests** - SHA-256 hashes of prompts and outputs
3. **Model + Version** - Exact model identifier (e.g., `bizra-agentic-v1.2.0`)
4. **Data Source IDs** - Identifiers for data used in decision-making
5. **Rail Verdicts** - NeMo Guardrails decisions:
   - PII detection (block/allow)
   - Jailbreak attempts (block/allow)
   - Topic allowlist (pass/fail)
   - RAG citation requirements (pass/fail)
6. **Operator/Service ID** - Human operator or automated service identifier
7. **PoI Ledger Hash** - Proof of Integrity blockchain anchor for audit trail
8. **Impact Assessment Reference** - Link to applicable impact assessment (Article 27)

### Example Log Entry (JSON)

```json
{
  "timestamp": "2025-10-25T11:40:00.000Z",
  "request_digest": "sha256:a1b2c3d4...",
  "response_digest": "sha256:e5f6g7h8...",
  "model": "bizra-agentic-v1.2.0",
  "model_version_hash": "sha256:i9j0k1l2...",
  "data_sources": ["knowledge/organized/", "hive-mind/collective_memory"],
  "rail_verdicts": {
    "pii_detection": "PASS",
    "jailbreak_block": "PASS",
    "topic_allowlist": "PASS",
    "rag_citation": "PASS"
  },
  "operator_id": "system-agent-consensus_guardian",
  "poi_ledger_hash": "0x1234567890abcdef...",
  "impact_assessment_ref": "IA-2025-001",
  "severity": "high-risk"
}
```

---

## 2. Storage & Integrity (Article 12.2)

### Immutable Append-Only Store

**Technology Stack**:

- **Primary**: OpenTelemetry pipeline → OTLP protocol
- **Storage**: Immutable append-only log (Parquet format)
- **Integrity**: PoI ledger hash chains
- **Backup**: Daily exports with cryptographic manifest

**Configuration**: `ops/otel/otel-collector.yaml`

### Retention Period (Article 12.3)

**Minimum Retention**: 6 years from the date the AI system ceases to be placed on the market

**BIZRA Policy**:

- **High-risk logs**: 10 years (exceeds minimum)
- **Standard logs**: 6 years
- **Blockchain PoI**: Permanent (immutable ledger)

### Data Export Format

**Daily Parquet Export**:

```bash
# Export location
/var/log/bizra/ai-act-logs/YYYY-MM-DD/

# Files
- high-risk-logs-YYYY-MM-DD.parquet
- manifest-YYYY-MM-DD.json
- poi-hashes-YYYY-MM-DD.txt
- export-signature.asc (GPG signed)
```

**Manifest Example**:

```json
{
  "export_date": "2025-10-25",
  "scope": "high-risk AI functions",
  "time_window": "2025-10-24T00:00:00Z to 2025-10-25T00:00:00Z",
  "total_records": 15234,
  "parquet_file": "high-risk-logs-2025-10-25.parquet",
  "parquet_sha256": "sha256:abc123...",
  "poi_anchor_hash": "0xdef456...",
  "system_versions": {
    "bizra-node": "v2.2.0-rc1",
    "ace-framework": "v1.0.0",
    "nemo-guardrails": "v0.5.0"
  },
  "accountable_owner": "ciso@bizra.ai"
}
```

---

## 3. Access by Competent Authority (Article 12.1)

### Legal Basis for Access

Competent authorities may request access to logs under:

- **Article 12.1** - Record-keeping obligations
- **Article 70** - Market surveillance and control
- **Article 71** - Union market surveillance and control

### Access Workflow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Authority Request                                        │
│    - Written request via official channel                   │
│    - Must cite Article + scope + time window                │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. DPO Triage (Within 2 business days)                      │
│    - Verify authority identity                              │
│    - Assess request legitimacy                              │
│    - Log request in compliance register                     │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. Legal Sign-Off (Within 5 business days)                  │
│    - General Counsel reviews request                        │
│    - Confirm GDPR Article 6(1)(c) legal basis               │
│    - Approve export scope and method                        │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. Data Export (Within 10 business days)                    │
│    - Extract logs matching scope + time window              │
│    - Generate Parquet + manifest + PoI hashes               │
│    - GPG encrypt with authority's public key                │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. Secure Delivery (Within 15 business days total)          │
│    - Deliver via secure channel (encrypted email/portal)    │
│    - Include: Parquet file, manifest, hash chain, contact   │
│    - Retain proof of delivery                               │
└─────────────────────────────────────────────────────────────┘
```

### SLA Commitment

**Maximum Response Time**: 15 business days from receipt of valid request

**Expedited Procedure** (upon authority request):

- Critical safety issues: 3 business days
- Ongoing investigation: 7 business days

### Export Contents (Mandatory)

Every export MUST include:

1. **Log Data** - Parquet file with filtered records
2. **Export Manifest** - JSON with metadata (see example above)
3. **Hash Chain** - PoI ledger hashes proving integrity
4. **System Versions** - Exact software versions at log time
5. **Accountable Owner** - Contact for CISO/DPO
6. **Legal Basis** - Citation to AI Act articles authorizing disclosure
7. **Data Protection Notice** - GDPR Article 13/14 information

---

## 4. Access Control & Accountability

### Who Can Retrieve Logs

**Internal Access** (BIZRA personnel):

- Data Protection Officer (DPO) - Full access for compliance
- Chief Information Security Officer (CISO) - Full access for security
- General Counsel - Access for legal requests only
- Designated auditors - Read-only access during audits

**External Access** (Competent Authorities only):

- EU national competent authorities (Article 70)
- European Artificial Intelligence Board (Article 65)
- Market surveillance authorities (per Member State)

**Access Logging**:

- All internal access logged in `docs/compliance/access-log.md`
- All external requests logged in `docs/compliance/authority-requests/`

### Authentication & Authorization

```yaml
# Access control matrix
roles:
  dpo:
    access: full
    mfa: required
    audit_log: yes

  ciso:
    access: full
    mfa: required
    audit_log: yes

  legal:
    access: request-based
    mfa: required
    audit_log: yes
    approval: dpo

  auditor:
    access: read-only
    mfa: required
    audit_log: yes
    time_limited: 30_days
```

---

## 5. Verification & Testing

### Quarterly Drill (Mandatory)

**Procedure**: Simulate Article 12 authority access request end-to-end

**Steps**:

1. Generate mock authority request
2. Execute workflow (triage → legal → export → delivery)
3. Measure SLA compliance (target: <15 business days)
4. Verify export contents (all mandatory fields present)
5. Test hash chain integrity (PoI verification)

**Evidence Location**: `docs/compliance/drills/YYYY-QQ/`

**KPI**: 100% drill success rate (all steps completed within SLA)

### Annual External Audit

**ISO/IEC 42001 + EU AI Act Compliance Audit**:

- Verify log completeness (no gaps in high-risk records)
- Test access workflow (mock authority request)
- Review retention policies (10-year compliance)
- Confirm PoI integrity (hash chain validation)

---

## 6. GDPR Integration (Article 10 AI Act)

### Legal Basis for Processing

**GDPR Article 6(1)(c)**: Legal obligation

- EU AI Act Article 12 mandates record-keeping
- No consent required for compliance logs
- Purpose limitation: AI Act compliance only

**GDPR Article 9** (Special Categories):

- BIZRA does NOT process biometric/health data
- If future systems do, explicit GDPR Article 9(2) basis required

### Data Subject Rights

**Right of Access** (GDPR Article 15):

- Individuals can request their data in AI logs
- Response within 1 month (GDPR timeline)
- Provide copy of logs + manifest + hash chain

**Right to Erasure** (GDPR Article 17):

- **NOT applicable** to AI Act compliance logs (legal obligation)
- Erasure only after retention period (10 years)
- Exception: If data subject not in high-risk scope

---

## 7. Breach Notification

### AI Act Serious Incident (Article 73)

If logs reveal a **serious incident**:

1. Notify national competent authority within 15 days
2. Include: Nature of incident, affected persons, measures taken
3. Provide relevant log excerpts (filtered for privacy)

### GDPR Personal Data Breach (Article 33)

If logs contain personal data breach:

1. Notify supervisory authority within 72 hours
2. Include: Categories of data, approximate number of individuals
3. Provide log evidence of breach detection and containment

---

## 8. Non-Compliance Consequences

### Penalties (Article 99 AI Act)

**Administrative Fines**:

- Up to €35 million or 7% of worldwide annual turnover (whichever higher)
- For infringements of Article 12 record-keeping obligations

**BIZRA's Mitigation**:

- Automated logging (no manual steps = no human error)
- Quarterly drills (prove access workflow works)
- External audits (independent verification)

---

## References

### Primary Sources

1. **EU AI Act (Regulation 2024/1689)**: https://eur-lex.europa.eu/eli/reg/2024/1689/oj/eng
2. **Article 12 Navigator**: https://www.euaiact.com/article/12
3. **Artificial Intelligence Act (euaiact.com)**: https://artificialintelligenceact.eu/article/12/
4. **GDPR**: https://gdpr-info.eu/

### Implementation Guides

5. **NIST AI Risk Management Framework**: https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.600-1.pdf
6. **ISO/IEC 42001:2023**: https://www.iso.org/standard/42001
7. **OpenTelemetry Documentation**: https://opentelemetry.io/docs/

---

## Document Control

| Attribute               | Value                                                                     |
| ----------------------- | ------------------------------------------------------------------------- |
| Document Owner          | Data Protection Officer (DPO) + Chief Information Security Officer (CISO) |
| Approval Authority      | General Counsel + Chief Executive Officer (CEO)                           |
| Review Frequency        | Quarterly (with mandatory drill)                                          |
| Next Review Date        | January 25, 2026                                                          |
| Document Classification | Internal - Legal Compliance                                               |
| External Audit          | Annual (ISO/IEC 42001 + EU AI Act)                                        |

---

## Appendix A: Sample Authority Request Letter

```
[Authority Letterhead]

Date: [Date]
To: Data Protection Officer, BIZRA
From: [Competent Authority Name], [Member State]

Subject: Article 12 Record-Keeping Access Request (EU AI Act Reg. 2024/1689)

Dear DPO,

Pursuant to Article 12.1 of Regulation (EU) 2024/1689 (Artificial Intelligence Act),
we hereby request access to the following records:

Scope: High-risk AI system logs
Time Window: [Start Date] to [End Date]
Specific Systems: [System identifiers if known]
Purpose: [Market surveillance / Investigation / Audit]

Please provide the records in machine-readable format (Parquet preferred) with:
- Export manifest (JSON)
- PoI hash chain
- System versions
- Accountable owner contact

We request delivery within 15 business days to [secure channel].

Contact: [Authority contact name, email, phone]

Sincerely,
[Authority Signature]
```

---

## Appendix B: Internal Access Log Template

```markdown
# Article 12 Log Access Register

| Date       | Accessor   | Role | Purpose         | Scope                   | Duration | Approval      | Notes                  |
| ---------- | ---------- | ---- | --------------- | ----------------------- | -------- | ------------- | ---------------------- |
| 2025-10-25 | John Doe   | DPO  | Quarterly drill | All high-risk logs      | 2 hours  | Self-approved | Q4 drill successful    |
| 2025-10-26 | Jane Smith | CISO | Security audit  | Consensus guardian logs | 1 hour   | DPO approved  | Annual security review |
```

---

**Signed** (Digital Signature):

- DPO: ********\_******** Date: October 25, 2025
- CISO: ********\_******** Date: October 25, 2025
- General Counsel: ********\_******** Date: October 25, 2025
- CEO: ********\_******** Date: October 25, 2025

---

**با احسان (With Excellence)** - BIZRA commits to transparent, auditable AI governance under the EU AI Act.
