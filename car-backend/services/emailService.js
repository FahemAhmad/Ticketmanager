const nodemailer = require("nodemailer");

async function sendEmail(to, subject, text) {
  try {
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: "sorteosmg1@gmail.com",
        pass: "trfxsjbcdkoetypy",
      },
    });

    const mailOptions = {
      from: "your_email_address",
      to,
      cc: "faheemahmad0108@gmail.com",
      subject,
      text,
    };

    await transporter.sendMail(mailOptions);

    console.log(`Email sent to ${to}`);
  } catch (error) {
    console.error(`Error sending email: ${error}`);
    throw new Error("Failed to send email");
  }
}

module.exports = { sendEmail };
