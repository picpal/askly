import { test, expect } from '@playwright/test';

test.describe('Session Creation Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should fill in session creation form fields', async ({ page }) => {
    const titleInput = page.getByPlaceholder('예: 2024 개발자 컨퍼런스 Q&A');
    const nicknameInput = page.getByPlaceholder('관리자 닉네임');

    // Fill in fields
    await titleInput.fill('테스트 세션');
    await nicknameInput.fill('테스트 관리자');

    // Verify values
    await expect(titleInput).toHaveValue('테스트 세션');
    await expect(nicknameInput).toHaveValue('테스트 관리자');
  });

  test('should show error when submitting with empty title', async ({ page }) => {
    const nicknameInput = page.getByPlaceholder('관리자 닉네임');
    await nicknameInput.fill('테스트 관리자');

    const submitButton = page.getByRole('button', { name: '세션 생성' });
    await submitButton.click();

    // Expect validation error for empty title
    const errorMessage = page.getByText('세션 제목을 입력해주세요.');
    await expect(errorMessage).toBeVisible();
  });

  test('should show error when submitting with empty nickname', async ({ page }) => {
    const titleInput = page.getByPlaceholder('예: 2024 개발자 컨퍼런스 Q&A');
    await titleInput.fill('테스트 세션');

    const submitButton = page.getByRole('button', { name: '세션 생성' });
    await submitButton.click();

    // Expect validation error for empty nickname
    const errorMessage = page.getByText('닉네임을 입력해주세요.');
    await expect(errorMessage).toBeVisible();
  });

  test('should validate session code input on join form', async ({ page }) => {
    const joinButton = page.getByRole('button', { name: '참여하기' });
    await joinButton.click();

    // Expect validation error for empty code
    const errorMessage = page.getByText('세션 코드를 입력해주세요.');
    await expect(errorMessage).toBeVisible();
  });

  test('should convert session code to uppercase', async ({ page }) => {
    const codeInput = page.getByPlaceholder('예: ABC123');
    await codeInput.fill('abc123');

    await expect(codeInput).toHaveValue('ABC123');
  });

  test('should validate session code length', async ({ page }) => {
    const codeInput = page.getByPlaceholder('예: ABC123');
    await codeInput.fill('ABC');

    const joinButton = page.getByRole('button', { name: '참여하기' });
    await joinButton.click();

    const errorMessage = page.getByText('6자리 코드를 입력해주세요.');
    await expect(errorMessage).toBeVisible();
  });
});
