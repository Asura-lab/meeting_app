import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST || "smtp.ethereal.email",
  port: parseInt(process.env.EMAIL_SERVER_PORT || "587"),
  secure: process.env.EMAIL_SERVER_SECURE === "true", // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
});

// Verify SMTP connection on startup
if (process.env.NODE_ENV !== "test") {
  // Avoid running verify in test environments if it causes issues
  transporter.verify((error, success) => {
    if (error) {
      console.error("SMTP configuration error:", error);
    } else {
      console.log("SMTP server is ready to send emails");
    }
  });
}

export async function sendVerificationCodeEmail(email: string, code: string) {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: "Your Email Verification Code for Let's Talk",
    text: `Your verification code is: ${code}\nThis code will expire in 1 hour.`,
    html: `<p>Welcome to Let's Talk!</p><p>Your verification code is: <strong>${code}</strong></p><p>This code will expire in 1 hour.</p>`,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Verification code email sent: %s", info.messageId);
    // Log preview URL for Ethereal accounts
    if (nodemailer.getTestMessageUrl(info)) {
      console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    }
  } catch (error) {
    console.error("Error sending verification code email:", error);
    throw new Error("Could not send verification code email.");
  }
}
