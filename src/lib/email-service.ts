import { Resend } from "resend";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM || "Civion <onboarding@resend.dev>";

let resendClient: Resend | null = null;

if (RESEND_API_KEY) {
  resendClient = new Resend(RESEND_API_KEY);
}

export interface SendOtpEmailParams {
  to: string;
  otpCode: string;
}

/**
 * Sends a Civion verification code email.
 */
export async function sendVerificationEmail({
  to,
  otpCode,
}: SendOtpEmailParams): Promise<{ success: boolean; messageId?: string; error?: string }> {
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

  // Production or configured Resend Client
  if (resendClient) {
    try {
      const response = await resendClient.emails.send({
        from: EMAIL_FROM,
        to,
        subject,
        text: textContent,
        html: htmlContent,
      });

      if (response.error) {
        console.error("[EmailService Error]", response.error);
        return {
          success: false,
          error: "Failed to deliver verification email. Please verify your address.",
        };
      }

      return {
        success: true,
        messageId: response.data?.id,
      };
    } catch (err: any) {
      console.error("[EmailService Exception]", err?.message || err);
      return {
        success: false,
        error: "Email delivery service unavailable. Please try again later.",
      };
    }
  }

  // Development Fallback: If RESEND_API_KEY is not set yet in local development
  if (process.env.NODE_ENV !== "production") {
    console.log("==================================================");
    console.log(`📧 [DEV EMAIL OTP DISPATCH] To: ${to}`);
    console.log(`🔑 Verification Code: [ ${otpCode} ] (Expires in 5 minutes)`);
    console.log("==================================================");
    return {
      success: true,
      messageId: `dev-mock-${Date.now()}`,
    };
  }

  return {
    success: false,
    error: "Email service is not configured on the server. Please contact administrator.",
  };
}
