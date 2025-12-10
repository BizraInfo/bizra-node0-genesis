const axios = require('axios');
const { execSync } = require('child_process');

const API_URL = process.env.API_URL || 'http://localhost:8083'; // Default to Node A
const TARGET_MEDIAN = Number(process.env.SLO_MEDIAN_TARGET || 30);
const TARGET_MAX = Number(process.env.SLO_MAX_TARGET || 60);

async function run() {
  console.log('🛡️  BIZRA FEDERATION SLO GATE 🛡️');
  console.log('================================');
  console.log(`Target Median MTTR: <= ${TARGET_MEDIAN}s`);
  console.log(`Target Max MTTR:    <= ${TARGET_MAX}s`);
  console.log(`API URL:            ${API_URL}`);

  // 1. Run Chaos Test
  console.log('\n1️⃣  Running Chaos Test to generate fresh telemetry...');
  try {
    // We use the existing chaos test script
    // Note: Ensure the chaos test script is configured to report to the same API_URL
    // The chaos test script uses process.env.API_URL if set, or defaults to localhost:8080
    // We need to make sure it points to the same place we are querying.
    
    // We pass the current environment's API_URL to the child process
    execSync('npm run test:meta:federation:chaos', { 
      stdio: 'inherit',
      env: { ...process.env, API_URL } 
    });
  } catch (err) {
    console.error('❌ Chaos test failed execution. SLO verification aborted.');
    process.exit(1);
  }

  // 2. Fetch Metrics
  console.log('\n2️⃣  Fetching Resilience Metrics...');
  let metrics;
  try {
    const res = await axios.get(`${API_URL}/api/mesh/resilience/summary`);
    metrics = res.data;
    console.log('   Received metrics:', JSON.stringify(metrics, null, 2));
    
    // Save metrics for the Hive-Mind (ACE Framework)
    const fs = require('fs');
    const path = require('path');
    const metricsPath = path.join(__dirname, '../chaos_metrics.json');
    fs.writeFileSync(metricsPath, JSON.stringify(metrics, null, 2));
    console.log(`   💾 Metrics saved to ${metricsPath} for Neural Analysis`);

    // 2.5 Activate Hive-Mind (Neural Reflection)
    console.log('\n🧠 Activating Hive-Mind Neural Bridge...');
    try {
      execSync('npm run mind:activate', { stdio: 'inherit' });
    } catch (err) {
      console.warn('⚠️  Hive-Mind activation warning (non-fatal):', err.message);
    }

  } catch (err) {
    console.error(`❌ Failed to fetch metrics from ${API_URL}:`, err.message);
    process.exit(1);
  }

  // 3. Verify SLOs
  console.log('\n3️⃣  Verifying SLO Thresholds...');
  const errors = [];

  if (metrics.incidentCount === 0) {
    errors.push('❌ No incidents recorded. Chaos test may have failed to generate events.');
  }

  if (metrics.medianRecoverySeconds > TARGET_MEDIAN) {
    errors.push(`❌ Median Recovery (${metrics.medianRecoverySeconds}s) exceeds target (${TARGET_MEDIAN}s).`);
  } else {
    console.log(`✅ Median Recovery: ${metrics.medianRecoverySeconds}s (Target: <= ${TARGET_MEDIAN}s)`);
  }

  if (metrics.maxRecoverySeconds > TARGET_MAX) {
    errors.push(`❌ Max Recovery (${metrics.maxRecoverySeconds}s) exceeds target (${TARGET_MAX}s).`);
  } else {
    console.log(`✅ Max Recovery:    ${metrics.maxRecoverySeconds}s (Target: <= ${TARGET_MAX}s)`);
  }

  if (errors.length > 0) {
    console.error('\n⛔ SLO VERIFICATION FAILED:');
    errors.forEach(e => console.error(e));
    process.exit(1);
  }

  console.log('\n✅ SLO VERIFICATION PASSED. Release candidate approved.');
}

run();
