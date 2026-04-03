import nodemailer from "nodemailer";

const FROM = process.env.EMAIL_FROM || process.env.EMAIL_USER || "shri@shrisawariyamart.com";

const host = process.env.EMAIL_SMTP_HOST || "smtpout.secureserver.net";
const port = Number(process.env.EMAIL_SMTP_PORT || 465);
const useSecure = port === 465;

const CONTACT_PHONE = process.env.EMAIL_CONTACT_PHONE || "+91 7523 666 366";
const CONTACT_EMAIL = process.env.EMAIL_CONTACT_EMAIL || "shri@shrisawariyamart.com";
const CONTACT_ADDRESS = process.env.EMAIL_CONTACT_ADDRESS || "Shri Sawariya Mart, Madhya Pradesh, India";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.shrisawariyamart.com";

const transporter = nodemailer.createTransport({
  host,
  port,
  secure: useSecure,
  requireTLS: !useSecure,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  logger: true,
  debug: true,
  tls: {
    rejectUnauthorized: false,
  },
});

transporter
  .verify()
  .then(() => console.log("SMTP connected successfully"))
  .catch((err) => console.error("SMTP connection error:", err));

export async function sendMail(to: string, subject: string, html: string) {
  return transporter.sendMail({
    from: FROM,
    to,
    subject,
    html,
  });
}

function buildEmailLayout({ title, subtitle, body }: { title: string; subtitle: string; body: string }) {
  const logoUrl = process.env.EMAIL_LOGO_URL || "https://www.shrisawariyamart.com/logo/logo.png";

  return `
  <div style="margin:0;padding:24px;background:#f5f8f6;font-family:Arial,sans-serif;color:#0f172a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;margin:0 auto;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #dbe7df;">
      <tr>
        <td style="background:linear-gradient(120deg,#14532d,#16a34a);padding:26px 24px;color:#ffffff;text-align:center;">
          <img src="${logoUrl}" alt="Shri Sawariya Mart" style="width:74px;height:74px;border-radius:14px;background:#ffffff;padding:6px;object-fit:contain;" />
          <h1 style="margin:14px 0 6px;font-size:24px;line-height:1.3;">${title}</h1>
          <p style="margin:0;font-size:14px;opacity:0.95;">${subtitle}</p>
        </td>
      </tr>
      <tr>
        <td style="padding:24px;">${body}</td>
      </tr>
      <tr>
        <td style="padding:0 24px 24px;">
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:14px 16px;">
            <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#334155;">Contact Us</p>
            <p style="margin:0 0 4px;font-size:13px;color:#475569;">Phone: ${CONTACT_PHONE}</p>
            <p style="margin:0 0 4px;font-size:13px;color:#475569;">Email: ${CONTACT_EMAIL}</p>
            <p style="margin:0 0 4px;font-size:13px;color:#475569;">Address: ${CONTACT_ADDRESS}</p>
            <p style="margin:0;font-size:13px;color:#475569;">Website: <a href="${SITE_URL}" style="color:#0f766e;text-decoration:none;">${SITE_URL}</a></p>
          </div>
        </td>
      </tr>
      <tr>
        <td style="background:#0f172a;color:#cbd5e1;padding:12px 16px;text-align:center;font-size:12px;">
          Copyright ${new Date().getFullYear()} Shri Sawariya Mart. All rights reserved.
        </td>
      </tr>
    </table>
  </div>
  `;
}

export function otpEmailTemplate({
  name,
  otp,
  purpose = "verification",
}: {
  name?: string;
  otp: string;
  purpose?: string;
}) {
  const body = `
    <p style="margin:0 0 12px;font-size:15px;color:#334155;">Hi <strong>${name || "there"}</strong>,</p>
    <p style="margin:0 0 14px;font-size:15px;color:#334155;line-height:1.65;">Use the OTP below for <strong>${purpose}</strong>. For your safety, do not share this code with anyone.</p>
    <div style="margin:0 0 16px;text-align:center;">
      <span style="display:inline-block;background:#ecfdf5;border:1px solid #86efac;color:#14532d;padding:12px 20px;border-radius:12px;font-size:30px;letter-spacing:7px;font-weight:700;">${otp}</span>
    </div>
    <p style="margin:0;font-size:13px;color:#64748b;">This OTP expires in 24 hours. If you did not request this, please ignore this email.</p>
  `;

  return buildEmailLayout({
    title: "OTP Verification",
    subtitle: "Secure login and account protection",
    body,
  });
}

export function welcomeEmailTemplate({ name }: { name?: string }) {
  const body = `
    <p style="margin:0 0 12px;font-size:15px;color:#334155;">Hi <strong>${name || "friend"}</strong>,</p>
    <p style="margin:0 0 16px;font-size:15px;color:#334155;line-height:1.65;">Your account is now active. You can start exploring fresh vegetables and fruits with smooth mobile-friendly ordering.</p>
    <div style="text-align:center;margin-bottom:14px;">
      <a href="${SITE_URL}" style="display:inline-block;background:#16a34a;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:10px;font-weight:700;font-size:14px;">Start Shopping</a>
    </div>
    <p style="margin:0;font-size:13px;color:#64748b;">Need help? Reach out to us through Contact Us and we will assist you quickly.</p>
  `;

  return buildEmailLayout({
    title: "Welcome to Shri Sawariya Mart",
    subtitle: "Fresh produce, trusted quality, fast delivery",
    body,
  });
}
