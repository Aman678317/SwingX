import { Resend } from 'resend';
import { WelcomeEmail } from '@/emails/WelcomeEmail';
import { DrawResultEmail } from '@/emails/DrawResultEmail';
import { WinnerApprovedEmail } from '@/emails/WinnerApprovedEmail';

const resend = new Resend(process.env.RESEND_API_KEY || 're_placeholder');
const fromEmail = 'Golf Charity Draw <noreply@golfcharityplatform.com>';

export async function sendWelcomeEmail(to: string, name: string) {
  if (!process.env.RESEND_API_KEY) return;
  try {
    await resend.emails.send({
      from: fromEmail,
      to,
      subject: 'Welcome to Golf Charity Draw!',
      react: WelcomeEmail({ name }),
    });
  } catch (error) {
    console.error('Failed to send welcome email', error);
  }
}

export async function sendDrawResultEmail(to: string, name: string, matchCount: number, prizeAmount: number) {
  if (!process.env.RESEND_API_KEY) return;
  try {
    await resend.emails.send({
      from: fromEmail,
      to,
      subject: 'You Won the Golf Charity Draw!',
      react: DrawResultEmail({ name, matchCount, prizeAmount }),
    });
  } catch (error) {
    console.error('Failed to send draw result email', error);
  }
}

export async function sendWinnerApprovedEmail(to: string, name: string, amount: number) {
  if (!process.env.RESEND_API_KEY) return;
  try {
    await resend.emails.send({
      from: fromEmail,
      to,
      subject: 'Prize Verification Approved',
      react: WinnerApprovedEmail({ name, amount }),
    });
  } catch (error) {
    console.error('Failed to send winner approved email', error);
  }
}

export async function sendSubscriptionRenewalEmail(to: string, name: string, renewalDate: string) {
  if (!process.env.RESEND_API_KEY) return;
  try {
    // We could create a react component for this, but standard HTML works for simplicity here
    await resend.emails.send({
      from: fromEmail,
      to,
      subject: 'Upcoming Subscription Renewal',
      html: `<p>Hi ${name},</p><p>Your subscription is set to renew on ${new Date(renewalDate).toLocaleDateString()}. Thank you for your continued support!</p>`,
    });
  } catch (error) {
    console.error('Failed to send renewal email', error);
  }
}
