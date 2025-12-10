# BIZRA Prompt Engineering Policy

> **Status:** ACTIVE
> **Governance:** SAPE v1.∞

---

## 1. The Golden Rule
**SAPE v1.∞ is the ONLY allowed meta-prompt frame for:**
1.  High-stakes decisions (Financial, Governance, Security).
2.  System-level reasoning (Architecture changes, Consensus upgrades).
3.  Ethical arbitration (Ihsān violations).

---

## 2. Prompt Categories

### Type A: Operational (Vanilla)
*   **Use Case:** Simple data retrieval, formatting, translation.
*   **Allowed:** Direct instruction prompts.
*   **Logging:** Standard debug logs.

### Type B: Cognitive (GoT-Backed)
*   **Use Case:** Complex analysis, code generation, diagnosis.
*   **Required:** Must use `GoTService` (Graph-of-Thoughts).
*   **Logging:** Must log SNR score and Verdict.

### Type C: Sovereign (SAPE-Driven)
*   **Use Case:** Governance, Policy, "Constitutional" judgments.
*   **Required:** Must use full SAPE v1.∞ pipeline (Diverge -> Converge -> Prove).
*   **Logging:** Full Artifact generation, hashed and stored.

---

## 3. Evidence & Logging
*   Every Type C interaction must produce a **SAPE Artifact**.
*   This artifact serves as the "Proof of Thought" (PoT).
*   PoT must be linked to the resulting action/decision in the audit log.

---

## 4. Escalation Protocol
If a Type A or B prompt yields low SNR (< 7.0) or high uncertainty:
1.  **Escalate** to Type C (SAPE).
2.  **Re-run** with full "Lenses" and "Tension Studio".
3.  **Record** the delta between the initial failure and the SAPE success.
