const express = require('express');
const axios = require('axios');
const otpGenerator = require('otp-generator')
var UserSchema = require("../Login Function/Model").usermodel;
const crypto = require('crypto');
const userRouter = express();
var CommonFunc = require("../commonfunction");
userRouter.use(express.json());

userRouter.post('/send-email', async (req, res) => {
  const email = req.body.email;
  // const emailData = req.body.emailData;
  const otp = otpGenerator.generate(6, { digits: true, alphabets: false, upperCaseAlphabets: false, specialChars: false, lowerCaseAlphabets: false }); // Encrypt the OTP
  let encryptOTP = await CommonFunc.encryptPassword(otp);
  

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
    htmlContent: `${otp} is the one time password to reset your password.`,
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
    const matchUser = await UserSchema.findOneAndUpdate(
      { email: email },
      { otp: encryptOTP, otpCreatedAt: new Date() },
      { new: true, fields: { createdOn: 0, __v: 0 } }
    );
    
    if (matchUser) {
      const response = await axios.request(config);
      res.status(200).json({ message: 'Email sent successfully', UniqueID: encryptOTP });
    } else {
      res.status(202).json({ status: 205, message: "This Email ID is not registered yet. Please use the correct email or create new account" });
    }
  } catch (error) {
    res.status(500).json({ message: 'Failed to send email', error: error.message });
  }
});
module.exports = userRouter;
