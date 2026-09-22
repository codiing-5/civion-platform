import nodemailer from "nodemailer";

export interface SendOtpEmailParams {
  to: string;
  otpCode: string;
}

/**
 * Safely masks an email address for diagnostic logging (e.g. j***e@gmail.com).
 * Never exposes the full email or any sensitive tokens.
 */
function maskEmail(email: string): string {
  if (!email || typeof email !== "string" || !email.includes("@")) {
    return "***@***";
  }
  const [localPart, domain] = email.split("@");
  if (localPart.length <= 2) {
    return `${localPart[0] || "*"}***@${domain}`;
  }
  return `${localPart.slice(0, 2)}***${localPart.slice(-1)}@${domain}`;
}

/**
 * Creates a Nodemailer transporter configured for Gmail SMTP.
 * Host: smtp.gmail.com
 * Port: 465
 * Secure: true
 * Auth: GMAIL_USER and GMAIL_APP_PASSWORD
 */
function createGmailTransporter(user: string, pass: string) {
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user,
      pass,
    },
  });
}

/**
 * Sends a Civion verification code email via Gmail SMTP.
 * Strictly awaits transporter.sendMail and returns actual delivery status.
 */
export async function sendVerificationEmail({
  to,
  otpCode,
}: SendOtpEmailParams): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const maskedRecipient = maskEmail(to);
  console.log(`[OTP Service] OTP send started for recipient: ${maskedRecipient}`);

  const gmailUser = process.env.GMAIL_USER?.trim();
  const rawPass = process.env.GMAIL_APP_PASSWORD?.trim();
  const gmailPass = rawPass ? rawPass.replace(/\s+/g, "") : undefined;

  if (!gmailUser || !gmailPass) {
    console.error(
      `[OTP Service] SMTP send aborted: Missing required Gmail SMTP environment variables (GMAIL_USER is ${
        gmailUser ? "set" : "missing"
      }, GMAIL_APP_PASSWORD is ${gmailPass ? "set" : "missing"}).`
    );
    return {
      success: false,
      error: "Email delivery service is unconfigured. GMAIL_USER and GMAIL_APP_PASSWORD environment variables are required.",
    };
  }

  const transporter = createGmailTransporter(gmailUser, gmailPass);

  const subject = "Your Civion verification code";

  const textContent = `Civion
Verify your email address

Your verification code:
${otpCode}

This code expires in 5 minutes.
If you did not request this code, you can safely ignore this email.`;

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Civion Verification Code</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 32px 16px;">
  <div style="max-width: 480px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
    <div style="margin-bottom: 24px; text-align: center;">
      <h1 style="color: #2563eb; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">Civion</h1>
      <p style="color: #64748b; font-size: 14px; margin-top: 4px; margin-bottom: 0;">Civic Issue Reporting & Ward Management</p>
    </div>

    <div style="border-top: 1px solid #f1f5f9; padding-top: 24px; text-align: left;">
      <h2 style="font-size: 18px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 12px;">Verify your email address</h2>
      <p style="font-size: 14px; color: #334155; line-height: 1.6; margin-bottom: 24px;">
        Use the following 6-digit verification code to sign in to your Civion account:
      </p>

      <div style="background-color: #f1f5f9; border-radius: 12px; padding: 18px; text-align: center; margin-bottom: 24px; letter-spacing: 6px; font-size: 32px; font-weight: 800; color: #1e293b; font-family: monospace;">
        ${otpCode}
      </div>

      <p style="font-size: 13px; color: #64748b; line-height: 1.5; margin-bottom: 8px;">
        ⏱️ <strong>This code expires in 5 minutes.</strong>
      </p>
      <p style="font-size: 13px; color: #94a3b8; line-height: 1.5; margin-bottom: 0;">
        If you did not request this code, you can safely ignore this email.
      </p>
    </div>

    <div style="border-top: 1px solid #f1f5f9; margin-top: 32px; padding-top: 16px; text-align: center;">
      <p style="font-size: 12px; color: #94a3b8; margin: 0;">
        © 2026 Civion Platform. Protected municipal communication.
      </p>
    </div>
  </div>
</body>
</html>
  `;

  try {
    const maskedSender = maskEmail(gmailUser);
    console.log(`[OTP Service] SMTP send attempted via smtp.gmail.com:465 (secure=true, sender=${maskedSender})`);

    const info = await transporter.sendMail({
      from: `"Civion" <${gmailUser}>`,
      to,
      subject,
      text: textContent,
      html: htmlContent,
    });

    console.log(`[OTP Service] SMTP send successful. Message ID: ${info.messageId}`);

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (err: any) {
    const errorCode = err?.code || "UNKNOWN";
    const errorMessage = err?.message || "Unknown error";
    console.error(`[OTP Service] SMTP error: code=${errorCode}, message=${errorMessage}`);

    return {
      success: false,
      error: `Failed to deliver verification email (${errorCode}: ${errorMessage})`,
    };
  }
}
