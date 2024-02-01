var express = require("express");
var userRouter = express.Router();
var UserController = require("../Register Function/controller");
var mongoose = require("mongoose");

userRouter.post("/register", async (req, res) => {
    const allParams = req.body;
    var callLoginMethod = await UserController.userRegister(allParams);
    res.send({
        status: callLoginMethod.status,
        message: callLoginMethod.message,
        data: callLoginMethod.data
    })
})

module.exports = userRouter
