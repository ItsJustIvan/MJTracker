import { test, expect } from '@playwright/test';

test.describe('Identity & Persistence', () => {
  
  test('Guest should remain seated after a page refresh', async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/table/YOUR_TEST_ID`); // Replace with a valid test session

    // 1. Claim a seat as a Guest
    const firstSeat = page.locator('[data-testid="seat-card-0"]');
    await firstSeat.getByRole('button', { name: /claim/i }).click();
    
    await page.locator('input[placeholder*="name"]').fill('PersistenceBot');
    await page.getByRole('button', { name: /join/i }).click();

    // 2. Verify UI updates: Claim button should disappear
    await expect(firstSeat.getByText('PersistenceBot')).toBeVisible();
    await expect(firstSeat.getByRole('button', { name: /claim/i })).toBeHidden();

    // 3. REFRESH THE PAGE
    await page.reload();

    // 4. Verification: The app should re-identify the user from localStorage
    // This tests that your GameTableView logic finds the match again
    await expect(firstSeat.getByText('PersistenceBot')).toBeVisible();
    
    // Open Settings to confirm the bridge is still active
    await page.getByRole('button', { name: /☰/ }).click();
    await expect(page.getByText(/Occupying Seat 1/i)).toBeVisible();
  });

  test('Spectators (unseated) should see "Spectator Mode" in settings', async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/table/YOUR_TEST_ID`);
    
    await page.getByRole('button', { name: /☰/ }).click();
    await expect(page.getByText(/Spectator Mode/i)).toBeVisible();
    // Verify the input for name change is hidden/disabled for spectators
    await expect(page.locator('input[placeholder="Who are you?"]')).toBeHidden();
  });
});