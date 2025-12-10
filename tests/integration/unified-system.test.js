/**
 * BIZRA Unified System Integration Tests
 * Comprehensive endpoint validation with φ-aligned assertions
 * PROFESSIONAL ELITE PRACTITIONER test suite
 */

const http = require('http');

const BASE_URL = 'http://localhost:8080';
const PHI = 1.618033988749;

class UnifiedSystemTester {
  constructor() {
    this.testResults = {
      total: 0,
      passed: 0,
      failed: 0,
      errors: []
    };
  }

  async request(method, path, body = null) {
    return new Promise((resolve, reject) => {
      const url = new URL(path, BASE_URL);
      const options = {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method,
        headers: {
          'Content-Type': 'application/json'
        }
      };

      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            resolve({ status: res.statusCode, data: json });
          } catch (err) {
            resolve({ status: res.statusCode, data });
          }
        });
      });

      req.on('error', reject);
      req.setTimeout(10000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      if (body) {
        req.write(JSON.stringify(body));
      }

      req.end();
    });
  }

  async test(name, testFn) {
    this.testResults.total++;
    try {
      await testFn();
      this.testResults.passed++;
      console.log(`✅ ${name}`);
      return true;
    } catch (err) {
      this.testResults.failed++;
      this.testResults.errors.push({ test: name, error: err.message });
      console.log(`❌ ${name}: ${err.message}`);
      return false;
    }
  }

  assert(condition, message) {
    if (!condition) {
      throw new Error(message);
    }
  }

  assertEqual(actual, expected, message) {
    if (actual !== expected) {
      throw new Error(`${message}: expected ${expected}, got ${actual}`);
    }
  }

  assertGreaterThan(actual, threshold, message) {
    if (actual <= threshold) {
      throw new Error(`${message}: expected > ${threshold}, got ${actual}`);
    }
  }

  async runAllTests() {
    console.log('\n🧪 BIZRA UNIFIED SYSTEM - COMPREHENSIVE TEST SUITE');
    console.log('='.repeat(70));
    console.log(`φ = ${PHI}\n`);

    // Core System Tests
    console.log('\n📊 CORE SYSTEM TESTS');
    console.log('-'.repeat(70));
    await this.testHealthEndpoint();
    await this.testUnifiedQuery();
    await this.testWorkflowExecution();

    // HyperGraph RAG Tests
    console.log('\n🕸️  HYPERGRAPH RAG TESTS');
    console.log('-'.repeat(70));
    await this.testKnowledgeQuery();
    await this.testKnowledgeStats();
    await this.testSemanticSearch();

    // Memory System Tests
    console.log('\n🧠 MEMORY SYSTEM TESTS (L1-L5)');
    console.log('-'.repeat(70));
    await this.testMemoryStoreL1();
    await this.testMemoryStoreL2();
    await this.testMemoryStoreL3();
    await this.testMemoryStoreL5();
    await this.testMemoryRecall();
    await this.testMemoryConsolidation();

    // Neural Network Tests
    console.log('\n🤖 NEURAL NETWORK TESTS');
    console.log('-'.repeat(70));
    await this.testNeuralTemplates();
    await this.testNeuralTraining();
    await this.testNeuralClusterCreation();
    await this.testNeuralStats();

    // Self-Healing Tests
    console.log('\n🔧 SELF-HEALING TESTS');
    console.log('-'.repeat(70));
    await this.testSelfHealingTrigger();

    // Performance Tests
    console.log('\n⚡ PERFORMANCE TESTS');
    console.log('-'.repeat(70));
    await this.testResponseTimes();
    await this.testConcurrentRequests();

    // Print Results
    this.printResults();
  }

  // Core System Tests
  async testHealthEndpoint() {
    await this.test('Health endpoint returns 200', async () => {
      const res = await this.request('GET', '/unified/health');
      this.assertEqual(res.status, 200, 'Status code');
      this.assert(res.data.status === 'healthy', 'Health status');
      this.assert(res.data.version.includes('unified'), 'Version string');
      this.assertEqual(res.data.memory.phiRatio, PHI, 'φ ratio in memory system');
    });
  }

  async testUnifiedQuery() {
    await this.test('Unified query routes to sphere', async () => {
      const res = await this.request('POST', '/unified/query', {
        query: 'What is the PoI consensus mechanism?',
        sphere: 2
      });
      this.assertEqual(res.status, 200, 'Status code');
      this.assert(res.data.status === 'success', 'Query success');
      this.assert(res.data.result.sphere === 2, 'Routed to sphere 2');
    });
  }

  async testWorkflowExecution() {
    await this.test('Workflow execution starts', async () => {
      const res = await this.request('POST', '/unified/execute', {
        workflow: 'test-workflow',
        agents: ['Strategist', 'Researcher']
      });
      this.assertEqual(res.status, 200, 'Status code');
      this.assert(res.data.status === 'executing', 'Execution started');
      this.assert(res.data.executionId, 'Execution ID provided');
    });
  }

  // HyperGraph RAG Tests
  async testKnowledgeQuery() {
    await this.test('HyperGraph RAG query with φ-spiral algorithm', async () => {
      const res = await this.request('GET', '/unified/knowledge?search=consensus&depth=2&algorithm=phi-spiral');
      this.assertEqual(res.status, 200, 'Status code');
      this.assert(res.data.status === 'success', 'Query success');
      this.assert(res.data.knowledge.algorithm === 'phi-spiral', 'Algorithm used');
      this.assert(Array.isArray(res.data.knowledge.nodes), 'Nodes array returned');
    });
  }

  async testKnowledgeStats() {
    await this.test('HyperGraph statistics available', async () => {
      const res = await this.request('GET', '/unified/knowledge/stats');
      this.assertEqual(res.status, 200, 'Status code');
      this.assert(res.data.status === 'success', 'Stats success');
      this.assertEqual(res.data.stats.phiRatio, PHI, 'φ ratio in stats');
      this.assertEqual(res.data.stats.algorithms, 8, '8 traversal algorithms');
    });
  }

  async testSemanticSearch() {
    await this.test('Semantic search endpoint available', async () => {
      const res = await this.request('POST', '/unified/knowledge/semantic', {
        query: 'blockchain consensus',
        limit: 5
      });
      this.assertEqual(res.status, 200, 'Status code');
      this.assert(res.data.status === 'success', 'Search success');
    });
  }

  // Memory System Tests
  async testMemoryStoreL1() {
    await this.test('L1 Memory storage (Redis)', async () => {
      const res = await this.request('POST', '/unified/memory/store', {
        content: 'Test L1 immediate memory',
        layer: 'L1',
        importance: 0.5
      });
      this.assertEqual(res.status, 200, 'Status code');
      this.assert(res.data.status === 'stored', 'Storage success');
      this.assertEqual(res.data.layer, 'L1', 'Correct layer');
    });
  }

  async testMemoryStoreL2() {
    await this.test('L2 Memory storage (PostgreSQL)', async () => {
      const res = await this.request('POST', '/unified/memory/store', {
        content: 'Test L2 working memory',
        layer: 'L2',
        importance: 0.65
      });
      this.assertEqual(res.status, 200, 'Status code');
      this.assert(res.data.status === 'stored', 'Storage success');
      this.assertEqual(res.data.layer, 'L2', 'Correct layer');
    });
  }

  async testMemoryStoreL3() {
    await this.test('L3 Memory storage (Neo4j)', async () => {
      const res = await this.request('POST', '/unified/memory/store', {
        content: 'Test L3 episodic memory with φ-decay',
        layer: 'L3',
        importance: 0.85
      });
      this.assertEqual(res.status, 200, 'Status code');
      this.assert(res.data.status === 'stored' || res.data.status === 'fallback', 'Storage attempt');
      this.assertEqual(res.data.layer, 'L3', 'Correct layer');
    });
  }

  async testMemoryStoreL5() {
    await this.test('L5 Memory storage (LangGraph)', async () => {
      const res = await this.request('POST', '/unified/memory/store', {
        content: 'Test L5 procedural workflow',
        layer: 'L5',
        importance: 0.95
      });
      this.assertEqual(res.status, 200, 'Status code');
      this.assert(res.data.status === 'stored', 'Storage success');
      this.assertEqual(res.data.layer, 'L5', 'Correct layer');
    });
  }

  async testMemoryRecall() {
    await this.test('Memory recall from L1', async () => {
      const res = await this.request('GET', '/unified/memory/recall?query=Test&layer=L1&limit=5');
      this.assertEqual(res.status, 200, 'Status code');
      this.assert(res.data.status === 'success', 'Recall success');
      this.assert(Array.isArray(res.data.memories), 'Memories array returned');
    });
  }

  async testMemoryConsolidation() {
    await this.test('φ-aligned memory consolidation', async () => {
      const res = await this.request('POST', '/unified/memory/consolidate');
      this.assertEqual(res.status, 200, 'Status code');
      this.assert(res.data.status === 'success', 'Consolidation success');
      this.assertEqual(res.data.consolidation.phiRatio, PHI, 'φ ratio in consolidation');
      this.assert(res.data.consolidation.moved, 'Movement report provided');
    });
  }

  // Neural Network Tests
  async testNeuralTemplates() {
    await this.test('Neural templates list (5 φ-aligned)', async () => {
      const res = await this.request('GET', '/unified/neural/templates');
      this.assertEqual(res.status, 200, 'Status code');
      this.assert(res.data.status === 'success', 'Templates success');
      this.assertEqual(res.data.count, 5, '5 templates available');
      this.assert(res.data.phiAligned === true, 'φ-aligned templates');
    });
  }

  async testNeuralTraining() {
    await this.test('Neural training job creation', async () => {
      const res = await this.request('POST', '/unified/neural/train', {
        template: 'memory-consolidator',
        tier: 'small'
      });
      this.assertEqual(res.status, 200, 'Status code');
      this.assert(res.data.status === 'success', 'Training started');
      this.assert(res.data.job.jobId, 'Job ID provided');
    });
  }

  async testNeuralClusterCreation() {
    await this.test('Distributed neural cluster creation', async () => {
      const res = await this.request('POST', '/unified/neural/cluster/create', {
        name: 'test-cluster',
        architecture: 'transformer',
        topology: 'mesh'
      });
      this.assertEqual(res.status, 200, 'Status code');
      this.assert(res.data.status === 'success', 'Cluster created');
      this.assert(res.data.cluster.clusterId, 'Cluster ID provided');
    });
  }

  async testNeuralStats() {
    await this.test('Neural orchestrator statistics', async () => {
      const res = await this.request('GET', '/unified/neural/stats');
      this.assertEqual(res.status, 200, 'Status code');
      this.assert(res.data.status === 'success', 'Stats success');
      this.assertEqual(res.data.stats.templates, 5, '5 templates in stats');
      this.assertEqual(res.data.stats.phiRatio, PHI, 'φ ratio in neural stats');
    });
  }

  // Self-Healing Tests
  async testSelfHealingTrigger() {
    await this.test('Self-healing manual trigger', async () => {
      const res = await this.request('POST', '/unified/heal', {
        component: 'test-component',
        strategy: 'retry'
      });
      this.assertEqual(res.status, 200, 'Status code');
      this.assert(res.data.status === 'healing', 'Healing triggered');
      this.assert(res.data.strategy === 'retry', 'Strategy applied');
    });
  }

  // Performance Tests
  async testResponseTimes() {
    await this.test('Health endpoint P95 < 200ms', async () => {
      const times = [];
      for (let i = 0; i < 20; i++) {
        const start = Date.now();
        await this.request('GET', '/unified/health');
        times.push(Date.now() - start);
      }
      times.sort((a, b) => a - b);
      const p95 = times[Math.floor(times.length * 0.95)];
      console.log(`      P95 latency: ${p95}ms`);
      this.assert(p95 < 200, `P95 latency ${p95}ms should be < 200ms`);
    });
  }

  async testConcurrentRequests() {
    await this.test('Handle 10 concurrent health checks', async () => {
      const promises = Array(10).fill(null).map(() =>
        this.request('GET', '/unified/health')
      );
      const results = await Promise.all(promises);
      const allSuccessful = results.every(r => r.status === 200);
      this.assert(allSuccessful, 'All concurrent requests succeeded');
    });
  }

  printResults() {
    console.log('\n' + '='.repeat(70));
    console.log('🏆 TEST RESULTS SUMMARY');
    console.log('='.repeat(70));
    console.log(`Total Tests:  ${this.testResults.total}`);
    console.log(`✅ Passed:     ${this.testResults.passed}`);
    console.log(`❌ Failed:     ${this.testResults.failed}`);
    console.log(`Success Rate: ${((this.testResults.passed / this.testResults.total) * 100).toFixed(1)}%`);

    if (this.testResults.failed > 0) {
      console.log('\n❌ FAILURES:');
      this.testResults.errors.forEach((err, i) => {
        console.log(`${i + 1}. ${err.test}: ${err.error}`);
      });
    }

    console.log('\n' + '='.repeat(70));

    if (this.testResults.failed === 0) {
      console.log('✅ ALL TESTS PASSED - PRODUCTION READY');
      console.log('🏆 PROFESSIONAL ELITE PRACTITIONER QUALITY ACHIEVED');
    } else {
      console.log('⚠️  SOME TESTS FAILED - Review failures above');
    }

    console.log('='.repeat(70) + '\n');
  }
}

// Run tests
async function main() {
  const tester = new UnifiedSystemTester();
  await tester.runAllTests();
  process.exit(tester.testResults.failed === 0 ? 0 : 1);
}

if (require.main === module) {
  main().catch(err => {
    console.error('❌ Test suite failed:', err);
    process.exit(1);
  });
}

module.exports = UnifiedSystemTester;
