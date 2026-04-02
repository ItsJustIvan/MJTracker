test('Guest ID should persist identity through page reloads', async ({ page, baseURL }) => {
  await page.goto(`${baseURL}/table/test-table`);

  // 1. Join as Guest
  await page.locator('[data-testid="seat-card-1"] >> text=CLAIM').click();
  await page.locator('input').fill('StickyBot');
  await page.click('text=JOIN');

  // 2. Refresh the browser
  await page.reload();

  // 3. The app should automatically find the matchingSeat from localStorage
  const seat1 = page.locator('[data-testid="seat-card-1"]');
  await expect(seat1).toContainText('StickyBot');
  
  // 4. Verify Settings Drawer still identifies the user
  await page.locator('button:has-text("☰")').click();
  await expect(page.locator('text=Occupying Seat 2')).toBeVisible();
});