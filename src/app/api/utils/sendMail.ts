import nodemailer from "nodemailer";

const FROM = process.env.EMAIL_FROM || process.env.EMAIL_USER || "shri@shrisawariyamart.com";

const host = process.env.EMAIL_SMTP_HOST || "smtpout.secureserver.net";
const port = Number(process.env.EMAIL_SMTP_PORT || 465);
const useSecure = port === 465;

// Create transporter (supports both 465 and 587)
const transporter = nodemailer.createTransport({
  host,
  port,
  secure: useSecure, // true for 465, false for 587 (STARTTLS)
  requireTLS: !useSecure, // require TLS for non-SSL ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  logger: true,
  debug: true,
  tls: {
    // do not fail on invalid certs (useful for some setups) - remove in strict production
    rejectUnauthorized: false,
  },
});

// Optional: test connection at startup (will log detailed SMTP handshake)
transporter.verify()
  .then(() => console.log("SMTP connected successfully"))
  .catch(err => console.error("SMTP connection error:", err));

export async function sendMail(to: string, subject: string, html: string) {
  return transporter.sendMail({
    from: FROM,
    to,
    subject,
    html,
  });
}

export function otpEmailTemplate({ name, otp, purpose = "verification" }: { name?: string; otp: string; purpose?: string }) {
  const logoUrl = process.env.EMAIL_LOGO_URL || "https://www.shrisawariyamart.com/logo/logo.png";

  return `
  <div style="font-family: Arial, sans-serif; background:#f6f9fc; padding:40px;">
    <div style="max-width:480px; margin:0 auto; background:white; border-radius:12px; padding:30px; box-shadow:0 4px 12px rgba(0,0,0,0.08);">
      <div style="text-align:center;">
        <img src="${logoUrl}" alt="Logo" style="width:100px; margin-bottom:10px;" />
      </div>

      <h2 style="text-align:center; color:#333; margin-top:0;">OTP Verification</h2>

      <p style="font-size:15px; color:#444;">Hi <strong>${name || "there"}</strong>,</p>

      <p style="font-size:15px; color:#444;">Your OTP for <strong>${purpose}</strong> is:</p>

      <div style="margin:20px 0; text-align:center;">
        <span style="display:inline-block; font-size:32px; letter-spacing:6px; padding:12px 24px; background:#f1f3f5; border-radius:10px;">
          ${otp}
        </span>
      </div>

      <p style="color:#666; font-size:14px;">This OTP will expire in 24 hours. If you didn’t request this, please ignore the email.</p>

      <hr style="border:none; border-top:1px solid #eee; margin:25px 0;" />

      <p style="text-align:center; color:#999; font-size:12px;">© ${new Date().getFullYear()} Shri Sawariya Mart • All Rights Reserved</p>
    </div>
  </div>
  `;
}

export function welcomeEmailTemplate({ name }: { name?: string }) {
  const logoUrl = process.env.EMAIL_LOGO_URL || "https://www.shrisawariyamart.com/logo/logo.png";

  return `
  <div style="font-family: Arial, sans-serif; background:#f6f9fc; padding:40px;">
    <div style="max-width:480px; margin:0 auto; background:white; border-radius:12px; padding:30px; box-shadow:0 4px 12px rgba(0,0,0,0.08);">
      <div style="text-align:center;">
        <img src="${logoUrl}" alt="Logo" style="width:110px; margin-bottom:15px;" />
      </div>

      <h1 style="text-align:center; font-size:26px; color:#333; margin:0;">Welcome to Shri Sawariya Mart!</h1>

      <p style="font-size:15px; color:#444; margin-top:20px;">Hi <strong>${name || "friend"}</strong>,</p>

      <p style="font-size:15px; color:#444; line-height:1.6;">
        We're excited to have you with us. Your account has been successfully created, and you’re now ready to explore our services.
      </p>

      <div style="text-align:center; margin-top:25px;">
        <a href="https://www.shrisawariyamart.com" style="background:#ff6b00; color:white; padding:12px 22px; border-radius:8px; text-decoration:none; font-size:15px;">
          Visit Dashboard
        </a>
      </div>

      <hr style="border:none; border-top:1px solid #eee; margin:30px 0;" />

      <p style="text-align:center; color:#999; font-size:12px;">© ${new Date().getFullYear()} Shri Sawariya Mart • All Rights Reserved</p>
    </div>
  </div>
  `;
}
