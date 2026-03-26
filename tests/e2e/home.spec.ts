import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load the page successfully', async ({ page }) => {
    await expect(page).toHaveURL('/');
  });

  test('should display the Askly title', async ({ page }) => {
    const heading = page.locator('h1');
    await expect(heading).toBeVisible();
    await expect(heading).toHaveText('Askly');
  });

  test('should display the session creation form', async ({ page }) => {
    // Check for "새 세션 만들기" heading
    const createHeading = page.getByText('새 세션 만들기');
    await expect(createHeading).toBeVisible();

    // Check for title input
    const titleInput = page.getByPlaceholder('예: 2024 개발자 컨퍼런스 Q&A');
    await expect(titleInput).toBeVisible();

    // Check for nickname input
    const nicknameInput = page.getByPlaceholder('관리자 닉네임');
    await expect(nicknameInput).toBeVisible();

    // Check for submit button
    const submitButton = page.getByRole('button', { name: '세션 생성' });
    await expect(submitButton).toBeVisible();
  });

  test('should display the session code input area', async ({ page }) => {
    // Check for "세션 참여하기" heading
    const joinHeading = page.getByText('세션 참여하기');
    await expect(joinHeading).toBeVisible();

    // Check for code input
    const codeInput = page.getByPlaceholder('예: ABC123');
    await expect(codeInput).toBeVisible();

    // Check for join button
    const joinButton = page.getByRole('button', { name: '참여하기' });
    await expect(joinButton).toBeVisible();
  });
});
