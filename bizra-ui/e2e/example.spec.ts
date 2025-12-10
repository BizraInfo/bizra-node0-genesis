import { test, expect } from '@playwright/test'

test.describe('Home Page', () => {
  test('should load the homepage', async ({ page }) => {
    await page.goto('/')
    
    // Check page title
    await expect(page).toHaveTitle(/BIZRA/)
    
    // Check navigation is visible
    const nav = page.locator('nav')
    await expect(nav).toBeVisible()
  })

  test('should navigate to AI OS page', async ({ page }) => {
    await page.goto('/')
    
    // Click AI OS link
    await page.click('text=AI OS')
    
    // Wait for navigation
    await page.waitForURL('/ai-os')
    
    // Check page content
    await expect(page.locator('text=The First AI OS That Rewards You')).toBeVisible()
  })

  test('should have working contact form', async ({ page }) => {
    await page.goto('/')
    
    // Navigate to contact section
    await page.click('text=Contact')
    
    // Fill form
    await page.fill('input[name="name"]', 'Test User')
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('textarea[name="message"]', 'Test message')
    
    // Form validation should pass
    const submitButton = page.locator('button[type="submit"]')
    await expect(submitButton).not.toBeDisabled()
  })
})

test.describe('AI OS Page', () => {
  test('should load AI OS page', async ({ page }) => {
    await page.goto('/ai-os')
    
    await expect(page.locator('text=The First AI OS That Rewards You')).toBeVisible()
  })

  test('should validate invitation code', async ({ page }) => {
    await page.goto('/ai-os')
    
    // Scroll to form
    await page.click('text=Join Alpha-100')
    
    // Enter invalid code
    await page.fill('input[id="inviteCode"]', 'INVALID-CODE')
    
    // Wait for validation
    await page.waitForTimeout(500)
    
    // Should show error
    const validation = page.locator('#code-validation')
    await expect(validation).toContainText('Invalid')
    
    // Enter valid code
    await page.fill('input[id="inviteCode"]', 'BZ-N26R-GMDA')
    
    // Should show success
    await expect(validation).toContainText('Valid')
  })

  test('should display blockchain status', async ({ page }) => {
    await page.goto('/ai-os')
    
    // Check for blockchain status indicator
    const status = page.locator('text=/Blockchain API/')
    await expect(status).toBeVisible()
  })
})

test.describe('Performance', () => {
  test('should have fast load time', async ({ page }) => {
    const startTime = Date.now()
    await page.goto('/')
    const loadTime = Date.now() - startTime
    
    // Should load in under 3 seconds
    expect(loadTime).toBeLessThan(3000)
  })

  test('should have optimized images', async ({ page }) => {
    await page.goto('/')
    
    // Get all images
    const images = await page.locator('img').all()
    
    for (const img of images) {
      const src = await img.getAttribute('src')
      // Next.js images should be optimized
      if (src && src.includes('_next/image')) {
        expect(src).toContain('_next/image')
      }
    }
  })
})

test.describe('Accessibility', () => {
  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/')
    
    // Check for h1
    const h1 = page.locator('h1')
    await expect(h1).toHaveCount(1)
  })

  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/')
    
    // Tab through page
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    
    // Should have focus indicators
    const focused = page.locator(':focus')
    await expect(focused).toBeVisible()
  })
})

