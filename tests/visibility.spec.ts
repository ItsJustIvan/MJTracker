import { test, expect } from '@playwright/test';

test('Seat UI should toggle between Claim and Scoring modes', async ({ page, baseURL }) => {
  await page.goto(`${baseURL}/table/test-table`);

  const seat0 = page.locator('[data-testid="seat-card-0"]');
  const claimBtn = seat0.getByRole('button', { name: /claim/i });

  // 1. Initially, Claim button is visible
  await expect(claimBtn).toBeVisible();

  // 2. Claim the seat
  await claimBtn.click();
  await page.locator('input').fill('VisibilityBot');
  await page.getByRole('button', { name: /join/i }).click();

  // 3. Post-Claim: Button must vanish, Card should be clickable for scoring
  await expect(claimBtn).toBeHidden();
  
  // Clicking the card body should now trigger the Scoring Drawer
  await seat0.click(); 
  await expect(page.locator('text=SCORING')).toBeVisible();
});