/**
 * E2E tests: Create plan via JSON paste, file upload, and manual typing.
 * Verifies plan creation, switching to the new plan, and Training tab shows it.
 * AI voice tests are separate.
 */
import { test, expect } from '@playwright/test'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { loginAsNico } from './helpers/login'

const __dirname = dirname(fileURLToPath(import.meta.url))

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
}

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
}

async function goToPlansAndCreatePlanSection(page: import('@playwright/test').Page) {
  await page.getByRole('button', { name: /plans/i }).click()
  await page.waitForURL(/\/plans/)
  await expect(page.getByTestId('create-plan-json-textarea')).toBeVisible({ timeout: 5000 })
}

async function createPlanAndVerify(
  page: import('@playwright/test').Page,
  planName: string,
  switchAndVerifyTraining: boolean
) {
  await page.getByTestId('create-plan-create-button').click()
  await expect(page.getByTestId('create-plan-success')).toBeVisible({ timeout: 5000 })

  const planSelector = page.getByTestId('plan-selector')
  await expect(planSelector.locator(`option:has-text("${planName}")`)).toHaveCount(1)

  if (switchAndVerifyTraining) {
    await planSelector.selectOption({ label: planName })
    await page.getByTestId('confirm-reset-input').fill('reset')
    await page.getByTestId('confirm-reset-confirm').click()
    await expect(page.getByTestId('confirm-reset-input')).not.toBeVisible()

    await page.getByRole('button', { name: /training/i }).click()
    await page.waitForURL(/\/(?!plans|settings)/)
    await expect(page.getByTestId('plan-name')).toHaveText(planName, { timeout: 5000 })
    await expect(page.getByTestId('dashboard-day-list')).toBeVisible({ timeout: 5000 })
  }
}

test.describe('Create plan', () => {
  test('paste JSON, create plan, switch to it, verify Training tab', async ({
    page,
    context,
  }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await loginAsNico(page)
    await goToPlansAndCreatePlanSection(page)

    const jsonStr = JSON.stringify(PASTE_PLAN, null, 2)
    await page.evaluate(async (json) => {
      await navigator.clipboard.writeText(json)
    }, jsonStr)
    await page.getByTestId('create-plan-paste-button').click()
    await expect(page.getByTestId('create-plan-json-textarea')).toContainText(
      'e2e-paste-plan',
      { timeout: 5000 }
    )

    await createPlanAndVerify(page, 'E2E Paste Plan', true)
  })

  test('upload JSON file, create plan, switch to it, verify Training tab', async ({
    page,
  }) => {
    await loginAsNico(page)
    await goToPlansAndCreatePlanSection(page)

    const fixturePath = join(__dirname, 'fixtures', 'e2e-upload-plan.json')
    await page.getByTestId('create-plan-file-input').setInputFiles(fixturePath)
    await expect(page.getByTestId('create-plan-json-textarea')).toContainText(
      'e2e-upload-plan',
      { timeout: 3000 }
    )

    await createPlanAndVerify(page, 'E2E Upload Plan', true)
  })

  test('type JSON manually, create plan, switch to it, verify Training tab', async ({
    page,
  }) => {
    await loginAsNico(page)
    await goToPlansAndCreatePlanSection(page)

    const jsonText = JSON.stringify(TYPE_PLAN, null, 2)
    await page.getByTestId('create-plan-json-textarea').fill(jsonText)

    await createPlanAndVerify(page, 'E2E Type Plan', true)
  })
})
