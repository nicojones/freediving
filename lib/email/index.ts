import { readFileSync } from 'fs';
import { join } from 'path';
import { send } from './brevo';

const APP_NAME = 'Fishly';
const FROM_EMAIL = process.env.BREVO_FROM_EMAIL || 'no-reply-fishly@kupfer.es';

const templatePath = join(process.cwd(), 'lib/email/templates/magic-link.hbs');
const templateSource = readFileSync(templatePath, 'utf-8');

function renderMagicLink(magicLinkUrl: string, appName: string): string {
  return templateSource
    .replace(/\{\{magicLinkUrl\}\}/g, magicLinkUrl)
    .replace(/\{\{appName\}\}/g, appName);
}

let lastMagicLinkUrl: string | null = null;

export function getLastMagicLinkUrlForTest(): string | null {
  return lastMagicLinkUrl;
}

export function clearLastMagicLinkUrlForTest(): void {
  lastMagicLinkUrl = null;
}

export async function sendMagicLink(to: string, magicLinkUrl: string): Promise<void> {
  const skipBrevo = process.env.NODE_ENV === 'test' && !process.env.BREVO_API_KEY;
  const devBypass = process.env.NODE_ENV === 'development' && process.env.SKIP_BREVO_DEV === 'true';

  if (skipBrevo || devBypass) {
    lastMagicLinkUrl = magicLinkUrl;
    if (devBypass) {
      console.log('[dev] Magic link (Brevo bypass):', magicLinkUrl);
    }
    return;
  }
  const html = renderMagicLink(magicLinkUrl, APP_NAME);
  await send({
    to,
    from: FROM_EMAIL,
    subject: `Sign in to ${APP_NAME}`,
    html,
  });
}
