const express = require('express');
const axios = require('axios');
const userRouter = express();
userRouter.use(express.json());

userRouter.post('/send-email', async (req, res) => {
  const email = req.body.email;
  const otp = Math.floor(100000 + Math.random() * 900000).toString(); // Generate 6-digit OTP

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
    res.status(200).json({ message: 'Email sent successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to send email', error: error.message });
  }
});

module.exports = userRouter;

