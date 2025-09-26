import nodemailer from "nodemailer";
// import twilio from "twilio"; // if you want SMS

export async function sendEmail(to, subject, text) {
  // Configure transporter using env Gmail (example)
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  const info = await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject,
    text
  });

  return info;
}

export async function sendTaxReminder(family) {
  // Placeholder: send email and/or SMS
  try {
    if (family.email) {
      await sendEmail(
        family.email,
        "Udaikulam: Pending Tax Reminder",
        `Dear ${family.leaderName}, your tax for month(s) is pending. Please pay: ${JSON.stringify(family.taxHistory.filter(t=>!t.paid))}`
      );
    }
    // If Twilio configured, send SMS here.
  } catch (err) {
    console.error("sendTaxReminder error:", err);
  }
}
