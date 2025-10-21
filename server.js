const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: process.env.CORS_ORIGIN || "*", methods: ["POST"] }));
app.use(express.json());

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

transporter.verify((error) => {
  if (error) {
    console.error("Email transporter configuration error:", error.message);
  } else {
    console.log("Email transporter ready to send messages.");
  }
});

app.post("/api/contact", async (req, res) => {
  const { name, phone, email, message } = req.body || {};

  if (!name || !email) {
    return res.status(400).json({ success: false, error: "Name and email are required." });
  }

  const mailOptions = {
    from: `"Align with Sophy Website" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
    to: "info@alignwithsophy.com",
    subject: "New Align with Sophy Inquiry",
    replyTo: email,
    text: `
Name: ${name}
Email: ${email}
Phone: ${phone || "Not provided"}

Message:
${message || "No additional details submitted."}
    `.trim(),
  };

  try {
    await transporter.sendMail(mailOptions);
    res.json({ success: true });
  } catch (err) {
    console.error("Failed to send contact email:", err.message);
    res.status(500).json({ success: false, error: "Unable to send email at this time." });
  }
});

app.listen(PORT, () => {
  console.log(`Align with Sophy backend listening on port ${PORT}`);
});
