var express = require("express");
var userRouter = express.Router();
var jwt = require("jsonwebtoken");
const crypto = require('crypto');
var mongoose = require("mongoose");


const generateRandomKey = () => {
  return crypto.randomBytes(32).toString('hex'); // Generates a 32-byte (256-bit) random key in hexadecimal format
};

const secretKey = generateRandomKey();

userRouter.post('/api/generateToken', (req, res) => {
    try {
      // Generate a JWT token
      const token = jwt.sign({ /* payload data */ }, secretKey, { expiresIn: '1h' }); // Change expiresIn as needed
      
      // Send the token to the frontend
      res.json({ token });
    } catch (error) {
      console.error('Error generating token:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
  

module.exports = userRouter