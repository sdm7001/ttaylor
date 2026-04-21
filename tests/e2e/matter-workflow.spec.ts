/**
 * E2E test spec for the uncontested divorce matter workflow.
 *
 * Prerequisites:
 * - Staff app running at STAFF_APP_URL (default: http://localhost:3000)
 * - Client portal running at CLIENT_PORTAL_URL (default: http://localhost:3001)
 * - Database seeded with test data
 * - Test credentials set via environment variables
 *
 * Run with: npx playwright test tests/e2e/matter-workflow.spec.ts
 */
import { test, expect } from '@playwright/test';

const STAFF_APP_URL = process.env.STAFF_APP_URL ?? 'http://localhost:3000';
const CLIENT_PORTAL_URL = process.env.CLIENT_PORTAL_URL ?? 'http://localhost:3001';
const TEST_STAFF_EMAIL = process.env.TEST_STAFF_EMAIL ?? 'paralegal@test.ttaylor.com';
const TEST_STAFF_PASSWORD = process.env.TEST_STAFF_PASSWORD ?? 'test-password-123';
const TEST_CLIENT_EMAIL = process.env.TEST_CLIENT_EMAIL ?? 'client@test.ttaylor.com';
const TEST_CLIENT_PASSWORD = process.env.TEST_CLIENT_PASSWORD ?? 'client-password-123';

test.describe('Uncontested Divorce Matter Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to staff app and authenticate
    await page.goto(`${STAFF_APP_URL}/sign-in`);
    await page.fill('[name="emailAddress"]', TEST_STAFF_EMAIL);
    await page.click('button:has-text("Continue")');
    await page.fill('[name="password"]', TEST_STAFF_PASSWORD);
    await page.click('button:has-text("Sign in")');
    // Wait for dashboard to load
    await page.waitForSelector('[data-testid="dashboard"]', { timeout: 15000 });
  });

  test('creates a new matter from a lead', async ({ page }) => {
    // Navigate to leads
    await page.click('[data-testid="nav-leads"]');
    await page.waitForSelector('[data-testid="leads-list"]');

    // Open the new lead form
    await page.click('button:has-text("New Lead")');
    await page.waitForSelector('[data-testid="lead-form"]');

    // Fill intake form
    await page.fill('[name="firstName"]', 'Jane');
    await page.fill('[name="lastName"]', 'TestSmith');
    await page.fill('[name="email"]', 'jane.testsmith@example.com');
    await page.fill('[name="phone"]', '512-555-0199');
    await page.selectOption('[name="matterType"]', { label: 'Uncontested Divorce' });
    await page.fill('[name="notes"]', 'E2E test lead - uncontested divorce');
    await page.click('button:has-text("Submit")');

    // Wait for lead to be created
    await page.waitForSelector('text=Jane TestSmith');

    // Run conflict check
    await page.click('button:has-text("Run Conflict Check")');
    await page.waitForSelector('[data-testid="conflict-result"]');
    const conflictResult = await page.textContent('[data-testid="conflict-result"]');
    expect(conflictResult).toContain('No conflicts found');

    // Convert lead to matter
    await page.click('button:has-text("Convert to Matter")');
    await page.waitForSelector('[data-testid="matter-detail"]');

    // Verify matter was created
    const matterTitle = await page.textContent('[data-testid="matter-title"]');
    expect(matterTitle).toContain('TestSmith');
  });

  test('generates and approves a document', async ({ page }) => {
    // Navigate to an existing matter (assumes test data exists)
    await page.click('[data-testid="nav-matters"]');
    await page.waitForSelector('[data-testid="matters-list"]');
    await page.click('[data-testid="matters-list"] tr:first-child');
    await page.waitForSelector('[data-testid="matter-detail"]');

    // Go to Documents tab
    await page.click('[data-testid="tab-documents"]');
    await page.waitForSelector('[data-testid="documents-panel"]');

    // Generate a document
    await page.click('button:has-text("Generate")');
    await page.waitForSelector('[data-testid="template-picker"]');
    await page.click('[data-testid="template-picker"] li:first-child');
    await page.click('button:has-text("Generate Document")');

    // Verify GENERATING status appears
    await page.waitForSelector('text=Generating');

    // Wait for GENERATED status (poll with timeout)
    await page.waitForSelector('[data-testid="document-status"]:has-text("Generated")', {
      timeout: 30000,
    });

    // Submit for review
    await page.click('button:has-text("Submit for Review")');
    await page.waitForSelector('[data-testid="document-status"]:has-text("Attorney Review")');

    // Approve as attorney (this would require attorney credentials in a real test)
    await page.click('button:has-text("Approve")');
    await page.waitForSelector('[data-testid="document-status"]:has-text("Approved")');
  });

  test('assembles and submits filing packet', async ({ page }) => {
    // Navigate to a matter with approved documents
    await page.click('[data-testid="nav-matters"]');
    await page.waitForSelector('[data-testid="matters-list"]');
    await page.click('[data-testid="matters-list"] tr:first-child');
    await page.waitForSelector('[data-testid="matter-detail"]');

    // Go to Filing tab
    await page.click('[data-testid="tab-filing"]');
    await page.waitForSelector('[data-testid="filing-panel"]');

    // Create new filing packet
    await page.click('button:has-text("New Filing Packet")');
    await page.waitForSelector('[data-testid="packet-form"]');

    // Add approved document as lead document
    await page.click('[data-testid="add-lead-document"]');
    await page.waitForSelector('[data-testid="document-picker"]');
    await page.click('[data-testid="document-picker"] [data-testid="approved-doc"]:first-child');
    await page.click('button:has-text("Add to Packet")');

    // Validate packet
    await page.click('button:has-text("Validate Packet")');
    await page.waitForSelector('[data-testid="validation-result"]:has-text("Valid")');

    // Submit for attorney review
    await page.click('button:has-text("Submit for Attorney Review")');
    await page.waitForSelector('[data-testid="packet-status"]:has-text("Attorney Review")');
  });

  test('client can view matter in portal', async ({ page }) => {
    // Navigate to client portal with client credentials
    await page.goto(`${CLIENT_PORTAL_URL}/sign-in`);
    await page.fill('[name="emailAddress"]', TEST_CLIENT_EMAIL);
    await page.click('button:has-text("Continue")');
    await page.fill('[name="password"]', TEST_CLIENT_PASSWORD);
    await page.click('button:has-text("Sign in")');

    // Wait for portal dashboard
    await page.waitForSelector('[data-testid="client-dashboard"]', { timeout: 15000 });

    // Verify matter appears in client's matter list
    await page.waitForSelector('[data-testid="my-matters"]');
    const matterCards = await page.locator('[data-testid="matter-card"]').count();
    expect(matterCards).toBeGreaterThan(0);

    // Click into the matter
    await page.click('[data-testid="matter-card"]:first-child');
    await page.waitForSelector('[data-testid="matter-portal-detail"]');

    // Verify key information is visible
    const statusBadge = await page.textContent('[data-testid="matter-status-badge"]');
    expect(statusBadge).toBeTruthy();
  });
});
