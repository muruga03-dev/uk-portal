// utils/notificationService.js
import nodemailer from "nodemailer";
import twilio from "twilio";

// =======================
// Email Setup (Nodemailer)
// =======================
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, // Gmail address
    pass: process.env.EMAIL_PASS, // Gmail App Password
  },
});

// =======================
// SMS Setup (Twilio)
// =======================
const twilioClient = twilio(
  process.env.TWILIO_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// =======================
// Send Email Reminder
// =======================
export const sendTaxEmailReminder = async (to, familyName, month, amount) => {
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
    console.log(`📧 Tax reminder email sent to ${to}`);
  } catch (err) {
    console.error("❌ Error sending email:", err.message);
  }
};

// =======================
// Send SMS Reminder
// =======================
export const sendTaxSMSReminder = async (phone, familyName, month, amount) => {
  try {
    await twilioClient.messages.create({
      body: `Hello ${familyName}, your tax for ${month} is pending. Amount: ₹${amount}. Please check your Family Dashboard.`,
      from: process.env.TWILIO_PHONE, // Twilio phone number
      to: phone,
    });

    console.log(`📱 Tax reminder SMS sent to ${phone}`);
  } catch (err) {
    console.error("❌ Error sending SMS:", err.message);
  }
};
