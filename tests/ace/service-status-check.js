/**
 * Check Status of BIZRA NODE0 Local Services
 * Verifies all services are accessible and operational
 */

const https = require('http');

async function checkService(url, serviceName) {
  return new Promise((resolve) => {
    https.get(url, { timeout: 3000 }, (res) => {
      resolve({
        service: serviceName,
        url: url,
        status: res.statusCode,
        operational: res.statusCode >= 200 && res.statusCode < 400
      });
    }).on('error', () => {
      resolve({
        service: serviceName,
        url: url,
        status: 'ERROR',
        operational: false
      });
    });
  });
}

async function checkAllServices() {
  console.log('\n📊 Checking BIZRA NODE0 Service Status...\n');
  
  const services = [
    { url: 'http://localhost:8080/health', name: 'Main API Server' },
    { url: 'http://localhost:8081/health', name: 'WebSocket Server' },
    { url: 'http://localhost:7474/', name: 'Neo4j Browser' },
    { url: 'http://localhost:11434/api/tags', name: 'Ollama (Local AI)' },
    { url: 'http://localhost:4173/', name: 'Dashboard' }
  ];

  const results = await Promise.all(
    services.map(svc => checkService(svc.url, svc.name))
  );

  results.forEach(result => {
    if (result.operational) {
      console.log(`✅ ${result.service}: http://${result.url.split('://')[1]} - STATUS ${result.status}`);
    } else {
      console.log(`❌ ${result.service}: http://${result.url.split('://')[1]} - NOT RESPONDING`);
    }
  });

  console.log('\n' + '='.repeat(70));
  const operational = results.filter(r => r.operational).length;
  console.log(`\nOperational Services: ${operational}/${results.length}`);
  
  if (operational === results.length) {
    console.log('✅ ALL SERVICES OPERATIONAL - ACE Framework Ready');
  } else {
    console.log('⚠️  SOME SERVICES OFFLINE - Check service logs');
  }
  
  return results;
}

checkAllServices().catch(console.error);

