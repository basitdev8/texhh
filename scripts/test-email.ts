import { sendEmail } from '../src/lib/email';

const recipient = process.env.RESEND_TEST_TO || process.env.RESEND_ORDER_NOTIFICATION_EMAIL || '';

if (!recipient) {
  throw new Error('Set RESEND_TEST_TO (or RESEND_ORDER_NOTIFICATION_EMAIL) in .env before sending a test email.');
}

async function main() {
  const sent = await sendEmail({
    to: recipient,
    subject: 'TechChasers email setup test',
    text: 'Resend is connected. Transactional emails are ready to send.',
    html: '<p>Resend is connected. Transactional emails are ready to send.</p>',
    idempotencyKey: `email-setup-test/${new Date().toISOString().slice(0, 10)}/${recipient}`,
    tags: [{ name: 'category', value: 'setup_test' }],
  });

  if (!sent) {
    process.exitCode = 1;
    console.error('Test email was not accepted. Check RESEND_API_KEY, RESEND_FROM, and your verified Resend domain.');
  } else {
    console.log(`Test email accepted for delivery: ${recipient}`);
  }
}

void main();
