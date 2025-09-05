const nodemailer = require('nodemailer');

// Configure your email transporter (use your preferred email service)
const transporter = nodemailer.createTransport({
  service: 'gmail', // or your email provider
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Send donation success notification
const sendDonationSuccess = async (req, res) => {
  try {
    const { email, campaign, donationAmount, expectedReturn, maturityDate, duration } = req.body;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: `Donation Confirmation - ${campaign}`,
      html: `
        <h2>Donation Successful!</h2>
        <p>Thank you for your donation to <strong>${campaign}</strong></p>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Investment Details:</h3>
          <p><strong>Donation Amount:</strong> $${donationAmount.toLocaleString()}</p>
          <p><strong>Expected Return:</strong> $${expectedReturn.toLocaleString()}</p>
          <p><strong>Investment Duration:</strong> ${duration} months</p>
          <p><strong>Maturity Date:</strong> ${maturityDate}</p>
        </div>
        <p>Your investment will mature on ${maturityDate}. You'll receive your returns automatically.</p>
        <p>Thank you for being part of Elevate Network!</p>
      `
    };

    await transporter.sendMail(mailOptions);
    res.json({ success: true, message: 'Donation notification sent successfully' });
  } catch (error) {
    console.error('Error sending donation notification:', error);
    res.status(500).json({ success: false, message: 'Failed to send notification' });
  }
};

// Send loan eligibility notification
const sendLoanEligibility = async (req, res) => {
  try {
    const { email, name, directReferrals, totalDonations, maxLoanAmount } = req.body;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Congratulations! You\'re Now Loan Eligible',
      html: `
        <h2>Loan Eligibility Notification</h2>
        <p>Dear ${name},</p>
        <p>Congratulations! You now meet our loan eligibility requirements:</p>
        <div style="background-color: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Your Qualifications:</h3>
          <p>✅ <strong>Direct Referrals:</strong> ${directReferrals} (Required: 50)</p>
          <p>✅ <strong>Total Donations:</strong> $${totalDonations.toLocaleString()} (Required: $1,300)</p>
          <p><strong>Maximum Loan Amount:</strong> $${maxLoanAmount.toLocaleString()}</p>
        </div>
        <p>You can now apply for a loan up to $${maxLoanAmount.toLocaleString()}. Contact our support team to begin your application.</p>
        <p>Best regards,<br>Elevate Network Team</p>
      `
    };

    await transporter.sendMail(mailOptions);
    res.json({ success: true, message: 'Loan eligibility notification sent successfully' });
  } catch (error) {
    console.error('Error sending loan eligibility notification:', error);
    res.status(500).json({ success: false, message: 'Failed to send notification' });
  }
};

// Send global notification
const sendGlobalNotification = async (req, res) => {
  try {
    const { message, recipients } = req.body;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      bcc: recipients, // Send to multiple recipients
      subject: 'Important Announcement - Elevate Network',
      html: `
        <h2>Elevate Network Announcement</h2>
        <div style="background-color: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
          ${message}
        </div>
        <p>Best regards,<br>Elevate Network Admin Team</p>
      `
    };

    await transporter.sendMail(mailOptions);
    res.json({ 
      success: true, 
      message: `Global notification sent to ${recipients.length} members` 
    });
  } catch (error) {
    console.error('Error sending global notification:', error);
    res.status(500).json({ success: false, message: 'Failed to send global notification' });
  }
};

module.exports = {
  sendDonationSuccess,
  sendLoanEligibility,
  sendGlobalNotification
};