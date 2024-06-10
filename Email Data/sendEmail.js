const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const userRouter = express();
userRouter.use(express.json());

const algorithm = 'aes-256-cbc'; // Encryption algorithm
const secretKey = crypto.randomBytes(32); // Encryption key (should be 32 bytes for aes-256)
const iv = crypto.randomBytes(16); // Initialization vector

// Function to encrypt OTP
const encrypt = (text) => {
  const cipher = crypto.createCipheriv(algorithm, secretKey, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}:${encrypted}`;
};

userRouter.post('/send-email', async (req, res) => {
  const email = req.body.email;
  const otp = Math.floor(100000 + Math.random() * 900000).toString(); // Generate 6-digit OTP
  const encryptedOtp = encrypt(otp); // Encrypt the OTP

  const data = JSON.stringify({
    sender: {
      name: "Amit Varshney",
      email: "amitvarshney30@gmail.com",
    },
    to: [
      {
        email: email,
        name: email,
      },
    ],
    subject: "Password Reset - Kibo Tool",
    htmlContent: `${otp} is the one time password to reset your password. This one time password will be valid for next 10 minutes.`,
  });

  const config = {
    method: "post",
    url: "https://api.brevo.com/v3/smtp/email",
    headers: {
      accept: "application/json",
      "api-key": process.env.BREVO_API_KEY,
      "content-type": "application/json",
    },
    data: data,
  };

  try {
    const response = await axios.request(config);
    res.status(200).json({ message: 'Email sent successfully', UniqueID: encryptedOtp });
  } catch (error) {
    res.status(500).json({ message: 'Failed to send email', error: error.message });
  }
});

module.exports = userRouter;
