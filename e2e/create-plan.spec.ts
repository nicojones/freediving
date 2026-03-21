/**
 * E2E tests: Create plan via JSON paste, file upload, manual typing, Describe (AI text), and voice.
 * Verifies plan creation, switching to the new plan, and Training tab shows it.
 */
import { test, expect } from '@playwright/test';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';
import { loginAsNico, loginAsAthena } from './helpers/login';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** 14-day plan fixture matching e2e/fixtures/1:30 to 2:00 14-day plan.m4a description */
const VOICE_14DAY_PLAN = JSON.parse(
  readFileSync(join(__dirname, 'fixtures', '1-30-to-2-00-14-day-plan.json'), 'utf-8')
);

const PASTE_PLAN = {
  id: 'e2e-paste-plan',
  name: 'E2E Paste Plan',
  description: 'Plan created via paste',
  days: [
    {
      id: 'e2epst1',
      day: 1,
      phases: [
        { type: 'hold' as const, duration: 6 },
        { type: 'recovery' as const, duration: 12 },
      ],
    },
  ],
};

const TYPE_PLAN = {
  id: 'e2e-type-plan',
  name: 'E2E Type Plan',
  description: 'Plan created via manual typing',
  days: [
    {
      id: 'e2etyp1',
      day: 1,
      phases: [
        { type: 'hold' as const, duration: 7 },
        { type: 'recovery' as const, duration: 14 },
      ],
    },
  ],
};

async function goToCreatePlanSection(page: import('@playwright/test').Page) {
  await page.getByTestId('nav-create').click();
  await page.waitForURL(/\/create/);
  await expect(page.getByTestId('create-plan-tab-describe')).toBeVisible({ timeout: 5000 });
}

async function switchToPasteTab(page: import('@playwright/test').Page) {
  await page.getByTestId('create-plan-tab-paste').click();
  await expect(page.getByTestId('create-plan-json-textarea')).toBeVisible({ timeout: 3000 });
}

async function verifyPlanCreation(
  page: import('@playwright/test').Page,
  planName: string,
  switchAndVerifyTraining: boolean
) {
  await expect(page.getByTestId('create-plan-success')).toBeVisible({ timeout: 5000 });

  const planSelector = page.getByTestId('plan-selector');

  if (switchAndVerifyTraining) {
    await page.getByTestId('nav-plans').click();
    await page.waitForURL(/\/plans/);
    await expect(planSelector).toBeVisible({ timeout: 5000 });
    await page.locator(`[data-plan-name="${planName}"]`).click();
    await page.getByTestId('confirm-switch-plan-confirm').click();
    await page.getByTestId('confirm-switch-plan-modal').waitFor({ state: 'detached' });

    await page.getByTestId('nav-training').click();
    await page.waitForURL(/\/(?!plans|settings)/);
    await expect(page.getByTestId('plan-name')).toHaveText(planName, { timeout: 5000 });
    await expect(page.getByTestId('dashboard-day-list')).toBeVisible({ timeout: 5000 });
  }
}

test.describe('Create plan', () => {
  test('paste JSON, create plan, switch to it, verify Training tab', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await loginAsNico(page);
    await goToCreatePlanSection(page);
    await switchToPasteTab(page);

    const jsonStr = JSON.stringify(PASTE_PLAN, null, 2);
    await page.evaluate(async (json) => {
      await navigator.clipboard.writeText(json);
    }, jsonStr);
    await page.getByTestId('create-plan-paste-button').click();
    await expect(page.getByTestId('create-plan-json-textarea')).toContainText('e2e-paste-plan', {
      timeout: 5000,
    });

    await page.getByTestId('create-plan-create-button').click();
    await verifyPlanCreation(page, 'E2E Paste Plan', true);
  });

  test('upload JSON file, create plan, switch to it, verify Training tab', async ({ page }) => {
    await loginAsAthena(page);
    await goToCreatePlanSection(page);
    await switchToPasteTab(page);

    const fixturePath = join(__dirname, 'fixtures', 'e2e-upload-plan.json');
    await page.getByTestId('create-plan-file-input').setInputFiles(fixturePath);
    await expect(page.getByTestId('create-plan-json-textarea')).toContainText('e2e-upload-plan', {
      timeout: 3000,
    });

    await page.getByTestId('create-plan-create-button').click();
    await verifyPlanCreation(page, 'E2E Upload Plan', true);
  });

  test('type JSON manually, create plan, switch to it, verify Training tab', async ({ page }) => {
    await loginAsAthena(page);
    await goToCreatePlanSection(page);
    await switchToPasteTab(page);

    const jsonText = JSON.stringify(TYPE_PLAN, null, 2);
    await page.getByTestId('create-plan-json-textarea').fill(jsonText);

    await page.getByTestId('create-plan-create-button').click();
    await verifyPlanCreation(page, 'E2E Type Plan', true);
  });

  test('Describe tab: free-form text, convert via AI, preview, confirm, create plan', async ({
    page,
  }) => {
    const TEXT_TO_PLAN = {
      id: 'e2e-text-plan',
      name: 'E2E Text Plan',
      description: 'Plan from free-form text',
      days: [
        {
          id: 'e2etxt1',
          day: 1,
          phases: [
            { type: 'hold' as const, duration: 120 },
            { type: 'recovery' as const, duration: 120 },
          ],
        },
      ],
    };

    // Set route before any navigation so it reliably intercepts the request
    await page.route('**/api/plans/transcribe-from-text', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(TEXT_TO_PLAN),
        });
      } else {
        await route.continue();
      }
    });

    await loginAsAthena(page);
    await goToCreatePlanSection(page);

    await expect(page.getByTestId('create-plan-describe-textarea')).toBeVisible({ timeout: 5000 });
    await page
      .getByTestId('create-plan-describe-textarea')
      .fill('3 days of holds, 2 min each, 2 min recovery');
    await expect(page.getByTestId('create-plan-create-draft-button')).toBeEnabled({
      timeout: 3000,
    });
    await page.getByTestId('create-plan-create-draft-button').click();

    // Wait for API response before asserting UI; reduces flakiness from async timing
    await page.waitForResponse(
      (res) => res.url().includes('transcribe-from-text') && res.status() === 200,
      { timeout: 10000 }
    );
    await expect(page.getByTestId('create-plan-preview')).toBeVisible({ timeout: 5000 });
    await page.getByTestId('create-plan-confirm-button').click();
    await expect(page.getByTestId('confirm-plan-name')).toBeVisible({ timeout: 5000 });
    await page.getByTestId('confirm-plan-submit').click();

    await verifyPlanCreation(page, 'E2E Text Plan', true);
  });

  test('Describe tab: voice create via mocked transcribe, preview, confirm, create plan', async ({
    page,
  }) => {
    // Stub getUserMedia and MediaRecorder so voice flow can run in CI (no real mic)
    await page.addInitScript(() => {
      const getFakeStream = () => {
        try {
          const Ctx =
            window.AudioContext ||
            (window as unknown as { webkitAudioContext: new () => AudioContext })
              .webkitAudioContext;
          return new Ctx().createMediaStreamDestination().stream;
        } catch {
          return new MediaStream();
        }
      };
      navigator.mediaDevices.getUserMedia = async () => getFakeStream();

      (window as unknown as { MediaRecorder: typeof MediaRecorder }).MediaRecorder = class FakeMR {
        ondataavailable: ((e: BlobEvent) => void) | null = null;
        onstop: (() => void) | null = null;
        _state: 'inactive' | 'recording' = 'inactive';
        constructor(_stream: MediaStream) {}
        start() {
          this._state = 'recording';
        }
        stop() {
          this._state = 'inactive';
          this.ondataavailable?.({ data: new Blob(['x'], { type: 'audio/webm' }) } as BlobEvent);
          this.onstop?.();
        }
        get state() {
          return this._state;
        }
      } as unknown as typeof MediaRecorder;
    });

    await page.route('**/api/plans/transcribe', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(VOICE_14DAY_PLAN),
        });
      } else {
        await route.continue();
      }
    });

    await loginAsAthena(page);
    await goToCreatePlanSection(page);

    await expect(page.getByTestId('create-plan-describe-textarea')).toBeVisible({ timeout: 5000 });
    const explainBtn = page.getByRole('button', { name: /explain with voice/i });
    await expect(explainBtn).toBeVisible({ timeout: 3000 });
    await explainBtn.click();
    await expect(page.getByRole('button', { name: /stop recording/i })).toBeVisible({
      timeout: 3000,
    });
    const transcribeResponse = page.waitForResponse(
      (res) => res.url().includes('/api/plans/transcribe') && res.status() === 200,
      { timeout: 15000 }
    );
    await page.getByRole('button', { name: /stop recording/i }).click();
    await transcribeResponse;
    await expect(page.getByTestId('create-plan-preview')).toBeVisible({ timeout: 10000 });
    await page.getByTestId('create-plan-confirm-button').click();
    await expect(page.getByTestId('confirm-plan-name')).toBeVisible({ timeout: 5000 });
    await page.getByTestId('confirm-plan-submit').click();

    await verifyPlanCreation(page, '1:30 to 2:00 14-Day Plan', true);
  });
});
