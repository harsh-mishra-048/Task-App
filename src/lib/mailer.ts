import nodemailer from "nodemailer";

export async function sendInviteEmail(to: string, invitorEmail: string, token: string) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const appUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const acceptLink = `${appUrl}/api/connections/accept?token=${token}`;

  const mailOptions = {
    from: `"Todo App" <${process.env.SMTP_USER}>`,
    to,
    subject: `You have been invited to view tasks by ${invitorEmail}`,
    text: `Hello! ${invitorEmail} has invited you to view their tasks on Todo App. Please accept the invite by clicking this link: ${acceptLink}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333;">You've been invited!</h2>
        <p style="font-size: 16px; color: #555;">
          <strong>${invitorEmail}</strong> has invited you to view their schedule and tasks on Todo App.
        </p>
        <div style="margin: 30px 0;">
          <a href="${acceptLink}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
            Accept Invitation
          </a>
        </div>
        <p style="font-size: 14px; color: #777;">
          If the button doesn't work, copy and paste this link into your browser:<br/>
          <a href="${acceptLink}">${acceptLink}</a>
        </p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}
