// src/app/api/utils/sendMail.ts
import nodemailer from "nodemailer";

const FROM = process.env.EMAIL_FROM || process.env.EMAIL_USER;

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.EMAIL_SMTP_PORT || 465),
  secure: (process.env.EMAIL_SMTP_PORT || "465") === "465",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function sendMail(to: string, subject: string, html: string) {
  return transporter.sendMail({
    from: FROM,
    to,
    subject,
    html,
  });
}

export function otpEmailTemplate({ name, otp, purpose = "verification" }: { name: string; otp: string; purpose?: string }) {
  return `
    <div>
      <p>Hi ${name || "there"},</p>
      <p>Your OTP for ${purpose} is:</p>
      <h2>${otp}</h2>
      <p>This code expires in 10 minutes.</p>
      <p>If you didn't request this, ignore this email.</p>
    </div>
  `;
}

export function welcomeEmailTemplate({ name }: { name: string }) {
  return `
    <div>
      <h1>Welcome, ${name}!</h1>
      <p>Thanks for joining. We're glad you're here.</p>
    </div>
  `;
}
