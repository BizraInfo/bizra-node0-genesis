/**
 * AGENT TEAM MEMORY INTEGRATION TESTS
 *
 * PROFESSIONAL ELITE PRACTITIONER Standard
 * Comprehensive test suite for cross-session memory system
 *
 * Test Coverage:
 * - Session memory service operations
 * - Agent team memory integration (personal, system, dual)
 * - Session hooks (start/end)
 * - احسان compliance validation
 * - Performance benchmarks
 * - Error handling and recovery
 *
 * احسان Standard: Zero assumptions, complete verification
 */

const { getInstance: getSessionMemory } = require('../../.claude-flow/session-memory-service.js');
const { getInstance: getAgentTeamMemory } = require('../../.claude-flow/agent-team-memory-integration.js');
const sessionStartHook = require('../../.claude-flow/hooks/session-start.js');
const sessionEndHook = require('../../.claude-flow/hooks/session-end.js');
const fs = require('fs');
const path = require('path');

describe('Agent Team Memory Integration - PROFESSIONAL ELITE PRACTITIONER', () => {
  let sessionMemory;
  let agentTeamMemory;

  beforeAll(async () => {
    // Initialize services
    sessionMemory = getSessionMemory();
    agentTeamMemory = getAgentTeamMemory();

    await sessionMemory.initialize();
    await agentTeamMemory.initialize();
  });

  afterAll(async () => {
    // Cleanup: End session
    if (sessionMemory.isInitialized) {
      await sessionMemory.endSession();
    }
  });

  describe('Session Memory Service', () => {
    test('should initialize with احسان score 100', async () => {
      const result = await sessionMemory.initialize();

      expect(result.success).toBe(true);
      expect(result.ahsanScore).toBe(100);
      expect(result.sessionId).toBeDefined();
    });

    test('should store agent memory with namespace isolation', async () => {
      const result = await sessionMemory.storeAgentMemory(
        'test-agent-001',
        'test-key',
        { data: 'test-value' },
        { type: 'test', confidence: 1.0 }
      );

      expect(result.success).toBe(true);
      expect(result.ahsanScore).toBe(100);
      expect(result.namespace).toContain('test-agent-001');
    });

    test('should restore agent memory correctly', async () => {
      // Store first
      await sessionMemory.storeAgentMemory(
        'test-agent-002',
        'restore-test',
        { important: 'data' }
      );

      // Restore
      const result = await sessionMemory.restoreAgentMemory(
        'test-agent-002',
        'restore-test'
      );

      expect(result.found).toBe(true);
      expect(result.value.important).toBe('data');
      expect(result.ahsanScore).toBe(100);
    });

    test('should persist session state with correct structure', async () => {
      const result = await sessionMemory.persistSessionState({
        swarms: ['test-swarm-1'],
        agents: ['test-agent-1', 'test-agent-2'],
        tasks: ['test-task-1']
      });

      expect(result.success).toBe(true);
      expect(result.ahsanScore).toBe(100);
      expect(result.sessionId).toBeDefined();
      expect(result.size).toBeGreaterThan(0);
    });

    test('should list sessions with filtering', async () => {
      const result = await sessionMemory.listSessions({
        status: 'active',
        limit: 10
      });

      expect(result.success).toBe(true);
      expect(result.ahsanScore).toBe(100);
      expect(Array.isArray(result.sessions)).toBe(true);
      expect(result.count).toBeGreaterThanOrEqual(0);
    });

    test('should track metrics with احسان compliance', () => {
      const metrics = sessionMemory.getMetrics();

      expect(metrics.ahsanScore).toBeGreaterThanOrEqual(0);
      expect(metrics.ahsanScore).toBeLessThanOrEqual(100);
      expect(metrics.ahsanCompliance).toBeDefined();
      expect(metrics.sessions).toBeGreaterThanOrEqual(0);
      expect(metrics.memories).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Agent Team Memory Integration', () => {
    test('should store personal agent memory with correct namespace', async () => {
      const result = await agentTeamMemory.storePersonalAgentMemory(
        'momo-coordinator',
        'test-preferences',
        { theme: 'dark', احسانThreshold: 95 }
      );

      expect(result.success).toBe(true);
      expect(result.ahsanScore).toBe(100);
      expect(result.team).toBe('personal');
      expect(result.namespace).toBe('personal-team:momo-coordinator');
    });

    test('should restore personal agent memory', async () => {
      // Store first
      await agentTeamMemory.storePersonalAgentMemory(
        'test-personal-agent',
        'learning-patterns',
        { patterns: ['pattern1', 'pattern2'] }
      );

      // Restore
      const result = await agentTeamMemory.restorePersonalAgentMemory(
        'test-personal-agent',
        'learning-patterns'
      );

      expect(result.found).toBe(true);
      expect(result.team).toBe('personal');
      expect(result.value.patterns).toEqual(['pattern1', 'pattern2']);
      expect(result.ahsanScore).toBe(100);
    });

    test('should store system agent memory with correct namespace', async () => {
      const result = await agentTeamMemory.storeSystemAgentMemory(
        'consensus_guardian',
        'coordination-state',
        { activeNodes: 5, trustScores: { node1: 0.98 } }
      );

      expect(result.success).toBe(true);
      expect(result.ahsanScore).toBe(100);
      expect(result.team).toBe('system');
      expect(result.namespace).toBe('system-team:consensus_guardian');
    });

    test('should restore system agent memory', async () => {
      // Store first
      await agentTeamMemory.storeSystemAgentMemory(
        'economic_balancer',
        'metrics',
        { seedSupply: 1000000 }
      );

      // Restore
      const result = await agentTeamMemory.restoreSystemAgentMemory(
        'economic_balancer',
        'metrics'
      );

      expect(result.found).toBe(true);
      expect(result.team).toBe('system');
      expect(result.value.seedSupply).toBe(1000000);
      expect(result.ahsanScore).toBe(100);
    });

    test('should store dual team memory with correct namespace', async () => {
      const result = await agentTeamMemory.storeDualTeamMemory(
        'hierarchical-swarm-001',
        'coordination-patterns',
        { topology: 'hierarchical', maxAgents: 8 }
      );

      expect(result.success).toBe(true);
      expect(result.ahsanScore).toBe(100);
      expect(result.team).toBe('dual');
      expect(result.namespace).toBe('dual-team:hierarchical-swarm-001');
    });

    test('should restore dual team memory', async () => {
      // Store first
      await agentTeamMemory.storeDualTeamMemory(
        'development-team',
        'shared-knowledge',
        { standards: { احسانCompliance: 'required' } }
      );

      // Restore
      const result = await agentTeamMemory.restoreDualTeamMemory(
        'development-team',
        'shared-knowledge'
      );

      expect(result.found).toBe(true);
      expect(result.team).toBe('dual');
      expect(result.value.standards.احسانCompliance).toBe('required');
      expect(result.ahsanScore).toBe(100);
    });

    test('should sync all team memories correctly', async () => {
      // Store some memories first
      await agentTeamMemory.storePersonalAgentMemory('p1', 'k1', { v: 1 });
      await agentTeamMemory.storeSystemAgentMemory('s1', 'k1', { v: 2 });
      await agentTeamMemory.storeDualTeamMemory('d1', 'k1', { v: 3 });

      const result = await agentTeamMemory.syncAllTeamMemories();

      expect(result.success).toBe(true);
      expect(result.ahsanScore).toBe(100);
      expect(result.totalMemories).toBeGreaterThanOrEqual(3);
      expect(result.synced.personal).toBeGreaterThanOrEqual(1);
      expect(result.synced.system).toBeGreaterThanOrEqual(1);
      expect(result.synced.dual).toBeGreaterThanOrEqual(1);
    });

    test('should track team memory metrics', () => {
      const metrics = agentTeamMemory.getMetrics();

      expect(metrics.personalTeams).toBeDefined();
      expect(metrics.systemTeams).toBeDefined();
      expect(metrics.dualTeams).toBeDefined();
      expect(metrics.ahsanScore).toBeGreaterThanOrEqual(0);
      expect(metrics.ahsanScore).toBeLessThanOrEqual(100);
      expect(metrics.ahsanCompliance).toBeDefined();
    });
  });

  describe('Session Hooks', () => {
    test('session start hook should execute without errors', async () => {
      const result = await sessionStartHook();

      expect(result.success).toBe(true);
      expect(result.ahsanScore).toBeGreaterThanOrEqual(0);
      expect(result.latency).toBeDefined();
      expect(result.message).toBeDefined();
    });

    test('session end hook should execute without errors', async () => {
      const result = await sessionEndHook();

      expect(result.success).toBe(true);
      expect(result.ahsanScore).toBeGreaterThanOrEqual(0);
      expect(result.latency).toBeDefined();
      expect(result.message).toBeDefined();
    });

    test('session hooks should maintain احسان compliance', async () => {
      const startResult = await sessionStartHook();
      const endResult = await sessionEndHook();

      // Both hooks should succeed
      expect(startResult.success).toBe(true);
      expect(endResult.success).toBe(true);

      // احسان scores should be tracked
      expect(startResult.ahsanScore).toBeDefined();
      expect(endResult.ahsanScore).toBeDefined();

      // No violations for clean execution
      if (endResult.violations) {
        expect(endResult.violations.length).toBe(0);
      }
    });
  });

  describe('احسان Compliance Validation', () => {
    test('all operations should return احسان scores', async () => {
      const operations = [
        sessionMemory.storeAgentMemory('test', 'key', { v: 1 }),
        sessionMemory.restoreAgentMemory('test', 'key'),
        agentTeamMemory.storePersonalAgentMemory('p', 'k', { v: 1 }),
        agentTeamMemory.restorePersonalAgentMemory('p', 'k'),
        agentTeamMemory.storeSystemAgentMemory('s', 'k', { v: 1 }),
        agentTeamMemory.restoreSystemAgentMemory('s', 'k'),
        agentTeamMemory.storeDualTeamMemory('d', 'k', { v: 1 }),
        agentTeamMemory.restoreDualTeamMemory('d', 'k')
      ];

      const results = await Promise.all(operations);

      results.forEach(result => {
        expect(result.ahsanScore).toBeDefined();
        expect(result.ahsanScore).toBeGreaterThanOrEqual(0);
        expect(result.ahsanScore).toBeLessThanOrEqual(100);
      });
    });

    test('error handling should include احسان violation messages', async () => {
      try {
        // Try to store without required parameters
        await agentTeamMemory.storePersonalAgentMemory(null, null, null);
        fail('Should have thrown احسان violation error');
      } catch (error) {
        expect(error.message).toContain('احسان violation');
      }
    });

    test('احسان scores should average >= 95 for PEAK tier', () => {
      const sessionMetrics = sessionMemory.getMetrics();
      const agentMetrics = agentTeamMemory.getMetrics();

      const avgAhsanScore = (sessionMetrics.ahsanScore + agentMetrics.ahsanScore) / 2;

      // PEAK TIER: احسان >= 95
      expect(avgAhsanScore).toBeGreaterThanOrEqual(95);
    });
  });

  describe('Performance Benchmarks', () => {
    test('store operations should complete within 50ms', async () => {
      const startTime = Date.now();

      await agentTeamMemory.storePersonalAgentMemory(
        'perf-test',
        'benchmark',
        { data: 'performance test' }
      );

      const latency = Date.now() - startTime;

      // PROFESSIONAL ELITE PRACTITIONER: < 50ms target
      expect(latency).toBeLessThan(50);
    });

    test('restore operations should complete within 50ms', async () => {
      // Store first
      await agentTeamMemory.storePersonalAgentMemory(
        'perf-test-2',
        'benchmark',
        { data: 'test' }
      );

      const startTime = Date.now();

      await agentTeamMemory.restorePersonalAgentMemory(
        'perf-test-2',
        'benchmark'
      );

      const latency = Date.now() - startTime;

      expect(latency).toBeLessThan(50);
    });

    test('sync operations should complete within 500ms', async () => {
      const startTime = Date.now();

      await agentTeamMemory.syncAllTeamMemories();

      const latency = Date.now() - startTime;

      // PROFESSIONAL ELITE PRACTITIONER: < 500ms target
      expect(latency).toBeLessThan(500);
    });
  });

  describe('Integration with Existing Systems', () => {
    test('should integrate with Hive-Mind database', () => {
      // Verify Hive-Mind service is accessible
      const hiveMind = sessionMemory.hiveMind;

      expect(hiveMind).toBeDefined();
      expect(hiveMind.isInitialized).toBe(true);
    });

    test('should work with PAT coordinator config', () => {
      const patConfigPath = path.join(__dirname, '../../agents/personal/coordinator-agent-config.json');

      if (fs.existsSync(patConfigPath)) {
        const patConfig = JSON.parse(fs.readFileSync(patConfigPath, 'utf8'));

        expect(patConfig.agent_id).toBeDefined();
        expect(patConfig.coordination_principles).toBeDefined();
        expect(patConfig.event_handling).toBeDefined();
      }
    });
  });
});

describe('PROFESSIONAL ELITE PRACTITIONER Validation', () => {
  test('should meet PEAK tier احسان threshold (>= 95)', async () => {
    const sessionMemory = getSessionMemory();
    const agentTeamMemory = getAgentTeamMemory();

    await sessionMemory.initialize();
    await agentTeamMemory.initialize();

    const sessionMetrics = sessionMemory.getMetrics();
    const agentMetrics = agentTeamMemory.getMetrics();

    expect(sessionMetrics.ahsanScore).toBeGreaterThanOrEqual(95);
    expect(agentMetrics.ahsanScore).toBeGreaterThanOrEqual(95);
  });

  test('should have zero احسان violations in clean execution', async () => {
    const result = await sessionEndHook();

    if (result.violations) {
      expect(result.violations.length).toBe(0);
    }
  });

  test('should maintain احسان compliance across all operations', () => {
    const sessionMemory = getSessionMemory();
    const agentTeamMemory = getAgentTeamMemory();

    const sessionMetrics = sessionMemory.getMetrics();
    const agentMetrics = agentTeamMemory.getMetrics();

    expect(sessionMetrics.ahsanCompliance).toBe(true);
    expect(agentMetrics.ahsanCompliance).toBe(true);
  });
});
