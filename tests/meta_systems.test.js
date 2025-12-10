const GoTService = require('../node0/ai/got_service');
const ShardingManager = require('../node0/consensus/sharding_manager');
const CulturalAdapter = require('../node0/ai/cultural_adapter');
const GenesisMesh = require('../node0/p2p/genesis_mesh');

describe('Meta-Systems Unit Tests', () => {
    
    describe('GoT Service (Threaded AI)', () => {
        let gotService;

        beforeAll(() => {
            gotService = new GoTService(2); // Small pool for testing
        });

        afterAll(async () => {
            // Cleanup workers if necessary
            gotService.workers.forEach(w => w.worker.terminate());
        });

        test('should process insight with high SNR', async () => {
            const context = "Analyze the efficiency of binary search trees.";
            const result = await gotService.process(context);
            
            expect(result).toBeDefined();
            expect(typeof result).toBe('object');
            expect(result.insight).toBeDefined();
            expect(parseFloat(result.snrScore)).toBeGreaterThan(0);
        });
    });

    describe('Cultural Adapter (Ethics)', () => {
        const adapter = new CulturalAdapter();

        test('should adjust scoring based on context', () => {
            const action = { harmPotential: 0, benevolenceScore: 10 };
            
            adapter.setContext('MENA');
            const menaResult = adapter.evaluate(action, 'MENA');
            
            adapter.setContext('WEST');
            const westResult = adapter.evaluate(action, 'WEST');

            expect(menaResult.score).toBeGreaterThan(westResult.score); // 1.2 vs 1.1 weight
        });

        test('should reject harmful actions universally', () => {
            const harmfulAction = { harmPotential: 10, benevolenceScore: 100 };
            const result = adapter.evaluate(harmfulAction, 'GLOBAL');
            
            expect(result.allowed).toBe(false);
            expect(result.reason).toContain('Universal Adl');
        });
    });

    describe('Sharding Manager (Consensus)', () => {
        let mesh;
        let sharding;

        beforeEach(() => {
            mesh = new GenesisMesh('TEST-NODE');
            sharding = new ShardingManager(mesh);
        });

        test('should assign a deterministic shard ID', () => {
            const shardId = sharding.calculateShardId();
            expect(shardId).toBeGreaterThanOrEqual(0);
            expect(shardId).toBeLessThan(16);
        });

        test('should route transactions correctly', () => {
            // Mock simpleHash to control routing
            sharding.simpleHash = (str) => {
                if (str === 'LOCAL') return sharding.myShardId;
                return (sharding.myShardId + 1) % 16;
            };

            const localTx = { to: 'LOCAL' };
            const remoteTx = { to: 'REMOTE' };

            const localResult = sharding.processTransaction(localTx);
            expect(localResult.status).toBe('COMMITTED');

            const remoteResult = sharding.processTransaction(remoteTx);
            expect(remoteResult.status).toBe('ROUTED');
        });
    });
});
