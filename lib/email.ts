import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST || "smtp.ethereal.email",
  port: parseInt(process.env.EMAIL_SERVER_PORT || "587"),
  secure: process.env.EMAIL_SERVER_SECURE === "true",
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
});

// Verify SMTP connection
if (process.env.NODE_ENV !== "test") {
  transporter.verify((error, success) => {
    if (error) {
      console.error("SMTP configuration error:", error);
    } else {
      console.log("SMTP server is ready to send emails");
    }
  });
}

const logoUrl = "https://meeting-app-navy.vercel.app/assets/logo.png";

// ✅ Send verification email
export async function sendVerificationCodeEmail(
  email: string,
  code: string,
  username: string
) {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: "Your Email Verification Code for Tuluvluy",
    text: `Your verification code is: ${code}\nThis code will expire in 1 hour. Your username is: ${username}`,
    html: `
      <div style="font-family: Arial, sans-serif; background-color: #f9f9fb; padding: 40px 0; text-align: center;">
        <div style="background-color: #ffffff; margin: 0 auto; padding: 40px 20px; max-width: 500px; border-radius: 12px; box-shadow: 0 4px 14px rgba(0,0,0,0.05);">
          <img src="${logoUrl}" alt="Tuluvluy Logo" style="width: 50px; margin-bottom: 20px;" />
          <h2 style="margin-bottom: 20px; color: #000000;">Verify your Tuluvluy sign-up</h2>
          <p style="color: #000000;">We have received a sign-up attempt with the following code. Please enter it in the browser window where you started signing up for Tuluvluy.</p>
          <div style="font-size: 32px; font-weight: bold; background-color: #f0f0f0; padding: 16px; margin: 30px auto; width: fit-content; border-radius: 8px; color: #000000;">
            ${code}
          </div>
          <p style="color: #000000;">If you did not attempt to sign up but received this email, please disregard it.<br/>This code will remain active for <strong>1 hour</strong>.</p>
        </div>
        <div style="margin-top: 20px; color: #aaa; font-size: 12px;">
          &copy; ${new Date().getFullYear()} Tuluvluy. All rights reserved.
        </div>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Verification code email sent: %s", info.messageId);
    if (nodemailer.getTestMessageUrl(info)) {
      console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    }
  } catch (error) {
    console.error("Error sending verification code email:", error);
    throw new Error("Could not send verification code email.");
  }
}

// 🔄 Send password reset email (with #000000 text color)
export async function sendPasswordResetCodeEmail(
  email: string,
  name: string,
  code: string,
  username: string
) {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: "Your Password Reset Code for Tuluvluy",
    text: `Hello ${name},\n\nYour password reset code is: ${code}\n\nThis code will expire in 10 minutes.\n\nIf you did not request this, please ignore this email.\n\nThanks,\nThe Tuluvluy Team. Your username is: ${username}`,
    html: `
      <div style="font-family: Arial, sans-serif; background-color: #f9f9fb; padding: 40px 0; text-align: center;">
        <div style="background-color: #ffffff; margin: 0 auto; padding: 40px 20px; max-width: 500px; border-radius: 12px; box-shadow: 0 4px 14px rgba(0,0,0,0.05);">
          <img src="${logoUrl}" alt="Tuluvluy Logo" style="width: 50px; margin-bottom: 20px;" />
          <h2 style="margin-bottom: 20px; color: #000000;">Reset your Tuluvluy password</h2>
          <p style="color: #000000;">Hi <strong>${name}</strong>,</p>
          <p style="color: #000000;">You requested to reset your password. Use the following code:</p>
          <div style="font-size: 32px; font-weight: bold; background-color: #f0f0f0; padding: 16px; margin: 30px auto; width: fit-content; border-radius: 8px; color: #000000;">
            ${code}
          </div>
          <p style="color: #000000;">This code is valid for <strong>10 minutes</strong>.</p>
          <p style="color: #000000;">If you didn’t request a password reset, you can safely ignore this email.</p>
        </div>
        <div style="margin-top: 20px; color: #aaa; font-size: 12px;">
          &copy; ${new Date().getFullYear()} Tuluvluy. All rights reserved.
        </div>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Password reset code email sent: %s", info.messageId);
    if (nodemailer.getTestMessageUrl(info)) {
      console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    }
  } catch (error) {
    console.error("Error sending password reset code email:", error);
    throw new Error("Could not send password reset code email.");
  }
}
