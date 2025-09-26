// utils/emailService.js
import nodemailer from "nodemailer";

// =======================
// Configure Nodemailer Transport
// =======================
// Use Gmail or any SMTP provider
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, // your Gmail address
    pass: process.env.EMAIL_PASS, // app password (not your real Gmail password!)
  },
});

// =======================
// Send Tax Reminder Email
// =======================
export const sendTaxReminder = async (to, familyName, month, amount) => {
  try {
    const mailOptions = {
      from: `"Udaikulam Village Portal" <${process.env.EMAIL_USER}>`,
      to,
      subject: `Pending Tax Reminder - ${month}`,
      html: `
        <h3>Hello ${familyName},</h3>
        <p>This is a reminder that your tax for <strong>${month}</strong> is pending.</p>
        <p>Amount Due: <strong>₹${amount}</strong></p>
        <p>Please log in to your <a href="http://localhost:3000/family-dashboard">Family Dashboard</a> to pay or check details.</p>
        <br/>
        <p>Regards,<br/>Udaikulam Village Office</p>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`📧 Tax reminder sent to ${to}`);
  } catch (err) {
    console.error("❌ Error sending email:", err.message);
  }
};
