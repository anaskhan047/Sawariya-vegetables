// send-test.js (CommonJS)
require("dotenv").config();
const nodemailer = require("nodemailer");

const { EMAIL_SMTP_HOST, EMAIL_SMTP_PORT, EMAIL_FROM, TEST_RECIPIENT } = process.env;
const EMAIL_PASS = 'Shri@1234'; 
const EMAIL_USER = 'shri@shrisawariyamart.com'; 
if (!EMAIL_USER || !EMAIL_PASS) {
  console.error("ERROR: EMAIL_USER or EMAIL_PASS not set in .env");
  process.exit(1);
}

const host = EMAIL_SMTP_HOST || "smtpout.secureserver.net";
const port = Number(EMAIL_SMTP_PORT || 465);
const secure = port === 465;

const transporter = nodemailer.createTransport({
  host, port, secure, requireTLS: !secure,
  auth: { user: EMAIL_USER, pass: EMAIL_PASS },
  logger: true, debug: true, tls: { rejectUnauthorized: false }
});

(async () => {
  try {
    await transporter.verify();
    console.log("VERIFY OK");

    const to = TEST_RECIPIENT || EMAIL_USER;
    const info = await transporter.sendMail({
      from: `"Shri Sawariya Mart" <${EMAIL_FROM || EMAIL_USER}>`,
      to,
      subject: "Deliverability test",
      text: "Plain text test",
      html: "<b>HTML test</b>",
      envelope: { from: EMAIL_FROM || EMAIL_USER, to }
    });

    console.log("SEND INFO:", {
      accepted: info.accepted,
      rejected: info.rejected,
      response: info.response,
      messageId: info.messageId
    });
  } catch (err) {
    console.error("SEND ERROR:", err);
  } finally {
    transporter.close();
  }
})();
