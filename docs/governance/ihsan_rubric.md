# Ihsān Scoring Rubric

> **Status:** ACTIVE
> **Threshold:** ≥ 95% (Non-negotiable)

---

## 1. Dimensions of Ihsān (Excellence & Benevolence)

### A. Excellence (Itqan) - 30%
*   **Definition:** Technical perfection, reliability, and craftsmanship.
*   **Observables:**
    *   Code quality (Lint/Test coverage).
    *   Performance (Latency/Throughput).
    *   Uptime / Availability.
    *   SNR of outputs.

### B. Benevolence (Rahmah) - 30%
*   **Definition:** Positive impact, harm reduction, and user-centricity.
*   **Observables:**
    *   User feedback sentiment.
    *   Safety checks (Harm prevention).
    *   Accessibility compliance.
    *   Resource efficiency (Green computing).

### C. Integrity (Amanah) - 20%
*   **Definition:** Trustworthiness, honesty, and security.
*   **Observables:**
    *   Data privacy preservation.
    *   Security audit results.
    *   Transparency of decision making (Explainability).

### D. Justice (Adl) - 20%
*   **Definition:** Fairness, balance, and lack of bias.
*   **Observables:**
    *   Bias detection in AI outputs.
    *   Fair resource allocation (Sharding/QoS).
    *   Equitable access.

---

## 2. Scoring Mechanism

The **Ihsān Score** is a composite metric calculated as:

$$
Score = (0.3 \times Excellence) + (0.3 \times Benevolence) + (0.2 \times Integrity) + (0.2 \times Justice)
$$

### Penalties
*   **Critical Violation:** Immediate score of 0 (e.g., data leak, intentional harm).
*   **Major Violation:** -20 points (e.g., significant bias, prolonged outage).
*   **Minor Violation:** -5 points (e.g., minor bug, confusing UI).

---

## 3. Enforcement
*   **CI/CD:** Builds fail if the automated Ihsān check (based on test metrics) falls below 95%.
*   **Runtime:** System alerts operators if real-time metrics indicate a drift below 95%.
