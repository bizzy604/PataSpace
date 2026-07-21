/**
 * Purpose: HTML/text email template for email verification.
 * Why important: Mail content should be consistent, branded, and easy to adapt
 *   without scattering inline HTML around the app.
 * Used by: EmailVerificationController.
 */
export function buildEmailVerificationEmail(link: string, code: string) {
  const subject = 'Verify your PataSpace email';
  const text = `Verify your PataSpace email with this code: ${code}. Or open this link: ${link}. Both expire in 10 minutes.`;
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111827;">
      <h2 style="margin-bottom: 8px;">Verify your email</h2>
      <p>Use the code below or click the button to confirm your PataSpace email address.</p>
      <div style="display: inline-block; padding: 12px 16px; margin: 12px 0; border-radius: 8px; background: #f3f4f6; font-size: 32px; font-weight: bold; letter-spacing: 0.2em;">${code}</div>
      <p><a href="${link}" style="display: inline-block; padding: 10px 14px; border-radius: 8px; background: #2563eb; color: #ffffff; text-decoration: none;">Verify email</a></p>
      <p>If you did not request this, you can safely ignore this email.</p>
    </div>
  `;

  return { subject, text, html };
}
