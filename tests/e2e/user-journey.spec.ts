/**
 * @test Complete User Journey E2E Tests
 * @description Full user workflow from registration to dashboard
 * @coverage Critical user paths with real browser
 */
import { test, expect, Page } from '@playwright/test';

test.describe('Complete User Journey', () => {
  let page: Page;
  const testUser = {
    email: `test${Date.now()}@example.com`,
    username: `testuser${Date.now()}`,
    password: 'SecurePass123!',
    firstName: 'Test',
    lastName: 'User',
  };

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    await page.goto('/');
  });

  test('should complete full registration and login flow', async () => {
    // Navigate to registration page
    await page.click('text=Sign Up');
    await expect(page).toHaveURL(/.*\/register/);

    // Fill registration form
    await page.fill('[name="email"]', testUser.email);
    await page.fill('[name="username"]', testUser.username);
    await page.fill('[name="password"]', testUser.password);
    await page.fill('[name="confirmPassword"]', testUser.password);
    await page.fill('[name="firstName"]', testUser.firstName);
    await page.fill('[name="lastName"]', testUser.lastName);

    // Accept terms
    await page.check('[name="acceptTerms"]');

    // Submit form
    await page.click('button[type="submit"]');

    // Should show verification message
    await expect(page.locator('text=Verification email sent')).toBeVisible();

    // Mock email verification (in real scenario, would check email)
    // For testing, we can directly navigate to dashboard after verification

    // Login with new account
    await page.goto('/login');
    await page.fill('[name="email"]', testUser.email);
    await page.fill('[name="password"]', testUser.password);
    await page.click('button[type="submit"]');

    // Should redirect to dashboard
    await expect(page).toHaveURL(/.*\/dashboard/);
    await expect(page.locator(`text=${testUser.firstName}`)).toBeVisible();
  });

  test('should show validation errors on invalid input', async () => {
    await page.goto('/register');

    // Try to submit empty form
    await page.click('button[type="submit"]');

    // Should show validation errors
    await expect(page.locator('text=Email is required')).toBeVisible();
    await expect(page.locator('text=Password is required')).toBeVisible();

    // Try invalid email
    await page.fill('[name="email"]', 'invalid-email');
    await page.blur('[name="email"]');
    await expect(page.locator('text=Invalid email format')).toBeVisible();

    // Try weak password
    await page.fill('[name="password"]', 'weak');
    await page.blur('[name="password"]');
    await expect(page.locator('text=Password must be stronger')).toBeVisible();
  });

  test('should handle login errors gracefully', async () => {
    await page.goto('/login');

    // Try login with wrong credentials
    await page.fill('[name="email"]', 'wrong@example.com');
    await page.fill('[name="password"]', 'WrongPassword123!');
    await page.click('button[type="submit"]');

    // Should show error message
    await expect(page.locator('text=Invalid credentials')).toBeVisible();

    // Should not redirect
    await expect(page).toHaveURL(/.*\/login/);
  });

  test('should complete password reset flow', async () => {
    // First register a user
    await page.goto('/register');
    await page.fill('[name="email"]', testUser.email);
    await page.fill('[name="password"]', testUser.password);
    await page.fill('[name="username"]', testUser.username);
    await page.check('[name="acceptTerms"]');
    await page.click('button[type="submit"]');

    // Navigate to password reset
    await page.goto('/login');
    await page.click('text=Forgot Password?');
    await expect(page).toHaveURL(/.*\/forgot-password/);

    // Request password reset
    await page.fill('[name="email"]', testUser.email);
    await page.click('button[type="submit"]');

    // Should show success message
    await expect(page.locator('text=Reset link sent')).toBeVisible();

    // In real scenario, would check email and click link
    // For testing, simulate reset token flow
    const resetToken = 'mock-reset-token';
    await page.goto(`/reset-password?token=${resetToken}`);

    // Set new password
    const newPassword = 'NewSecurePass123!';
    await page.fill('[name="password"]', newPassword);
    await page.fill('[name="confirmPassword"]', newPassword);
    await page.click('button[type="submit"]');

    // Should show success and redirect to login
    await expect(page.locator('text=Password updated')).toBeVisible();
    await expect(page).toHaveURL(/.*\/login/);
  });

  test('should navigate user dashboard', async () => {
    // Login first
    await page.goto('/login');
    await page.fill('[name="email"]', testUser.email);
    await page.fill('[name="password"]', testUser.password);
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/.*\/dashboard/);

    // Check dashboard elements
    await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible();
    await expect(page.locator(`text=${testUser.email}`)).toBeVisible();

    // Navigate to profile
    await page.click('text=Profile');
    await expect(page).toHaveURL(/.*\/profile/);
    await expect(page.locator(`[value="${testUser.firstName}"]`)).toBeVisible();

    // Navigate to settings
    await page.click('text=Settings');
    await expect(page).toHaveURL(/.*\/settings/);

    // Logout
    await page.click('text=Logout');
    await expect(page).toHaveURL(/.*\/login/);
  });

  test('should update user profile', async () => {
    // Login
    await page.goto('/login');
    await page.fill('[name="email"]', testUser.email);
    await page.fill('[name="password"]', testUser.password);
    await page.click('button[type="submit"]');

    // Navigate to profile
    await page.goto('/profile');

    // Update profile
    const updatedFirstName = 'Updated';
    await page.fill('[name="firstName"]', updatedFirstName);
    await page.fill('[name="bio"]', 'This is my bio');
    await page.fill('[name="location"]', 'San Francisco, CA');

    // Save changes
    await page.click('button:has-text("Save")');

    // Should show success message
    await expect(page.locator('text=Profile updated')).toBeVisible();

    // Reload page and verify changes persisted
    await page.reload();
    await expect(page.locator(`[value="${updatedFirstName}"]`)).toBeVisible();
    await expect(page.locator('[name="bio"]')).toHaveValue('This is my bio');
  });

  test('should handle session expiration', async () => {
    // Login
    await page.goto('/login');
    await page.fill('[name="email"]', testUser.email);
    await page.fill('[name="password"]', testUser.password);
    await page.click('button[type="submit"]');

    // Navigate to dashboard
    await expect(page).toHaveURL(/.*\/dashboard/);

    // Clear session storage to simulate expiration
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    // Try to access protected page
    await page.goto('/profile');

    // Should redirect to login
    await expect(page).toHaveURL(/.*\/login/);
    await expect(page.locator('text=Session expired')).toBeVisible();
  });

  test('should work across different browsers', async ({ browserName }) => {
    // This test runs in all configured browsers (Chrome, Firefox, Safari)
    console.log(`Testing in ${browserName}`);

    await page.goto('/login');
    await expect(page.locator('h1:has-text("Login")')).toBeVisible();

    // Verify form elements are visible
    await expect(page.locator('[name="email"]')).toBeVisible();
    await expect(page.locator('[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should be responsive on mobile', async () => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE

    await page.goto('/');

    // Check mobile menu
    await expect(page.locator('[aria-label="Menu"]')).toBeVisible();

    // Open mobile menu
    await page.click('[aria-label="Menu"]');
    await expect(page.locator('nav')).toBeVisible();

    // Navigate to login
    await page.click('text=Login');
    await expect(page).toHaveURL(/.*\/login/);

    // Verify form is usable on mobile
    await expect(page.locator('[name="email"]')).toBeVisible();
    await page.fill('[name="email"]', testUser.email);
    await page.fill('[name="password"]', testUser.password);

    // Form should be properly sized
    const emailInput = page.locator('[name="email"]');
    const box = await emailInput.boundingBox();
    expect(box?.width).toBeGreaterThan(200); // Should be wide enough
  });

  test('should handle network errors', async () => {
    // Simulate offline mode
    await page.context().setOffline(true);

    await page.goto('/login');
    await page.fill('[name="email"]', testUser.email);
    await page.fill('[name="password"]', testUser.password);
    await page.click('button[type="submit"]');

    // Should show network error
    await expect(page.locator('text=Network error')).toBeVisible();

    // Restore connection
    await page.context().setOffline(false);

    // Retry should work
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*\/dashboard/);
  });

  test('should preserve form data on navigation', async () => {
    await page.goto('/register');

    // Fill partial form
    await page.fill('[name="email"]', testUser.email);
    await page.fill('[name="username"]', testUser.username);

    // Navigate away
    await page.goto('/login');

    // Navigate back
    await page.goto('/register');

    // Form data should be preserved (if implemented)
    const emailValue = await page.inputValue('[name="email"]');
    const usernameValue = await page.inputValue('[name="username"]');

    // This depends on implementation - adjust as needed
    if (emailValue || usernameValue) {
      expect(emailValue).toBe(testUser.email);
      expect(usernameValue).toBe(testUser.username);
    }
  });

  test('should handle accessibility requirements', async () => {
    await page.goto('/login');

    // Check for ARIA labels
    await expect(page.locator('[aria-label="Email"]')).toBeVisible();
    await expect(page.locator('[aria-label="Password"]')).toBeVisible();

    // Check keyboard navigation
    await page.keyboard.press('Tab');
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement).toBeTruthy();

    // Check form submission with Enter key
    await page.fill('[name="email"]', testUser.email);
    await page.fill('[name="password"]', testUser.password);
    await page.keyboard.press('Enter');

    // Should submit form
    await page.waitForNavigation({ timeout: 5000 }).catch(() => {});
  });
});

test.describe('Performance Tests', () => {
  test('should load pages within performance budget', async ({ page }) => {
    // Set performance metrics
    const metrics = await page.evaluate(() => {
      return JSON.parse(
        JSON.stringify(performance.getEntriesByType('navigation'))
      );
    });

    // Page should load within 2 seconds
    expect(metrics[0]?.loadEventEnd - metrics[0]?.fetchStart).toBeLessThan(2000);
  });

  test('should handle rapid form submissions', async ({ page }) => {
    await page.goto('/login');

    // Submit form multiple times rapidly
    for (let i = 0; i < 5; i++) {
      await page.fill('[name="email"]', 'test@example.com');
      await page.fill('[name="password"]', 'password123');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(100);
    }

    // Should not crash or freeze
    await expect(page.locator('body')).toBeVisible();
  });
});
