test('Only seated players or admins can access scoring', async ({ page, baseURL }) => {
  await page.goto(`${baseURL}/table/perm-test`);

  // 1. As a spectator (not seated), click a card
  await page.locator('[data-testid="seat-card-0"]').click();

  // 2. Assert: Drawer should NOT open, or should show a "ReadOnly" message
  // (Adjust this based on your preferred UI behavior)
  await expect(page.locator('text=SCORING')).toBeHidden();
  
  // 3. Now join a seat
  await page.locator('[data-testid="seat-card-3"] >> text=CLAIM').click();
  await page.locator('input').fill('AuthorizedBot');
  await page.click('text=JOIN');

  // 4. Try again
  await page.locator('[data-testid="seat-card-0"]').click();
  await expect(page.locator('text=SCORING')).toBeVisible();
});