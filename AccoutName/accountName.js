var express = require("express");
var userRouter = express.Router();
var UserController = require("../Ticket/Controller");
var mongoose = require("mongoose");

userRouter.get("/account-name", async (req, res) => {
    var callLoginMethod = await UserController.AccountName();
    res.send({
        status: callLoginMethod.status,
        message: callLoginMethod.message,
        data: callLoginMethod.data
    })
})

module.exports = userRouter