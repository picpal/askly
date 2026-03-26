import { test, expect } from '@playwright/test';

test.describe('Responsive Layout', () => {
  test('should display correctly on mobile viewport (360px)', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 360, height: 740 },
    });
    const page = await context.newPage();
    await page.goto('/');

    // Main heading should be visible
    const heading = page.locator('h1');
    await expect(heading).toBeVisible();
    await expect(heading).toHaveText('Askly');

    // Both sections should be visible (stacked vertically on mobile)
    const createSection = page.getByText('새 세션 만들기');
    const joinSection = page.getByText('세션 참여하기');
    await expect(createSection).toBeVisible();
    await expect(joinSection).toBeVisible();

    // On mobile, the grid should stack — create section should be above join section
    const createBox = await createSection.boundingBox();
    const joinBox = await joinSection.boundingBox();
    expect(createBox).toBeTruthy();
    expect(joinBox).toBeTruthy();
    if (createBox && joinBox) {
      expect(createBox.y).toBeLessThan(joinBox.y);
    }

    await context.close();
  });

  test('should display correctly on desktop viewport (1440px)', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
    });
    const page = await context.newPage();
    await page.goto('/');

    // Main heading should be visible
    const heading = page.locator('h1');
    await expect(heading).toBeVisible();
    await expect(heading).toHaveText('Askly');

    // Both sections should be visible
    const createSection = page.getByText('새 세션 만들기');
    const joinSection = page.getByText('세션 참여하기');
    await expect(createSection).toBeVisible();
    await expect(joinSection).toBeVisible();

    // On desktop, the grid should be side-by-side (same y position approximately)
    const createBox = await createSection.boundingBox();
    const joinBox = await joinSection.boundingBox();
    expect(createBox).toBeTruthy();
    expect(joinBox).toBeTruthy();
    if (createBox && joinBox) {
      // They should be roughly at the same vertical position (within 50px tolerance)
      expect(Math.abs(createBox.y - joinBox.y)).toBeLessThan(50);
      // Join section should be to the right
      expect(joinBox.x).toBeGreaterThan(createBox.x);
    }

    await context.close();
  });
});
