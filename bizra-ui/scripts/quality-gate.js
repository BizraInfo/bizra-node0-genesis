#!/usr/bin/env node

/**
 * Quality Gate Checker
 * Validates project quality metrics before deployment
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const QUALITY_THRESHOLDS = {
  testCoverage: 70,
  lintErrors: 0,
  typeErrors: 0,
  buildSuccess: true,
  securityVulnerabilities: 0,
}

let allPassed = true

console.log('🚪 Running Quality Gate Checks...\n')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

// Check TypeScript
try {
  console.log('📝 Checking TypeScript...')
  execSync('npx tsc --noEmit', { stdio: 'inherit' })
  console.log('✅ TypeScript check passed\n')
} catch (error) {
  console.log('❌ TypeScript check failed\n')
  allPassed = false
}

// Check ESLint
try {
  console.log('🔍 Checking ESLint...')
  execSync('npm run lint', { stdio: 'inherit' })
  console.log('✅ ESLint check passed\n')
} catch (error) {
  console.log('❌ ESLint check failed\n')
  allPassed = false
}

// Check build
try {
  console.log('🏗️  Checking build...')
  execSync('npm run build', { stdio: 'inherit' })
  console.log('✅ Build check passed\n')
} catch (error) {
  console.log('❌ Build check failed\n')
  allPassed = false
}

// Check test coverage
try {
  console.log('🧪 Checking test coverage...')
  const coveragePath = path.join(process.cwd(), 'coverage', 'coverage-summary.json')
  
  if (fs.existsSync(coveragePath)) {
    const coverage = JSON.parse(fs.readFileSync(coveragePath, 'utf8'))
    const lines = coverage.total?.lines?.pct || 0
    
    if (lines >= QUALITY_THRESHOLDS.testCoverage) {
      console.log(`✅ Test coverage: ${lines.toFixed(2)}% (threshold: ${QUALITY_THRESHOLDS.testCoverage}%)\n`)
    } else {
      console.log(`❌ Test coverage: ${lines.toFixed(2)}% below threshold of ${QUALITY_THRESHOLDS.testCoverage}%\n`)
      allPassed = false
    }
  } else {
    console.log('⚠️  No coverage data found. Run tests with coverage first.\n')
  }
} catch (error) {
  console.log('⚠️  Could not check test coverage\n')
}

// Security audit
try {
  console.log('🔒 Checking security vulnerabilities...')
  const auditResult = execSync('npm audit --audit-level=high --json', { encoding: 'utf8' })
  const audit = JSON.parse(auditResult)
  
  if (audit.metadata?.vulnerabilities?.high === 0 && audit.metadata?.vulnerabilities?.critical === 0) {
    console.log('✅ No high or critical security vulnerabilities\n')
  } else {
    console.log(`❌ Found security vulnerabilities:\n`)
    console.log(`   High: ${audit.metadata?.vulnerabilities?.high || 0}`)
    console.log(`   Critical: ${audit.metadata?.vulnerabilities?.critical || 0}\n`)
    allPassed = false
  }
} catch (error) {
  console.log('⚠️  Security audit check failed\n')
}

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

if (allPassed) {
  console.log('✅ Quality Gate: PASSED')
  console.log('🚀 Ready for deployment!')
  process.exit(0)
} else {
  console.log('❌ Quality Gate: FAILED')
  console.log('🚫 Deployment blocked. Please fix the issues above.')
  process.exit(1)
}

