/**
 * Purpose: HTML/text email templates for auth-related notifications.
 * Why important: Mail content should be consistent, branded, and easy to adapt
 *   for different flows without scattering inline HTML around the app.
 * Used by: PasswordRecoveryService and future auth email flows.
 */
export function buildPasswordResetEmail(otp: string) {
  const subject = 'Reset your PataSpace password';
  const text = `Use the following one-time code to reset your password: ${otp}. This code expires soon.`;
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111827;">
      <h2 style="margin-bottom: 8px;">Reset your password</h2>
      <p>We received a request to reset the password for your PataSpace account.</p>
      <p>Use the following one-time code to continue:</p>
      <div style="display: inline-block; padding: 12px 16px; margin: 12px 0; border-radius: 8px; background: #f3f4f6; font-size: 24px; font-weight: bold; letter-spacing: 0.2em;">${otp}</div>
      <p>If you did not request this, you can safely ignore this email.</p>
    </div>
  `;

  return { subject, text, html };
}

export function buildMagicLinkEmail(link: string) {
  const subject = 'Sign in to PataSpace';
  const text = `Use the following link to sign in to PataSpace: ${link}`;
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111827;">
      <h2 style="margin-bottom: 8px;">Magic sign-in link</h2>
      <p>Use the link below to sign in securely to PataSpace.</p>
      <p><a href="${link}" style="display: inline-block; padding: 10px 14px; border-radius: 8px; background: #2563eb; color: #ffffff; text-decoration: none;">Sign in</a></p>
      <p>If you did not request this, you can ignore this email.</p>
    </div>
  `;

  return { subject, text, html };
}
