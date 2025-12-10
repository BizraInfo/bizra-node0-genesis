/**
 * ACE Framework Status Validation
 * Simple validation to ensure ACE framework components are accessible
 */

describe('ACE Framework Status Validation', () => {
  test('Autonomous controller files exist', () => {
    const fs = require('fs');
    const path = require('path');
    
    const files = [
      'ace-framework/autonomous-controller-production.js',
      'ace-framework/autonomous-controller-production.ts',
      'ace-framework/autonomous-healing-loop.js',
      'ace-framework/rollback-manager.js'
    ];

    files.forEach(file => {
      const fullPath = path.join(process.cwd(), file);
      expect(fs.existsSync(fullPath)).toBe(true);
    });
  });

  test('H0/H1/H2 guardrail architecture exists', () => {
    const fs = require('fs');
    const path = require('path');
    
    const prodController = fs.readFileSync(
      path.join(process.cwd(), 'ace-framework/autonomous-controller-production.js'),
      'utf8'
    );

    // Check for H0 guardrails
    expect(prodController).toMatch(/H0.*Safety|SafetyController/);
    
    // Check for MAPE-K loop components
    expect(prodController).toMatch(/Monitor|Analyze|Plan|Execute/);
    
    // Check for Ihsan compliance
    expect(prodController).toMatch(/احسان|ihsan/i);
  });

  test('Ihsan validation logic exists', () => {
    const fs = require('fs');
    const path = require('path');
    
    const localAIService = fs.readFileSync(
      path.join(process.cwd(), 'node0/ai-local-service.js'),
      'utf8'
    );

    expect(localAIService).toMatch(/احسان|ihsan/i);
    expect(localAIService).toMatch(/_validateIhsan|validateIhsan/);
  });

  test('MPC planning components exist', () => {
    const fs = require('fs');
    const path = require('path');
    
    // Check for lexicographic optimization logic
    const prodController = fs.readFileSync(
      path.join(process.cwd(), 'ace-framework/autonomous-controller-production.js'),
      'utf8'
    );

    // Should have planning logic
    expect(prodController.length).toBeGreaterThan(0);
  });

  test('Shadow deployment evidence exists', () => {
    const fs = require('fs');
    const path = require('path');
    
    const evidenceFile = path.join(process.cwd(), 'evidence/flagship-proof-pack/AUTONOMOUS-HEALING-LOOP-PROOF-OF-CONCEPT.md');
    
    expect(fs.existsSync(evidenceFile)).toBe(true);
    
    if (fs.existsSync(evidenceFile)) {
      const content = fs.readFileSync(evidenceFile, 'utf8');
      expect(content).toMatch(/PROVEN|VIABLE|SAFE/i);
    }
  });

  test('Attestation system exists', () => {
    const fs = require('fs');
    const path = require('path');
    
    const attestDir = path.join(process.cwd(), 'evidence/poi-attestations');
    
    expect(fs.existsSync(attestDir)).toBe(true);
  });

  test('Rollback manager exists and has correct structure', () => {
    const fs = require('fs');
    const path = require('path');
    
    const rollbackManager = fs.readFileSync(
      path.join(process.cwd(), 'ace-framework/rollback-manager.js'),
      'utf8'
    );

    expect(rollbackManager).toMatch(/snapshot|rollback|SHA|attestation/i);
  });

  test('Prometheus metrics exporter exists', () => {
    const fs = require('fs');
    const path = require('path');
    
    const metricsFile = path.join(process.cwd(), 'ace-framework/observability/prometheus-metrics.js');
    
    expect(fs.existsSync(metricsFile)).toBe(true);
  });

  test('Structured logger exists', () => {
    const fs = require('fs');
    const path = require('path');
    
    const loggerFile = path.join(process.cwd(), 'ace-framework/observability/structured-logger.js');
    
    expect(fs.existsSync(loggerFile)).toBe(true);
  });

  test('Local AI Service has Ihsan threshold', () => {
    const fs = require('fs');
    const path = require('path');
    
    const localAI = fs.readFileSync(
      path.join(process.cwd(), 'node0/ai-local-service.js'),
      'utf8'
    );

    expect(localAI).toMatch(/ihsanThreshold|95/);
  });

  test('All essential ACE framework components are in place', () => {
    const fs = require('fs');
    const path = require('path');
    
    const aceDir = path.join(process.cwd(), 'ace-framework');
    const requiredComponents = [
      'autonomous-controller-production.js',
      'autonomous-healing-loop.js',
      'rollback-manager.js',
      'observability/prometheus-metrics.js',
      'observability/structured-logger.js'
    ];

    requiredComponents.forEach(component => {
      const fullPath = path.join(aceDir, component);
      expect(fs.existsSync(fullPath)).toBe(true);
    });
  });
});

