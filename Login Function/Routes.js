var express = require("express");
var userRouter = express.Router();
var UserController = require("./controller");
var mongoose = require("mongoose");

userRouter.post("/login", async (req, res) => {
    const allParams = req.body;
    var callLoginMethod = await UserController.userLogin(allParams);
    res.send({
        status: callLoginMethod.status,
        message: callLoginMethod.message,
        data: callLoginMethod.data
    })
})

module.exports = userRouter