const express = require('express');
var CommonFunc = require("../commonfunction");
var UserSchema = require("../Login Function/Model").usermodel;
const userRouter = express();
userRouter.use(express.json());

userRouter.post("/validate-otp", async (req, res) => {
  const email = req.body.email;
  const otp = req.body.otp;

  console.log(email);
  console.log(otp);

  try {
    const user = await UserSchema.findOne({ email: email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let decryptedOtp = await CommonFunc.decryptPassword(otp, user.otp);
    if (decryptedOtp === true) {
      return res.status(200).json({ message: 'OTP verified successfully' });
    } else {
      return res.status(400).json({ message: 'Invalid OTP' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Failed to verify OTP', error: error.message });
  }
});

module.exports = userRouter;
