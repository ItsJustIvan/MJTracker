test('Seat claims should sync across multiple devices in real-time', async ({ browser, baseURL }) => {
  const contextA = await browser.newContext();
  const contextB = await browser.newContext();
  const pageA = await contextA.newPage();
  const pageB = await contextB.newPage();

  await pageA.goto(`${baseURL}/table/sync-test`);
  await pageB.goto(`${baseURL}/table/sync-test`);

  // Player A claims Seat 0
  await pageA.locator('[data-testid="seat-card-0"] >> text=CLAIM').click();
  await pageA.locator('input').fill('PlayerAlpha');
  await pageA.click('text=JOIN');

  // Verify Player B sees the update via Supabase Realtime
  const seat0OnB = pageB.locator('[data-testid="seat-card-0"]');
  await expect(seat0OnB).toContainText('PlayerAlpha', { timeout: 10000 });
  await expect(seat0OnB.getByRole('button', { name: /claim/i })).toBeHidden();
});