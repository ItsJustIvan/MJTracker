import { test, expect } from '@playwright/test';

// This is where you put the serial configuration
test.describe.configure({ mode: 'serial' });

test('should allow a guest to join a seat', async ({ page, baseURL }) => {
  await page.goto(`${baseURL}/`); 

  // 1. Identify all claim buttons
  const claimButtons = page.getByRole('button', { name: /claim/i });
  const initialCount = await claimButtons.count();
  
  // 2. Click the first one
  await claimButtons.first().click();

  // 3. Handle Modal
  await page.locator('input').fill('TestBot');
  await page.getByRole('button', { name: /join/i }).click();

  // 4. Verification: Wait for the name to appear before checking the count
  // This ensures Supabase Realtime has finished syncing
  await expect(page.getByText('TestBot')).toBeVisible({ timeout: 10000 });

  // 5. Final Check
  const finalCount = await claimButtons.count();
  expect(finalCount).toBe(initialCount - 1);
});