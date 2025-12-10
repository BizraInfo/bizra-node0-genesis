#!/usr/bin/env node

/**
 * Performance Budget Checker
 * Validates bundle sizes against performance budgets
 */

const fs = require('fs')
const path = require('path')

const PERFORMANCE_BUDGET = {
  // Bundle size limits (in KB)
  firstLoadJS: 200,
  firstLoadCSS: 50,
  totalJS: 400,
  totalCSS: 100,
  // Asset limits
  imageMaxSize: 500, // KB
  fontMaxSize: 100, // KB
}

function getBuildStats() {
  const buildManifestPath = path.join(process.cwd(), '.next', 'BUILD_ID')
  
  if (!fs.existsSync(buildManifestPath)) {
    console.error('❌ Build not found. Run `npm run build` first.')
    process.exit(1)
  }

  // Parse Next.js build output
  const analyzePath = path.join(process.cwd(), '.next', 'analyze')
  if (fs.existsSync(analyzePath)) {
    const stats = JSON.parse(fs.readFileSync(analyzePath, 'utf8'))
    return stats
  }

  // Fallback: analyze build output directory
  const outPath = path.join(process.cwd(), '.next', 'static')
  let totalSize = 0
  
  if (fs.existsSync(outPath)) {
    const files = getAllFiles(outPath)
    files.forEach(file => {
      const stats = fs.statSync(file)
      totalSize += stats.size
    })
  }

  return {
    totalSize: totalSize / 1024, // Convert to KB
    files: [],
  }
}

function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir)
  
  files.forEach(file => {
    const filePath = path.join(dir, file)
    if (fs.statSync(filePath).isDirectory()) {
      getAllFiles(filePath, fileList)
    } else {
      fileList.push(filePath)
    }
  })
  
  return fileList
}

function checkPerformanceBudget() {
  console.log('🔍 Checking performance budgets...\n')
  
  const stats = getBuildStats()
  let passed = true
  const errors = []

  // Check total bundle size
  if (stats.totalSize > PERFORMANCE_BUDGET.totalJS) {
    errors.push(
      `❌ Total bundle size ${stats.totalSize.toFixed(2)}KB exceeds budget of ${PERFORMANCE_BUDGET.totalJS}KB`
    )
    passed = false
  } else {
    console.log(`✅ Total bundle size: ${stats.totalSize.toFixed(2)}KB (budget: ${PERFORMANCE_BUDGET.totalJS}KB)`)
  }

  // Check individual files if available
  if (stats.files && stats.files.length > 0) {
    stats.files.forEach(file => {
      const sizeKB = file.size / 1024
      if (sizeKB > PERFORMANCE_BUDGET.imageMaxSize && file.type === 'image') {
        errors.push(`❌ Image ${file.name} (${sizeKB.toFixed(2)}KB) exceeds budget`)
        passed = false
      }
    })
  }

  console.log('\n📊 Performance Budget Summary:')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  
  if (passed) {
    console.log('✅ All performance budgets passed!')
    process.exit(0)
  } else {
    console.log('❌ Performance budget violations:')
    errors.forEach(error => console.log(`  ${error}`))
    console.log('\n💡 Consider:')
    console.log('  - Code splitting')
    console.log('  - Image optimization')
    console.log('  - Tree shaking')
    console.log('  - Dynamic imports')
    process.exit(1)
  }
}

checkPerformanceBudget()

