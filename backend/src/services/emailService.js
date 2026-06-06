import nodemailer from "nodemailer";

// Build a transporter from environment variables.
// Returns null in development when SMTP is not configured — callers must
// handle the null case and fall back to console logging.
const createTransporter = () => {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) return null;

  return nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
    auth: { user, pass }
  });
};

const FROM = (name = "BuildOra") => `"${name}" <${process.env.SMTP_FROM || process.env.SMTP_USER || "noreply@buildora.com"}>`;

// Shared email shell — branded header + footer.
const wrapEmail = (content) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>BuildOra</title>
</head>
<body style="margin:0;padding:0;background:#FAF7F5;font-family:Inter,'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF7F5;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(26,19,15,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#ED4426 0%,#D62D14 55%,#B01F0C 100%);padding:32px 40px;text-align:center;">
              <h1 style="margin:0;font-size:28px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">BuildOra</h1>
              <p style="margin:4px 0 0;font-size:13px;color:rgba(255,255,255,0.75);">India's Construction Marketplace</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#FAF7F5;padding:24px 40px;text-align:center;border-top:1px solid #E8E0DA;">
              <p style="margin:0;font-size:12px;color:#8A7C73;">
                &copy; ${new Date().getFullYear()} BuildOra. All rights reserved.<br/>
                If you didn't request this email, you can safely ignore it.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

/**
 * Send the password-reset email.
 * In development (no SMTP config) the link is printed to stdout instead.
 */
export const sendPasswordResetEmail = async ({ to, name, resetUrl }) => {
  const content = `
    <h2 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#1A130F;">Reset your password</h2>
    <p style="margin:0 0 24px;font-size:15px;color:#5E534C;line-height:1.6;">
      Hi ${name || "there"},<br/><br/>
      We received a request to reset the password for your BuildOra account.
      Click the button below to set a new password. This link expires in <strong>15 minutes</strong>.
    </p>

    <div style="text-align:center;margin:32px 0;">
      <a href="${resetUrl}"
         style="display:inline-block;background:linear-gradient(135deg,#ED4426,#D62D14);color:#ffffff;
                text-decoration:none;font-size:15px;font-weight:700;padding:14px 36px;
                border-radius:12px;letter-spacing:0.2px;">
        Reset Password
      </a>
    </div>

    <p style="margin:24px 0 0;font-size:13px;color:#8A7C73;line-height:1.6;">
      Or copy and paste this link into your browser:<br/>
      <a href="${resetUrl}" style="color:#D62D14;word-break:break-all;">${resetUrl}</a>
    </p>

    <div style="margin:32px 0 0;padding:16px;background:#FFF4F1;border-radius:10px;border:1px solid #FFC7BA;">
      <p style="margin:0;font-size:13px;color:#B01F0C;font-weight:600;">
        ⚠️ This link expires in 15 minutes. If it expires, request a new one from the login page.
      </p>
    </div>

    <p style="margin:24px 0 0;font-size:13px;color:#8A7C73;">
      If you didn't request a password reset, please ignore this email. Your account is safe.
    </p>
  `;

  const transporter = createTransporter();

  if (!transporter) {
    // Development fallback — log to stdout so the dev can click the link
    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("[BuildOra Email — DEV MODE (SMTP not configured)]");
    console.log(`To:      ${to}`);
    console.log(`Subject: Reset your BuildOra password`);
    console.log(`Link:    ${resetUrl}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    return { dev: true, resetUrl };
  }

  return transporter.sendMail({
    from: FROM(),
    to,
    subject: "Reset your BuildOra password",
    html: wrapEmail(content)
  });
};
