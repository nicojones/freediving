import { APP_NAME } from '@/src/constants/app';
import { BrevoClient } from '@getbrevo/brevo';

const apiKey = process.env.BREVO_API_KEY;
const brevo = apiKey ? new BrevoClient({ apiKey }) : null;

export const send = async (msg: {
  to: string;
  from: string;
  subject: string;
  html: string;
}): Promise<void> => {
  if (!brevo) {
    throw new Error('BREVO_API_KEY is not configured');
  }
  await brevo.transactionalEmails.sendTransacEmail({
    sender: { email: msg.from, name: APP_NAME },
    to: [{ email: msg.to }],
    subject: msg.subject,
    htmlContent: msg.html,
  });
};
